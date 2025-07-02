import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// Tipos alias para union types
type MessageStatus = 'active' | 'hidden' | 'blocked';
type ModerationAction = 'allow' | 'hide' | 'block';
type ChannelType = 'general' | 'emergency' | 'education' | 'support';

// Tipos locais
interface ChatMessage {
  id?: string;
  uid: string;
  userName: string;
  message: string;
  timestamp: any;
  channelId: string;
  status: MessageStatus;
  aiModeration?: {
    score: number;
    flags: string[];
    action: ModerationAction;
    processedAt: any;
  };
  reportedBy?: string[];
  moderatedBy?: string;
  moderationReason?: string;
}

interface ChatChannel {
  id?: string;
  name: string;
  type: ChannelType;
  isActive: boolean;
  participants: string[];
  moderators: string[];
  createdAt: any;
  settings: {
    allowAnonymous: boolean;
    requireModeration: boolean;
    maxMessageLength: number;
  };
}

const db = getFirestore();

/**
 * RN05: Enviar mensagem no chat (com moderação automática)
 */
export const sendChatMessage = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // RN04: Verificar se usuário está autenticado
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado');
  }

  const userData = userDoc.data();
  const { channelId, message } = request.data;

  // Validar dados
  if (!channelId || !message || message.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Canal e mensagem são obrigatórios');
  }

  // Verificar se canal existe
  const channelDoc = await db.collection('chatChannels').doc(channelId).get();
  if (!channelDoc.exists) {
    throw new HttpsError('not-found', 'Canal não encontrado');
  }

  const channelData = channelDoc.data() as ChatChannel;

  // Verificar se usuário pode participar do canal
  if (!channelData.settings.allowAnonymous && 
      !channelData.participants.includes(uid) &&
      userData?.role === 'cidadao') {
    throw new HttpsError('permission-denied', 'Usuário não autorizado neste canal');
  }

  // Verificar limite de caracteres
  if (message.length > (channelData.settings.maxMessageLength || 500)) {
    throw new HttpsError('invalid-argument', 'Mensagem excede limite de caracteres');
  }

  // Criar mensagem
  const chatMessage: Omit<ChatMessage, 'id'> = {
    uid,
    userName: userData?.displayName ?? userData?.email ?? 'Usuário Anônimo',
    message: message.trim(),
    timestamp: new Date(),
    channelId,
    status: channelData.settings.requireModeration ? 'hidden' : 'active',
    reportedBy: []
  };

  const docRef = await db.collection('chatMessages').add(chatMessage);

  // Adicionar usuário aos participantes se não estiver
  if (!channelData.participants.includes(uid)) {
    await db.collection('chatChannels').doc(channelId).update({
      participants: FieldValue.arrayUnion(uid)
    });
  }

  logger.info(`Chat message sent: ${docRef.id}`, {
    userId: uid,
    messageId: docRef.id,
    channelId,
    requiresModeration: channelData.settings.requireModeration,
  });

  return { success: true, messageId: docRef.id };
});

/**
 * RN05: Moderação automática por IA (trigger)
 */
export const moderateChatMessage = onDocumentCreated('chatMessages/{messageId}', async (event) => {
  const messageData = event.data?.data() as ChatMessage;
  const messageId = event.params.messageId;

  if (!messageData) return;

  try {
    // Analisar mensagem com IA
    const moderationResult = await moderateMessageWithAI(messageData.message);
    
    // RN09: Registrar decisão da IA em logs
    const aiLog = {
      type: 'chat_moderation',
      entityId: messageId,
      aiDecision: moderationResult.action,
      confidence: moderationResult.score,
      reasoning: moderationResult.flags,
      inputData: {
        message: messageData.message,
        channelId: messageData.channelId,
        userId: messageData.uid
      },
      outputData: moderationResult,
      processedAt: new Date(),
      reviewStatus: 'pending'
    };

    await db.collection('aiLogs').add(aiLog);

    // Atualizar mensagem com resultado da moderação
    const updateData: Partial<ChatMessage> = {
      aiModeration: {
        score: moderationResult.score,
        flags: moderationResult.flags,
        action: moderationResult.action,
        processedAt: new Date(),
      }
    };

    // RN05: Aplicar ação da moderação
    if (moderationResult.action === 'hide') {
      updateData.status = 'hidden';
    } else if (moderationResult.action === 'block') {
      updateData.status = 'blocked';
    } else if (moderationResult.action === 'allow' && messageData.status === 'hidden') {
      updateData.status = 'active';
    }

    await db.collection('chatMessages').doc(messageId).update(updateData);

    // Se mensagem foi bloqueada, notificar moderadores
    if (moderationResult.action === 'block') {
      await notifyModerators(messageData.channelId, messageId, moderationResult.flags);
    }

    logger.info(`Chat message moderated: ${messageId}`, {
      messageId,
      aiScore: moderationResult.score,
      action: moderationResult.action,
      flags: moderationResult.flags,
    });

  } catch (error) {
    logger.error(`Error moderating chat message: ${messageId}`, error);
  }
});

/**
 * RN05: Reportar mensagem inadequada
 */
export const reportChatMessage = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { messageId, reason } = request.data;

  const messageDoc = await db.collection('chatMessages').doc(messageId).get();
  if (!messageDoc.exists) {
    throw new HttpsError('not-found', 'Mensagem não encontrada');
  }

  const messageData = messageDoc.data() as ChatMessage;

  // Verificar se usuário já reportou
  if (messageData.reportedBy?.includes(uid)) {
    throw new HttpsError('already-exists', 'Usuário já reportou esta mensagem');
  }

  // Adicionar usuário à lista de reports
  await db.collection('chatMessages').doc(messageId).update({
    reportedBy: FieldValue.arrayUnion(uid)
  });

  // Se muitos reports, ocultar automaticamente
  const totalReports = (messageData.reportedBy?.length ?? 0) + 1;
  if (totalReports >= 3) {
    await db.collection('chatMessages').doc(messageId).update({
      status: 'hidden',
      moderationReason: 'Múltiplos reports da comunidade'
    });

    // Notificar moderadores
    await notifyModerators(messageData.channelId, messageId, [`${totalReports} reports da comunidade: ${reason}`]);
  }

  logger.info(`Chat message reported: ${messageId}`, {
    reporterId: uid,
    messageId,
    reason,
    totalReports,
  });

  return { success: true };
});

/**
 * Moderação manual por moderadores
 */
export const moderateMessage = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { messageId, action, reason } = request.data; // action: 'approve' | 'hide' | 'block'

  // Verificar se é moderador/admin
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado');
  }

  const userData = userDoc.data();
  if (!['admin', 'defesa_civil'].includes(userData?.role)) {
    // Verificar se é moderador do canal
    const messageDoc = await db.collection('chatMessages').doc(messageId).get();
    if (!messageDoc.exists) {
      throw new HttpsError('not-found', 'Mensagem não encontrada');
    }

    const messageData = messageDoc.data() as ChatMessage;
    const channelDoc = await db.collection('chatChannels').doc(messageData.channelId).get();
    const channelData = channelDoc.data() as ChatChannel;

    if (!channelData.moderators.includes(uid)) {
      throw new HttpsError('permission-denied', 'Usuário não é moderador deste canal');
    }
  }

  const updateData: Partial<ChatMessage> = {
    moderatedBy: uid,
    moderationReason: reason
  };

  if (action === 'approve') {
    updateData.status = 'active';
  } else if (action === 'hide') {
    updateData.status = 'hidden';
  } else if (action === 'block') {
    updateData.status = 'blocked';
  }

  await db.collection('chatMessages').doc(messageId).update(updateData);

  logger.info(`Message manually moderated: ${messageId}`, {
    moderatorId: uid,
    messageId,
    action,
    reason,
  });

  return { success: true };
});

/**
 * Obter mensagens do chat
 */
export const getChatMessages = onCall(async (request) => {
  const { uid } = request.auth || {};
  
  const { channelId, limit = 50, startAfter } = request.data ?? {};

  if (!channelId) {
    throw new HttpsError('invalid-argument', 'Canal é obrigatório');
  }

  // Verificar acesso ao canal
  if (uid) {
    const channelDoc = await db.collection('chatChannels').doc(channelId).get();
    const channelData = channelDoc.data() as ChatChannel;
    
    if (!channelData.settings.allowAnonymous && !channelData.participants.includes(uid)) {
      throw new HttpsError('permission-denied', 'Usuário não autorizado neste canal');
    }
  }

  let query = db.collection('chatMessages')
    .where('channelId', '==', channelId)
    .where('status', '==', 'active') // Apenas mensagens ativas
    .orderBy('timestamp', 'desc')
    .limit(limit);

  if (startAfter) {
    const startAfterDoc = await db.collection('chatMessages').doc(startAfter).get();
    query = query.startAfter(startAfterDoc) as any;
  }

  const snapshot = await query.get();
  const messages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Reverter para ordem cronológica
  const reversedMessages = [...messages].reverse();
  return { messages: reversedMessages };
});

/**
 * Criar canal de chat
 */
export const createChatChannel = onCall(async (request) => {
  const { uid } = request.auth || {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar se é admin ou defesa civil
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado');
  }

  const userData = userDoc.data();
  if (!['admin', 'defesa_civil'].includes(userData?.role)) {
    throw new HttpsError('permission-denied', 'Apenas administradores podem criar canais');
  }

  const { name, type, settings } = request.data;

  const channel: Omit<ChatChannel, 'id'> = {
    name,
    type: type ?? 'general',
    isActive: true,
    participants: [uid],
    moderators: [uid],
    createdAt: new Date(),
    settings: {
      allowAnonymous: settings?.allowAnonymous ?? false,
      requireModeration: settings?.requireModeration ?? false,
      maxMessageLength: settings?.maxMessageLength ?? 500,
    }
  };

  const docRef = await db.collection('chatChannels').add(channel);

  logger.info(`Chat channel created: ${docRef.id}`, {
    creatorId: uid,
    channelId: docRef.id,
    name,
    type,
  });

  return { success: true, channelId: docRef.id };
});

/**
 * Moderação de mensagem com IA (função auxiliar)
 */
async function moderateMessageWithAI(message: string): Promise<{
  score: number;
  action: 'allow' | 'hide' | 'block';
  flags: string[];
}> {
  const flags: string[] = [];
  let score = 0; // 0 = seguro, 1 = perigoso
  
  const lowerMessage = message.toLowerCase();
  
  // Palavras ofensivas/inadequadas
  const offensiveWords = ['idiota', 'burro', 'imbecil', 'estúpido', 'merda'];
  const hateSpeech = ['ódio', 'racista', 'preconceito'];
  const spamWords = ['clique aqui', 'promoção', 'ganhe dinheiro', 'compre agora'];
  
  // Verificar palavrões e linguagem ofensiva
  const offensiveCount = offensiveWords.filter(word => lowerMessage.includes(word)).length;
  if (offensiveCount > 0) {
    score += offensiveCount * 0.3;
    flags.push(`Linguagem ofensiva (${offensiveCount} ocorrências)`);
  }
  
  // Verificar discurso de ódio
  const hateCount = hateSpeech.filter(word => lowerMessage.includes(word)).length;
  if (hateCount > 0) {
    score += hateCount * 0.5;
    flags.push(`Possível discurso de ódio (${hateCount} ocorrências)`);
  }
  
  // Verificar spam
  const spamCount = spamWords.filter(word => lowerMessage.includes(word)).length;
  if (spamCount > 0) {
    score += spamCount * 0.4;
    flags.push(`Possível spam (${spamCount} ocorrências)`);
  }
  
  // Verificar texto em maiúsculas (possível grito)
  const upperCaseRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (upperCaseRatio > 0.5 && message.length > 10) {
    score += 0.2;
    flags.push('Texto excessivamente em maiúsculas');
  }
  
  // Verificar repetição excessiva de caracteres
  if (/(.)\1{4,}/.test(message)) {
    score += 0.2;
    flags.push('Repetição excessiva de caracteres');
  }
  
  // Limitar score entre 0 e 1
  score = Math.min(1, score);
  
  let action: 'allow' | 'hide' | 'block' = 'allow';
  if (score >= 0.8) action = 'block';
  else if (score >= 0.4) action = 'hide';
  
  return { score, action, flags };
}

/**
 * Notificar moderadores (função auxiliar)
 */
async function notifyModerators(channelId: string, messageId: string, flags: string[]) {
  try {
    const channelDoc = await db.collection('chatChannels').doc(channelId).get();
    const channelData = channelDoc.data() as ChatChannel;
    
    // Criar notificação para moderadores
    const notification = {
      type: 'chat_moderation_alert',
      title: 'Mensagem requer moderação',
      message: `Mensagem no canal ${channelData.name} foi sinalizada: ${flags.join(', ')}`,
      targetUsers: channelData.moderators,
      data: {
        channelId,
        messageId,
        flags
      },
      createdAt: new Date(),
      isRead: false
    };
    
    await db.collection('notifications').add(notification);
    
    logger.info(`Moderators notified for message: ${messageId}`, {
      channelId,
      messageId,
      moderators: channelData.moderators,
      flags,
    });
  } catch (error) {
    logger.error(`Error notifying moderators: ${messageId}`, error);
  }
}
