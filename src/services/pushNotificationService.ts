// Push Notifications Service para PWA ClimACT

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Solicitar permissão para notificações
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notificações não são suportadas neste navegador');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Verificar se notificações são suportadas
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Registrar para push notifications
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications não são suportadas');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações foi negada');
    }

    // Aguardar registro do service worker
    this.registration = await navigator.serviceWorker.ready;

    // Verificar se já existe uma inscrição
    const existingSubscription = await this.registration.pushManager.getSubscription();
    if (existingSubscription) {
      return existingSubscription;
    }

    // Criar nova inscrição
    const subscription = await this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
    });

    // Salvar inscrição no backend (Firebase)
    await this.saveSubscriptionToBackend(subscription);

    return subscription;
  }

  // Cancelar inscrição
  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      this.registration = await navigator.serviceWorker.ready;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    if (subscription) {
      await this.removeSubscriptionFromBackend(subscription);
      return await subscription.unsubscribe();
    }
    return false;
  }

  // Mostrar notificação local
  async showLocalNotification(data: PushNotificationData): Promise<void> {
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações foi negada');
    }

    if (!this.registration) {
      this.registration = await navigator.serviceWorker.ready;
    }

    await this.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      tag: data.tag,
      data: data.data,
      requireInteraction: true,
      silent: false
    });
  }

  // Notificações específicas do ClimACT
  async notifyEmergencyAlert(alert: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'severe' | 'critical';
    location?: string;
  }): Promise<void> {
    const severityConfig = {
      info: { icon: '/icons/info.png', badge: '/icons/info-badge.png' },
      warning: { icon: '/icons/warning.png', badge: '/icons/warning-badge.png' },
      severe: { icon: '/icons/severe.png', badge: '/icons/severe-badge.png' },
      critical: { icon: '/icons/critical.png', badge: '/icons/critical-badge.png' }
    };

    const config = severityConfig[alert.severity];

    await this.showLocalNotification({
      title: `🚨 ${alert.title}`,
      body: alert.location ? `${alert.message}\n📍 ${alert.location}` : alert.message,
      icon: config.icon,
      badge: config.badge,
      tag: 'emergency-alert',
      data: {
        type: 'emergency-alert',
        severity: alert.severity,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'Ver Detalhes'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ]
    });
  }

  async notifyReportUpdate(report: {
    id: string;
    title: string;
    status: string;
  }): Promise<void> {
    await this.showLocalNotification({
      title: 'Atualização de Relatório',
      body: `Seu relatório "${report.title}" foi ${report.status}`,
      icon: '/icons/report.png',
      tag: `report-${report.id}`,
      data: {
        type: 'report-update',
        reportId: report.id
      },
      actions: [
        {
          action: 'view-report',
          title: 'Ver Relatório'
        }
      ]
    });
  }

  async notifyNewMessage(message: {
    channel: string;
    sender: string;
    preview: string;
  }): Promise<void> {
    await this.showLocalNotification({
      title: `Nova mensagem em ${message.channel}`,
      body: `${message.sender}: ${message.preview}`,
      icon: '/icons/chat.png',
      tag: `chat-${message.channel}`,
      data: {
        type: 'chat-message',
        channel: message.channel
      },
      actions: [
        {
          action: 'view-chat',
          title: 'Ver Chat'
        },
        {
          action: 'reply',
          title: 'Responder'
        }
      ]
    });
  }

  async notifyDonationRequest(donation: {
    title: string;
    urgency: string;
    location: string;
  }): Promise<void> {
    await this.showLocalNotification({
      title: 'Nova Solicitação de Doação',
      body: `${donation.title} - ${donation.urgency}\n📍 ${donation.location}`,
      icon: '/icons/donation.png',
      tag: 'donation-request',
      data: {
        type: 'donation-request'
      },
      actions: [
        {
          action: 'view-donations',
          title: 'Ver Doações'
        }
      ]
    });
  }

  // Salvar inscrição no Firebase
  private async saveSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      // Em produção, enviaria para Cloud Function
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey('p256dh') ? 
            btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : null,
          auth: subscription.getKey('auth') ? 
            btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : null,
        },
        timestamp: Date.now()
      };

      console.log('Salvando inscrição push:', subscriptionData);
      // await fetch('/api/push/subscribe', { ... });
    } catch (error) {
      console.error('Erro ao salvar inscrição push:', error);
    }
  }

  // Remover inscrição do Firebase
  private async removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
    try {
      console.log('Removendo inscrição push:', subscription.endpoint);
      // await fetch('/api/push/unsubscribe', { ... });
    } catch (error) {
      console.error('Erro ao remover inscrição push:', error);
    }
  }

  // Converter chave VAPID
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Verificar status da inscrição
  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    subscription: PushSubscription | null;
  }> {
    if (!this.isSupported()) {
      return { isSubscribed: false, subscription: null };
    }

    if (!this.registration) {
      this.registration = await navigator.serviceWorker.ready;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    return {
      isSubscribed: !!subscription,
      subscription
    };
  }
}

export default PushNotificationService;
