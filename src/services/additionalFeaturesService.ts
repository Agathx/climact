import { 
  httpsCallable, 
  connectFunctionsEmulator,
  getFunctions 
} from 'firebase/functions';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Unsubscribe,
  doc,
  getDoc
} from 'firebase/firestore';
import { app, db } from '@/lib/firebase';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Connect to emulator in development - only if not already connected
if (process.env.NODE_ENV === 'development' && !functions.app.options.projectId?.includes('demo')) {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔧 Functions emulator connected for development');
  } catch (error) {
    console.warn('⚠️ Functions emulator connection failed or already connected:', error);
  }
}

// Validate Firebase Functions initialization
if (!functions) {
  throw new Error('❌ Firebase Functions not initialized properly');
}

// ===== TYPES =====

export interface DonationItem {
  name: string;
  quantity: number;
  unit: string;
  description?: string;
  condition?: 'new' | 'used_good' | 'used_fair';
  estimatedValue?: number;
}

export interface DonationRequest {
  id?: string;
  createdBy: string;
  organizationName: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  requestType: 'need' | 'offer';
  category: 'food' | 'clothing' | 'medicine' | 'shelter' | 'transportation' | 'money' | 'other';
  items: DonationItem[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  imageUrls?: string[];
  status: 'active' | 'partially_fulfilled' | 'fulfilled' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  fulfillmentHistory: DonationFulfillment[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verificationNotes?: string;
}

export interface DonationFulfillment {
  fulfilledBy: string;
  fulfillerName: string;
  items: DonationItem[];
  contactInfo: {
    email: string;
    phone: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  fulfillmentDate: Date;
}

export interface CreateDonationRequestData {
  organizationName: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  requestType: 'need' | 'offer';
  category: 'food' | 'clothing' | 'medicine' | 'shelter' | 'transportation' | 'money' | 'other';
  items: DonationItem[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  imageUrls?: string[];
  expiresAt: Date;
}

export interface EmergencyAlert {
  id?: string;
  title: string;
  message: string;
  alertType: 'weather' | 'fire' | 'flood' | 'earthquake' | 'pollution' | 'evacuation' | 'other';
  severity: 'info' | 'warning' | 'severe' | 'critical';
  affectedArea: {
    coordinates: Array<[number, number]>; // Polígono da área afetada
    centerPoint: [number, number];
    radius: number; // em metros
    cities: string[];
    states: string[];
  };
  isActive: boolean;
  startTime: Date;
  endTime?: Date;
  instructions: string[];
  emergencyContacts: {
    type: 'fire' | 'police' | 'medical' | 'civil_defense' | 'other';
    name: string;
    phone: string;
    available24h: boolean;
  }[];
  relatedReports: string[]; // IDs de reports relacionados
  createdBy: string;
  authorizedBy?: string; // Autorização da Defesa Civil
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
}

export interface CreateEmergencyAlertData {
  title: string;
  message: string;
  alertType: 'weather' | 'fire' | 'flood' | 'earthquake' | 'pollution' | 'evacuation' | 'other';
  severity: 'info' | 'warning' | 'severe' | 'critical';
  affectedArea: {
    coordinates: Array<[number, number]>;
    centerPoint: [number, number];
    radius: number;
    cities: string[];
    states: string[];
  };
  endTime?: Date;
  instructions: string[];
  emergencyContacts: {
    type: 'fire' | 'police' | 'medical' | 'civil_defense' | 'other';
    name: string;
    phone: string;
    available24h: boolean;
  }[];
  relatedReports?: string[];
}

// ===== CLOUD FUNCTIONS =====

const createDonationRequestFn = httpsCallable<CreateDonationRequestData, { requestId: string }>(
  functions, 
  'createDonationRequest'
);

const fulfillDonationRequestFn = httpsCallable<{
  requestId: string;
  items: DonationItem[];
  contactInfo: {
    email: string;
    phone: string;
  };
  notes?: string;
}, { fulfillmentId: string }>(
  functions, 
  'fulfillDonationRequest'
);

const getDonationRequestsFn = httpsCallable<{
  location?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  category?: string;
  requestType?: 'need' | 'offer';
  urgency?: string;
  status?: string;
  limit?: number;
  page?: number;
}, {
  requests: DonationRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>(functions, 'getDonationRequests');

const createEmergencyAlertFn = httpsCallable<CreateEmergencyAlertData, { alertId: string }>(
  functions, 
  'createEmergencyAlert'
);

const getActiveEmergencyAlertsFn = httpsCallable<{
  location?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  severity?: string;
  alertType?: string;
}, { alerts: EmergencyAlert[] }>(
  functions, 
  'getActiveEmergencyAlerts'
);

const acknowledgeEmergencyAlertFn = httpsCallable<{
  alertId: string;
  acknowledged: boolean;
}, { success: boolean }>(
  functions, 
  'acknowledgeEmergencyAlert'
);

// ===== DONATION SERVICE =====

export class AdditionalFeaturesService {
  
  // Validate service initialization
  private static validateService(): void {
    if (!functions || !db) {
      throw new Error('❌ AdditionalFeaturesService: Firebase not properly initialized');
    }
    
    // Check if we're in production mode
    const isProduction = process.env.NODE_ENV === 'production';
    const projectId = functions.app.options.projectId;
    
    if (isProduction && (!projectId || projectId.includes('demo'))) {
      console.warn('⚠️ Production mode detected but using demo project');
    }
  }
  
  // ===== DOAÇÕES (RN11) =====
  
  /**
   * Cria uma nova solicitação de doação
   * @param data Dados da solicitação de doação
   * @returns ID da solicitação criada
   */
  static async createDonationRequest(data: CreateDonationRequestData): Promise<string> {
    this.validateService();
    
    try {
      console.log('🏗️ Creating donation request with real Cloud Function...');
      
      // Validate required fields
      if (!data.organizationName || !data.contactInfo.email || !data.items.length) {
        throw new Error('Dados obrigatórios faltando: nome da organização, email e itens');
      }
      
      const result = await createDonationRequestFn(data);
      
      if (!result.data?.requestId) {
        throw new Error('Cloud Function retornou resposta inválida');
      }
      
      console.log('✅ Donation request created successfully:', result.data.requestId);
      return result.data.requestId;
    } catch (error: any) {
      console.error('❌ Erro ao criar solicitação de doação:', error);
      
      // Provide more specific error messages
      if (error.code === 'unauthenticated') {
        throw new Error('Usuário não autenticado. Faça login para continuar.');
      } else if (error.code === 'permission-denied') {
        throw new Error('Permissão negada. Verifique suas credenciais.');
      } else if (error.code === 'unavailable') {
        throw new Error('Serviço temporariamente indisponível. Tente novamente.');
      }
      
      throw new Error(error.message ?? 'Erro interno do servidor');
    }
  }

  /**
   * Atende uma solicitação de doação
   * @param requestId ID da solicitação
   * @param items Itens a serem doados
   * @param contactInfo Informações de contato do doador
   * @param notes Observações opcionais
   * @returns ID do atendimento
   */
  static async fulfillDonationRequest(
    requestId: string, 
    items: DonationItem[], 
    contactInfo: { email: string; phone: string; },
    notes?: string
  ): Promise<string> {
    this.validateService();
    
    try {
      console.log('🤝 Fulfilling donation request with real Cloud Function...');
      
      // Validate inputs
      if (!requestId || !items.length || !contactInfo.email) {
        throw new Error('Dados obrigatórios faltando: ID da solicitação, itens e contato');
      }
      
      // Verify request exists
      const requestDoc = await getDoc(doc(db, 'donationRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Solicitação de doação não encontrada');
      }
      
      const result = await fulfillDonationRequestFn({
        requestId,
        items,
        contactInfo,
        notes
      });
      
      if (!result.data?.fulfillmentId) {
        throw new Error('Cloud Function retornou resposta inválida');
      }
      
      console.log('✅ Donation fulfillment created successfully:', result.data.fulfillmentId);
      return result.data.fulfillmentId;
    } catch (error: any) {
      console.error('❌ Erro ao atender solicitação de doação:', error);
      
      if (error.code === 'not-found') {
        throw new Error('Solicitação de doação não encontrada');
      } else if (error.code === 'already-exists') {
        throw new Error('Você já atendeu esta solicitação');
      }
      
      throw new Error(error.message ?? 'Erro ao atender solicitação de doação');
    }
  }

  /**
   * Busca solicitações de doação por localização e filtros
   * @param filters Filtros de busca
   * @returns Lista paginada de solicitações
   */
  static async getDonationRequests(filters: {
    location?: { latitude: number; longitude: number; };
    radius?: number;
    category?: string;
    requestType?: 'need' | 'offer';
    urgency?: string;
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    requests: DonationRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    this.validateService();
    
    try {
      console.log('🔍 Fetching donation requests with real Cloud Function...');
      
      // Set defaults
      const searchFilters = {
        limit: 20,
        page: 1,
        ...filters
      };
      
      // Validate location if provided
      if (searchFilters.location) {
        const { latitude, longitude } = searchFilters.location;
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          throw new Error('Coordenadas geográficas inválidas');
        }
      }
      
      const result = await getDonationRequestsFn(searchFilters);
      
      if (!result.data) {
        throw new Error('Cloud Function retornou resposta inválida');
      }
      
      console.log(`✅ Found ${result.data.requests.length} donation requests`);
      return result.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar solicitações de doação:', error);
      
      if (error.code === 'invalid-argument') {
        throw new Error('Parâmetros de busca inválidos');
      }
      
      throw new Error(error.message ?? 'Erro ao buscar solicitações de doação');
    }
  }

  /**
   * Monitora solicitações de doação em tempo real
   */
  static subscribeToDonationRequests(
    filters: {
      location?: { latitude: number; longitude: number; };
      radius?: number;
      category?: string;
      requestType?: 'need' | 'offer';
      urgency?: string;
      status?: string;
      limit?: number;
    },
    callback: (requests: DonationRequest[]) => void
  ): Unsubscribe {
    let q = query(
      collection(db, 'donationRequests'),
      where('status', 'in', ['active', 'partially_fulfilled']),
      orderBy('createdAt', 'desc')
    );

    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters.requestType) {
      q = query(q, where('requestType', '==', filters.requestType));
    }
    if (filters.urgency) {
      q = query(q, where('urgency', '==', filters.urgency));
    }
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    return onSnapshot(q, (snapshot) => {
      const requests: DonationRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as DonationRequest);
      });
      callback(requests);
    });
  }

  // ===== ALERTAS DE EMERGÊNCIA (RN12) =====

  /**
   * Cria um novo alerta de emergência (apenas Defesa Civil)
   * @param data Dados do alerta de emergência
   * @returns ID do alerta criado
   */
  static async createEmergencyAlert(data: CreateEmergencyAlertData): Promise<string> {
    this.validateService();
    
    try {
      console.log('🚨 Creating emergency alert with real Cloud Function...');
      
      // Validate required fields
      if (!data.title || !data.message || !data.affectedArea) {
        throw new Error('Dados obrigatórios faltando: título, mensagem e área afetada');
      }
      
      // Validate affected area
      if (!data.affectedArea.centerPoint || data.affectedArea.radius <= 0) {
        throw new Error('Área afetada inválida');
      }
      
      const result = await createEmergencyAlertFn(data);
      
      if (!result.data?.alertId) {
        throw new Error('Cloud Function retornou resposta inválida');
      }
      
      console.log('✅ Emergency alert created successfully:', result.data.alertId);
      return result.data.alertId;
    } catch (error: any) {
      console.error('❌ Erro ao criar alerta de emergência:', error);
      
      if (error.code === 'permission-denied') {
        throw new Error('Apenas a Defesa Civil pode criar alertas de emergência');
      } else if (error.code === 'invalid-argument') {
        throw new Error('Dados do alerta inválidos');
      }
      
      throw new Error(error.message ?? 'Erro ao criar alerta de emergência');
    }
  }

  /**
   * Busca alertas de emergência ativos por localização
   * @param filters Filtros de busca
   * @returns Lista de alertas ativos
   */
  static async getActiveEmergencyAlerts(filters: {
    location?: { latitude: number; longitude: number; };
    radius?: number;
    severity?: string;
    alertType?: string;
  }): Promise<EmergencyAlert[]> {
    this.validateService();
    
    try {
      console.log('🔍 Fetching emergency alerts with real Cloud Function...');
      
      // Validate location if provided
      if (filters.location) {
        const { latitude, longitude } = filters.location;
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          throw new Error('Coordenadas geográficas inválidas');
        }
      }
      
      const result = await getActiveEmergencyAlertsFn(filters);
      
      if (!result.data?.alerts) {
        throw new Error('Cloud Function retornou resposta inválida');
      }
      
      console.log(`✅ Found ${result.data.alerts.length} active emergency alerts`);
      return result.data.alerts;
    } catch (error: any) {
      console.error('❌ Erro ao buscar alertas de emergência:', error);
      
      if (error.code === 'invalid-argument') {
        throw new Error('Parâmetros de busca inválidos');
      }
      
      throw new Error(error.message ?? 'Erro ao buscar alertas de emergência');
    }
  }

  /**
   * Confirma recebimento de um alerta de emergência
   * @param alertId ID do alerta
   * @param acknowledged Status de confirmação
   * @returns Sucesso da operação
   */
  static async acknowledgeEmergencyAlert(alertId: string, acknowledged: boolean = true): Promise<boolean> {
    this.validateService();
    
    try {
      console.log('📝 Acknowledging emergency alert with real Cloud Function...');
      
      if (!alertId) {
        throw new Error('ID do alerta é obrigatório');
      }
      
      // Verify alert exists
      const alertDoc = await getDoc(doc(db, 'emergencyAlerts', alertId));
      if (!alertDoc.exists()) {
        throw new Error('Alerta de emergência não encontrado');
      }
      
      const result = await acknowledgeEmergencyAlertFn({ alertId, acknowledged });
      
      if (result.data?.success === undefined) {
        throw new Error('Cloud Function retornou resposta inválida');
      }
      
      console.log('✅ Emergency alert acknowledged successfully');
      return result.data.success;
    } catch (error: any) {
      console.error('❌ Erro ao confirmar alerta de emergência:', error);
      
      if (error.code === 'not-found') {
        throw new Error('Alerta de emergência não encontrado');
      }
      
      throw new Error(error.message ?? 'Erro ao confirmar alerta de emergência');
    }
  }

  /**
   * Monitora alertas de emergência ativos em tempo real
   */
  static subscribeToEmergencyAlerts(
    filters: {
      location?: { latitude: number; longitude: number; };
      severity?: string;
      alertType?: string;
    },
    callback: (alerts: EmergencyAlert[]) => void
  ): Unsubscribe {
    let q = query(
      collection(db, 'emergencyAlerts'),
      where('isActive', '==', true),
      orderBy('severity', 'desc'),
      orderBy('createdAt', 'desc')
    );

    if (filters.alertType) {
      q = query(q, where('alertType', '==', filters.alertType));
    }
    if (filters.severity) {
      q = query(q, where('severity', '==', filters.severity));
    }

    return onSnapshot(q, (snapshot) => {
      const alerts: EmergencyAlert[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        alerts.push({
          id: doc.id,
          ...data,
          startTime: data.startTime?.toDate(),
          endTime: data.endTime?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as EmergencyAlert);
      });
      callback(alerts);
    });
  }
}

export default AdditionalFeaturesService;
