'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Send, 
  AlertTriangle, 
  Flag,
  Users,
  MessageCircle,
  Shield,
  Hash,
  Clock
} from 'lucide-react';
import { type ChatMessage, type ChatChannel } from '@/services/chatService';
import { useSession } from '@/hooks/use-session';

export default function ChatPage() {
  const { user } = useSession();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar canais do usuário
  useEffect(() => {
    const loadChannels = async () => {
      if (!user) return;
      
      try {
        const { getUserChannels } = await import('@/services/chatService');
        const userChannels = await getUserChannels(user.uid);
        setChannels(userChannels);
      } catch (error) {
        console.error('Erro ao carregar canais:', error);
      }
    };

    loadChannels();
  }, [user]);

  // Carregar mensagens do canal ativo
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChannel) return;
      
      try {
        setLoading(true);
        const { getChannelMessages } = await import('@/services/chatService');
        const channelMessages = await getChannelMessages(activeChannel);
        setMessages(channelMessages);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [activeChannel]);

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !activeChannel) return;
    
    try {
      const { sendMessage } = await import('@/services/chatService');
      await sendMessage({
        channelId: activeChannel,
        message: newMessage.trim(),
        uid: user.uid,
        userName: user.name || 'Usuário'
      });
      
      setNewMessage('');
      
      // Recarregar mensagens
      const { getChannelMessages } = await import('@/services/chatService');
      const updatedMessages = await getChannelMessages(activeChannel);
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReportMessage = async (messageId: string) => {
    if (!user) return;

    try {
      // Em produção usaria: await ChatService.reportMessage(messageId, 'inappropriate');
      console.log('Mensagem reportada:', messageId);
    } catch (error) {
      console.error('Erro ao reportar mensagem:', error);
    }
  };

  const getChannelIcon = (type: ChatChannel['type']) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'education':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'support':
        return <Shield className="h-4 w-4 text-purple-500" />;
      default:
        return <Hash className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChannelBadge = (channel: ChatChannel) => {
    const participantCount = channel.participants.length;
    const isModerated = channel.settings.requireModeration;

    return (
      <div className="flex items-center gap-1">
        <Badge variant="secondary" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          {participantCount}
        </Badge>
        {isModerated && (
          <Badge variant="outline" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Moderado
          </Badge>
        )}
      </div>
    );
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'Agora';
  };

  const activeChannelData = channels.find(c => c.id === activeChannel);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chat Comunitário</h1>
          <p className="text-muted-foreground">
            Converse com a comunidade e mantenha-se informado sobre situações locais
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Lista de Canais */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Canais</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-3">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id ?? '')}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeChannel === channel.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getChannelIcon(channel.type)}
                      <span className="font-medium">{channel.name}</span>
                    </div>
                    {getChannelBadge(channel)}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área de Chat */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeChannelData && getChannelIcon(activeChannelData.type)}
                <CardTitle className="text-lg">
                  {activeChannelData?.name ?? 'Canal'}
                </CardTitle>
              </div>
              {activeChannelData && getChannelBadge(activeChannelData)}
            </div>
            {activeChannelData?.settings.requireModeration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Este canal é moderado. Mensagens podem levar alguns minutos para aparecer.
              </div>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.userName}`} />
                      <AvatarFallback>
                        {message.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{message.userName}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(message.timestamp)}
                        </div>
                        {message.status === 'hidden' && (
                          <Badge variant="destructive" className="text-xs">Oculta</Badge>
                        )}
                        {message.aiModeration?.flags.includes('emergency') && (
                          <Badge variant="outline" className="text-xs text-red-600">Emergência</Badge>
                        )}
                      </div>
                      
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{message.message}</p>
                      </div>
                      
                      {user && message.uid !== user.uid && (
                        <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs"
                              >
                                <Flag className="h-3 w-3 mr-1" />
                                Reportar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reportar Mensagem</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Você tem certeza que deseja reportar esta mensagem como inadequada?
                                  A equipe de moderação irá revisar.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => message.id && handleReportMessage(message.id)}
                                >
                                  Reportar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={`Mensagem para ${activeChannelData?.name ?? 'canal'}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  maxLength={activeChannelData?.settings.maxMessageLength ?? 500}
                  disabled={loading || !user}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={loading || !newMessage.trim() || !user}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {activeChannelData && (
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>
                    {newMessage.length}/{activeChannelData.settings.maxMessageLength} caracteres
                  </span>
                  {!user && (
                    <span>Faça login para participar do chat</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas dos Canais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((channel) => (
          <Card key={channel.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {getChannelIcon(channel.type)}
                <h3 className="font-medium">{channel.name}</h3>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {channel.participants.length} participantes
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {channel.moderators.length} moderadores
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
