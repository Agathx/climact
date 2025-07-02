import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

const db = getFirestore();

/**
 * Trigger automático: Moderação de IA quando nova mensagem de chat é criada (RN05)
 */
export const onChatMessageCreated = onDocumentCreated('chatMessages/{messageId}', async (event) => {
  const messageId = event.params.messageId;
  const messageData = event.data?.data();

  if (!messageData || messageData.status !== 'active') {
    return; // Só processar mensagens ativas
  }

  try {
    logger.info('Starting AI moderation for chat message', { messageId });

    // Análise de IA para moderação
    const moderationResult = await moderateContentWithAI(messageData.message);

    // Atualizar mensagem com resultado da moderação
    const updateData: any = {
      aiModeration: {
        ...moderationResult,
        processedAt: new Date(),
      },
      updatedAt: new Date(),
    };

    // Aplicar ação baseada no resultado
    if (moderationResult.action === 'block') {
      updateData.status = 'blocked';
    } else if (moderationResult.action === 'hide') {
      updateData.status = 'hidden';
    }

    await db.collection('chatMessages').doc(messageId).update(updateData);

    // Registrar log de IA (RN09)
    await db.collection('aiLogs').add({
      type: 'chat_moderation',
      entityId: messageId,
      entityType: 'chat_message',
      aiDecision: {
        score: moderationResult.score,
        action: moderationResult.action,
        flags: moderationResult.flags,
      },
      metadata: {
        channelId: messageData.channelId,
        userId: messageData.uid,
        message: messageData.message.substring(0, 100),
      },
      processedAt: new Date(),
      confidence: moderationResult.score,
    });

    // Notificar moderadores se conteúdo bloqueado
    if (moderationResult.action === 'block') {
      await notifyModerators(messageId, messageData, moderationResult);
    }

    // Incrementar contador de infrações do usuário
    if (moderationResult.action !== 'allow') {
      await incrementUserWarnings(messageData.uid);
    }

    logger.info('AI moderation completed for chat message', { 
      messageId, 
      action: moderationResult.action,
      score: moderationResult.score 
    });

  } catch (error) {
    logger.error('Error in chat moderation trigger', { messageId, error });
  }
});

/**
 * Moderação de conteúdo com IA (função auxiliar)
 */
async function moderateContentWithAI(message: string): Promise<{
  score: number;
  action: 'allow' | 'hide' | 'block';
  flags: string[];
}> {
  // Implementação simplificada - em produção usar Perspective API ou similar
  const offensiveKeywords = [
    'idiota', 'burro', 'estúpido', 'lixo', 'merda',
    'ódio', 'matar', 'violência', 'discriminação'
  ];

  const spamKeywords = [
    'compre', 'venda', 'promoção', 'desconto', 'clique aqui',
    'ganhe dinheiro', 'trabalhe em casa', 'renda extra'
  ];

  const hateKeywords = [
    'racista', 'homofóbico', 'machista', 'xenófobo',
    'preconceito', 'discriminação'
  ];

  let score = 0;
  const flags: string[] = [];

  // Verificar palavras ofensivas
  const offensiveMatches = offensiveKeywords.filter(keyword => 
    message.toLowerCase().includes(keyword)
  ).length;
  
  if (offensiveMatches > 0) {
    score += offensiveMatches * 0.3;
    flags.push('linguagem_ofensiva');
  }

  // Verificar spam
  const spamMatches = spamKeywords.filter(keyword => 
    message.toLowerCase().includes(keyword)
  ).length;
  
  if (spamMatches > 0) {
    score += spamMatches * 0.4;
    flags.push('spam');
  }

  // Verificar discurso de ódio
  const hateMatches = hateKeywords.filter(keyword => 
    message.toLowerCase().includes(keyword)
  ).length;
  
  if (hateMatches > 0) {
    score += hateMatches * 0.5;
    flags.push('discurso_odio');
  }

  // Verificar CAPS LOCK excessivo
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (capsRatio > 0.7 && message.length > 10) {
    score += 0.2;
    flags.push('caps_excessivo');
  }

  // Verificar repetição excessiva
  if (/(.)\1{4,}/.test(message)) {
    score += 0.3;
    flags.push('repeticao_excessiva');
  }

  // Determinar ação baseada no score
  let action: 'allow' | 'hide' | 'block';
  if (score >= 0.7) {
    action = 'block';
  } else if (score >= 0.4) {
    action = 'hide';
  } else {
    action = 'allow';
  }

  return { score, action, flags };
}

/**
 * Notificar moderadores sobre conteúdo bloqueado
 */
async function notifyModerators(messageId: string, messageData: any, moderationResult: any) {
  try {
    await db.collection('notifications').add({
      type: 'blocked_message',
      title: 'Mensagem Bloqueada Automaticamente',
      message: `Mensagem bloqueada por: ${moderationResult.flags.join(', ')}`,
      targetRoles: ['admin'],
      priority: 'medium',
      data: {
        messageId,
        channelId: messageData.channelId,
        userId: messageData.uid,
        flags: moderationResult.flags,
        score: moderationResult.score,
      },
      createdAt: new Date(),
      isRead: false,
    });

    logger.info('Moderators notified of blocked message', { messageId });
  } catch (error) {
    logger.error('Error notifying moderators', { messageId, error });
  }
}

/**
 * Incrementar contador de infrações do usuário
 */
async function incrementUserWarnings(userId: string) {
  try {
    await db.collection('users').doc(userId).update({
      warningCount: FieldValue.increment(1),
      lastWarningAt: new Date(),
    });

    // Verificar se usuário deve ser suspenso
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.warningCount >= 5) {
      await db.collection('users').doc(userId).update({
        isSuspended: true,
        suspendedAt: new Date(),
        suspensionReason: 'Múltiplas infrações no chat',
      });

      logger.info('User suspended for multiple infractions', { userId });
    }

  } catch (error) {
    logger.error('Error updating user warnings', { userId, error });
  }
}
