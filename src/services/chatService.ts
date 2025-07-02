import { httpsCallable } from 'firebase/functions';
import { onSnapshot, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';

// Cloud Functions callables
const sendChatMessageCallable = httpsCallable(functions, 'sendChatMessage');
const reportChatMessageCallable = httpsCallable(functions, 'reportChatMessage');
const moderateMessageCallable = httpsCallable(functions, 'moderateMessage');
const getChatMessagesCallable = httpsCallable(functions, 'getChatMessages');
const createChatChannelCallable = httpsCallable(functions, 'createChatChannel');

export interface ChatMessage {
  id?: string;
  uid: string;
  userName: string;
  message: string;
  timestamp: any;
  channelId: string;
  status: 'active' | 'hidden' | 'blocked';
  aiModeration?: {
    score: number;
    flags: string[];
    action: 'allow' | 'hide' | 'block';
    processedAt: any;
  };
  reportedBy?: string[];
  moderatedBy?: string;
  moderationReason?: string;
}

export interface ChatChannel {
  id?: string;
  name: string;
  type: 'general' | 'emergency' | 'education' | 'support';
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

export interface SendMessageData {
  channelId: string;
  message: string;
}

export interface ReportMessageData {
  messageId: string;
  reason: string;
}

export interface ModerateMessageData {
  messageId: string;
  action: 'approve' | 'hide' | 'block';
  reason?: string;
}

export interface CreateChannelData {
  name: string;
  type: 'general' | 'emergency' | 'education' | 'support';
  settings?: {
    allowAnonymous?: boolean;
    requireModeration?: boolean;
    maxMessageLength?: number;
  };
}

/**
 * Enviar mensagem no chat (RN05)
 */
export const sendChatMessage = async (data: SendMessageData): Promise<{ messageId: string }> => {
  try {
    const result = await sendChatMessageCallable(data);
    return result.data as { messageId: string };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    throw new Error(error.message ?? 'Erro ao enviar mensagem');
  }
};

/**
 * Reportar mensagem inadequada
 */
export const reportChatMessage = async (data: ReportMessageData): Promise<{ success: boolean }> => {
  try {
    const result = await reportChatMessageCallable(data);
    return result.data as { success: boolean };
  } catch (error: any) {
    console.error('Erro ao reportar mensagem:', error);
    throw new Error(error.message ?? 'Erro ao reportar mensagem');
  }
};

/**
 * Moderar mensagem (apenas moderadores)
 */
export const moderateMessage = async (data: ModerateMessageData): Promise<{ success: boolean }> => {
  try {
    const result = await moderateMessageCallable(data);
    return result.data as { success: boolean };
  } catch (error: any) {
    console.error('Erro ao moderar mensagem:', error);
    throw new Error(error.message ?? 'Erro ao moderar mensagem');
  }
};

/**
 * Obter mensagens do chat
 */
export const getChatMessages = async (channelId: string, limitCount: number = 50, startAfterDoc?: string): Promise<{ messages: ChatMessage[] }> => {
  try {
    const result = await getChatMessagesCallable({ 
      channelId, 
      limit: limitCount, 
      startAfter: startAfterDoc 
    });
    return result.data as { messages: ChatMessage[] };
  } catch (error: any) {
    console.error('Erro ao obter mensagens:', error);
    throw new Error(error.message ?? 'Erro ao obter mensagens');
  }
};

/**
 * Criar novo canal de chat
 */
export const createChatChannel = async (data: CreateChannelData): Promise<{ channelId: string }> => {
  try {
    const result = await createChatChannelCallable(data);
    return result.data as { channelId: string };
  } catch (error: any) {
    console.error('Erro ao criar canal:', error);
    throw new Error(error.message ?? 'Erro ao criar canal');
  }
};

/**
 * Listener em tempo real para mensagens do chat
 */
export const subscribeToChatMessages = (
  channelId: string,
  onMessagesUpdate: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void,
  limitCount: number = 50
) => {
  try {
    const messagesRef = collection(db, 'chatMessages');
    const q = query(
      messagesRef,
      where('channelId', '==', channelId),
      where('status', '==', 'active'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, 
      (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        
        // Reverter para ordem cronológica
        messages.reverse();
        onMessagesUpdate(messages);
      },
      (error) => {
        console.error('Erro no listener de mensagens:', error);
        onError(new Error('Erro ao escutar mensagens em tempo real'));
      }
    );
  } catch (error: any) {
    console.error('Erro ao configurar listener:', error);
    onError(new Error('Erro ao configurar escuta em tempo real'));
    return () => {}; // Retornar função vazia em caso de erro
  }
};

/**
 * Listener para canais de chat disponíveis
 */
export const subscribeToChatChannels = (
  onChannelsUpdate: (channels: ChatChannel[]) => void,
  onError: (error: Error) => void
) => {
  try {
    const channelsRef = collection(db, 'chatChannels');
    const q = query(
      channelsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q,
      (snapshot) => {
        const channels: ChatChannel[] = [];
        snapshot.forEach((doc) => {
          channels.push({ id: doc.id, ...doc.data() } as ChatChannel);
        });
        onChannelsUpdate(channels);
      },
      (error) => {
        console.error('Erro no listener de canais:', error);
        onError(new Error('Erro ao escutar canais em tempo real'));
      }
    );
  } catch (error: any) {
    console.error('Erro ao configurar listener de canais:', error);
    onError(new Error('Erro ao configurar escuta de canais'));
    return () => {};
  }
};

/**
 * Validar mensagem antes do envio
 */
export const validateMessage = (message: string, maxLength: number = 500): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!message || message.trim().length === 0) {
    errors.push('Mensagem não pode estar vazia');
  }
  
  if (message.length > maxLength) {
    errors.push(`Mensagem não pode ter mais de ${maxLength} caracteres`);
  }
  
  // Verificar conteúdo potencialmente problemático
  const problematicPatterns = [
    /(.)\1{10,}/, // Repetição excessiva de caracteres
    /[A-Z]{20,}/, // CAPS LOCK excessivo
  ];
  
  problematicPatterns.forEach(pattern => {
    if (pattern.test(message)) {
      errors.push('Mensagem contém padrões não permitidos');
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Obter tipos de canal disponíveis
 */
export const getChannelTypes = (): { value: string; label: string; description: string; icon: string }[] => {
  return [
    { 
      value: 'general', 
      label: 'Geral', 
      description: 'Discussões gerais sobre meio ambiente',
      icon: '💬'
    },
    { 
      value: 'emergency', 
      label: 'Emergência', 
      description: 'Canal para situações de emergência',
      icon: '🚨'
    },
    { 
      value: 'education', 
      label: 'Educação', 
      description: 'Discussões sobre conteúdo educacional',
      icon: '📚'
    },
    { 
      value: 'support', 
      label: 'Suporte', 
      description: 'Ajuda e suporte técnico',
      icon: '🛠️'
    }
  ];
};

/**
 * Obter motivos de report disponíveis
 */
export const getReportReasons = (): { value: string; label: string }[] => {
  return [
    { value: 'spam', label: 'Spam' },
    { value: 'linguagem_ofensiva', label: 'Linguagem Ofensiva' },
    { value: 'discurso_odio', label: 'Discurso de Ódio' },
    { value: 'conteudo_inadequado', label: 'Conteúdo Inadequado' },
    { value: 'informacao_falsa', label: 'Informação Falsa' },
    { value: 'outros', label: 'Outros' }
  ];
};
