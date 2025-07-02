import { UserRole } from './user';

// Status de validação conforme RN02
export type ReportStatus = 'pendente_ia' | 'pendente_comunidade' | 'aprovado' | 'rejeitado_defesa_civil';

// Tipos de incidentes
export type IncidentType = 'enchente' | 'deslizamento' | 'incendio' | 'risco_estrutural' | 'seca' | 'vendaval' | 'outro';

// Níveis de severidade
export type SeverityLevel = 'baixa' | 'media' | 'alta' | 'critica';

// Tipos de validação
export type ValidationType = 'ia' | 'comunidade' | 'defesa_civil';

export interface Report {
  id: string;
  userId: string; // UID do usuário que reportou
  isAnonymous: boolean; // Denúncia anônima conforme RN07
  incidentType: IncidentType;
  title: string; // Título do relato
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string; // Endereço legível
  };
  mediaUrls: string[]; // URLs de imagens/vídeos no Storage
  status: ReportStatus;
  severity: SeverityLevel; // Determinado pela IA
  urgency: boolean; // Marcado como urgente
  
  // Validação por IA
  aiAnalysis?: {
    confidence: number; // 0-1
    keywords: string[];
    flags: string[]; // Possíveis problemas detectados
    timestamp: any; // Firestore Timestamp
  };
  
  // Validações da comunidade
  communityValidations: {
    validatorId: string;
    isValid: boolean;
    comment?: string;
    timestamp: any;
  }[];
  
  // Validação final da Defesa Civil
  defesaCivilValidation?: {
    validatorId: string;
    approved: boolean;
    publicResponse?: string; // Resposta pública
    internalNotes?: string; // Notas internas
    actionsTaken?: string; // Ações tomadas
    timestamp: any;
  };
  
  // Métricas
  views: number;
  helps: number; // Quantas pessoas ajudaram/validaram
  
  // Timestamps
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// Log da IA para auditoria
export interface AILog {
  id: string;
  reportId: string;
  action: 'analysis' | 'moderation' | 'triage';
  input: {
    text?: string;
    imageUrls?: string[];
  };
  output: {
    severity?: SeverityLevel;
    confidence: number;
    keywords: string[];
    flags: string[];
    reasoning: string;
  };
  modelUsed: string; // Versão do modelo
  timestamp: any; // Firestore Timestamp
}

// Interface para pedidos de ajuda (SOS)
export interface SOSRequest {
  id: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  urgency: 'baixa' | 'media' | 'alta' | 'emergencia';
  itemsNeeded: string[]; // Itens necessários
  description: string;
  contactInfo: {
    phone?: string;
    name: string;
  };
  status: 'ativo' | 'em_atendimento' | 'resolvido' | 'cancelado';
  responses: {
    userId: string;
    message: string;
    timestamp: any;
  }[];
  createdAt: any;
  updatedAt: any;
}

// Interface para relatórios anônimos (RN07)
export interface AnonymousReport {
  id: string;
  title: string;
  description: string;
  type: 'environmental' | 'safety' | 'infrastructure' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: {
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  mediaUrls?: string[];
  status: 'pending' | 'under_review' | 'investigating' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  reporterFingerprint?: string; // Hash para prevenção de spam
  metadata?: Record<string, any>;
}

// Interface para criação de relatórios anônimos
export interface CreateAnonymousReportData {
  title: string;
  description: string;
  type: AnonymousReport['type'];
  priority?: AnonymousReport['priority'];
  location: {
    coordinates: [number, number];
    address?: string;
  };
  mediaUrls?: string[];
}
