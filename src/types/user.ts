
// Tipos de perfil de usuário conforme RN01 e RF03
export type UserRole = 'cidadao' | 'voluntario' | 'ong' | 'defesa_civil' | 'admin';

// Status de usuário baseado em RN01 e RN04
export type UserStatus = 'active' | 'pending_approval' | 'rejected';

// Status de solicitação de evolução de perfil
export type ProfileRequestStatus = 'pendente' | 'aprovado' | 'rejeitado';

// Status de verificação
export type VerificationStatus = 'pendente' | 'verificado' | 'rejeitado';

// Interface principal do usuário conforme modelagem DER
export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;  // Alterado de displayName para name conforme usado no código
  photoURL: string | null;
  role: UserRole;
  status: UserStatus; // Adicionado status conforme RN01
  
  // Campos comuns
  firstName?: string;
  lastName?: string;
  cpf?: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Gamificação - Sistema de pontos e badges conforme RF22
  points: number;
  badges: string[];
  level: number;
  
  // Campos específicos por perfil conforme RN01
  cidadaoProfile?: CidadaoProfile;
  voluntarioProfile?: VoluntarioProfile;
  ongProfile?: OngProfile;
  defesaCivilProfile?: DefesaCivilProfile;
  adminProfile?: AdminProfile;
  
  // Configurações de notificação conforme RF19
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  // Timestamps
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  lastLoginAt?: any;
}

// Perfis específicos por tipo de usuário
export interface CidadaoProfile {
  interests: string[]; // Áreas de interesse em educação ambiental
  completedModules: string[]; // IDs dos módulos educativos completados
}

export interface VoluntarioProfile {
  skills: string[]; // Habilidades oferecidas
  availability: {
    days: string[]; // ['segunda', 'terca', ...]
    hours: string; // '08:00-18:00'
  };
  specialties: string[]; // Especialidades em tipos de desastre
  documentsUrls: string[]; // URLs dos documentos no Storage
  verificationStatus: VerificationStatus;
  reputation: number; // Sistema de reputação baseado em validações
}

export interface OngProfile {
  organizationName: string;
  cnpj: string;
  description: string;
  websiteUrl?: string;
  areasOfActuation: string[];
  documentsUrls: string[]; // URLs dos documentos no Storage
  verificationStatus: VerificationStatus;
}

export interface DefesaCivilProfile {
  organization: string;
  position: string;
  municipality: string;
  state: string;
  registrationNumber: string;
  documentsUrls: string[]; // URLs dos documentos no Storage
  verificationStatus: VerificationStatus;
}

export interface AdminProfile {
  permissions: string[];
  createdBy: string; // ID do admin que criou este admin
}

// Interface para solicitação de evolução de perfil
export interface ProfileUpgradeRequest {
  id: string;
  uid: string;
  currentRole: UserRole;
  requestedRole: UserRole;
  status: ProfileRequestStatus;
  requestData: VoluntarioProfile | OngProfile | DefesaCivilProfile;
  documentsUrls: { [key: string]: string }; // e.g., { "id_front": "url", "proof_of_address": "url" }
  submittedAt: any; // Firestore Timestamp
  reviewedAt?: any;
  reviewedBy?: string; // ID do admin que revisou
  rejectionReason?: string;
}
