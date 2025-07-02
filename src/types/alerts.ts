// Sistema de notícias e alertas

export type AlertType = 'meteorologico' | 'geologico' | 'hidrologico' | 'incendio' | 'defesa_civil' | 'educativo';
export type AlertSeverity = 'info' | 'aviso' | 'alerta' | 'emergencia';
export type NewsCategory = 'clima' | 'sustentabilidade' | 'desastres' | 'meio_ambiente' | 'tecnologia' | 'educacao';

export interface Alert {
  id: string;
  title: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  area: {
    // Área de cobertura do alerta
    type: 'point' | 'radius' | 'polygon';
    coordinates: number[] | number[][]; // [lat, lng] ou array de polígono
    radius?: number; // em metros, para tipo 'radius'
    municipios?: string[]; // Códigos IBGE dos municípios
    estados?: string[]; // Estados cobertos
  };
  source: 'cemaden' | 'inmet' | 'defesa_civil' | 'sistema'; // Fonte do alerta
  externalId?: string; // ID do alerta na fonte externa
  validFrom: any; // Timestamp de início
  validUntil: any; // Timestamp de fim
  isActive: boolean;
  instructions: string[]; // Instruções de segurança
  relatedReports?: string[]; // IDs de relatórios relacionados
  metadata: {
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    precipitation?: number;
    [key: string]: any; // Metadados específicos por tipo
  };
  createdAt: any;
  updatedAt: any;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string; // Conteúdo completo (opcional)
  category: NewsCategory;
  author?: string;
  sourceUrl: string;
  source: string; // Nome da fonte
  imageUrl?: string;
  tags: string[];
  relevanceScore: number; // 0-1, calculado por IA
  location?: {
    country: string;
    state?: string;
    city?: string;
  };
  publishedAt: any; // Data de publicação original
  scrapedAt: any; // Data que foi coletada pelo sistema
  isActive: boolean;
  clicks: number; // Contador de cliques
  shares: number; // Contador de compartilhamentos
}

// Feed personalizado do usuário
export interface UserFeed {
  userId: string;
  preferences: {
    categories: NewsCategory[];
    alertTypes: AlertType[];
    location: {
      latitude: number;
      longitude: number;
      radius: number; // km
    };
    frequency: 'tempo_real' | 'diario' | 'semanal';
  };
  lastUpdated: any;
}

// Notificações push
export interface PushNotification {
  id: string;
  userId?: string; // undefined para notificações em massa
  title: string;
  body: string;
  type: 'alert' | 'news' | 'education' | 'social' | 'system';
  data: {
    actionType: 'open_map' | 'open_article' | 'open_module' | 'open_report';
    targetId?: string; // ID do alerta, artigo, módulo, etc.
    coordinates?: [number, number]; // Para abrir mapa em localização específica
  };
  priority: 'low' | 'normal' | 'high';
  scheduledFor?: any; // Para notificações agendadas
  sentAt?: any;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  fcmToken?: string; // Token FCM do destinatário
}

// Configurações de notificação do usuário
export interface NotificationSettings {
  userId: string;
  push: {
    enabled: boolean;
    alerts: boolean;
    news: boolean;
    education: boolean;
    social: boolean;
    quietHours: {
      enabled: boolean;
      start: string; // HH:MM
      end: string; // HH:MM
    };
  };
  email: {
    enabled: boolean;
    daily_digest: boolean;
    weekly_summary: boolean;
    alerts: boolean;
  };
  sms: {
    enabled: boolean;
    emergency_only: boolean;
    phone: string;
  };
  location: {
    latitude: number;
    longitude: number;
    radius: number; // km para alertas locais
  };
}

// Dados meteorológicos
export interface WeatherData {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
  };
  current: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    uvIndex: number;
    condition: string;
    conditionCode: number;
  };
  forecast: {
    date: any;
    minTemp: number;
    maxTemp: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    precipitationChance: number;
    condition: string;
    conditionCode: number;
  }[];
  source: 'openweather' | 'inmet';
  externalId?: string;
  lastUpdated: any;
}

// Dados do CEMADEN
export interface CemadenData {
  id: string;
  stationCode: string;
  stationName: string;
  location: {
    latitude: number;
    longitude: number;
    municipality: string;
    state: string;
  };
  measurements: {
    timestamp: any;
    rainfall: number; // mm
    accumulated24h: number; // mm
    accumulated72h: number; // mm
    riskLevel: 'sem_risco' | 'observacao' | 'atencao' | 'alerta' | 'alerta_maximo';
  }[];
  lastUpdated: any;
}

// Dados de abrigos e pontos de apoio
export interface Shelter {
  id: string;
  name: string;
  type: 'abrigo_temporario' | 'escola' | 'ginasio' | 'igreja' | 'posto_saude' | 'bombeiros' | 'defesa_civil';
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  contact: {
    phone?: string;
    email?: string;
    responsible?: string;
  };
  capacity: {
    total: number;
    current: number;
    available: number;
  };
  services: string[]; // 'alimentacao', 'abrigo', 'primeiros_socorros', etc.
  isActive: boolean;
  operatingHours: {
    always: boolean;
    schedule?: {
      [day: string]: { open: string; close: string } | 'closed';
    };
  };
  accessibility: {
    wheelchairAccess: boolean;
    elevator: boolean;
    adaptedBathroom: boolean;
  };
  lastVerified: any;
  createdAt: any;
  updatedAt: any;
}
