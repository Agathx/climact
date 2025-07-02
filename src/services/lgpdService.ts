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
  Unsubscribe
} from 'firebase/firestore';
import { app, db } from '@/lib/firebase';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Connect to emulator in development
if (process.env.NODE_ENV === 'development' && !functions.app.options.projectId?.includes('demo')) {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch {
    // Emulator already connected or not available
  }
}

// Types
export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'third_party' | 'profiling' | 'location';
  purpose: string;
  status: 'given' | 'withdrawn' | 'expired';
  givenAt: string;
  withdrawnAt?: string;
  expiresAt?: string;
  version: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export interface DataRequest {
  id: string;
  userId: string;
  type: 'access' | 'portability' | 'deletion' | 'rectification' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  description?: string;
  requestedData?: string[];
  reason?: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  downloadUrl?: string;
  metadata?: Record<string, any>;
}

export interface PrivacyPolicy {
  id: string;
  version: string;
  content: string;
  summary: string;
  effectiveDate: string;
  changes?: string[];
  active: boolean;
  language: string;
  createdAt: string;
  approvedBy: string;
}

export interface DataBreachIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'contained' | 'resolved' | 'reported';
  affectedUsers: number;
  dataTypes: string[];
  detectedAt: string;
  containedAt?: string;
  resolvedAt?: string;
  reportedToAuthority?: boolean;
  reportedAt?: string;
  notifiedUsers?: boolean;
  notificationSentAt?: string;
  mitigationSteps: string[];
  rootCause?: string;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  dataAccessed?: string[];
  legal_basis?: string;
}

export interface CreateDataRequestData {
  type: DataRequest['type'];
  description?: string;
  requestedData?: string[];
  reason?: string;
}

export interface UpdateConsentData {
  consentType: ConsentRecord['consentType'];
  status: 'given' | 'withdrawn';
  purpose: string;
  version?: string;
}

// Cloud Functions
const getConsentRecordsFn = httpsCallable<{
  userId?: string;
  consentType?: string;
  status?: string;
}, { consents: ConsentRecord[] }>(functions, 'getConsentRecords');

const updateConsentFn = httpsCallable<UpdateConsentData, { consentId: string }>(functions, 'updateConsent');

const createDataRequestFn = httpsCallable<CreateDataRequestData, { requestId: string }>(functions, 'createDataRequest');

const getDataRequestsFn = httpsCallable<{
  userId?: string;
  type?: string;
  status?: string;
}, { requests: DataRequest[] }>(functions, 'getDataRequests');

const processDataRequestFn = httpsCallable<{
  requestId: string;
  action: 'approve' | 'reject';
  reason?: string;
}, { success: boolean }>(functions, 'processDataRequest');

const getPrivacyPolicyFn = httpsCallable<{
  version?: string;
  language?: string;
}, { policy: PrivacyPolicy }>(functions, 'getPrivacyPolicy');

const getAuditLogsFn = httpsCallable<{
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}, { logs: AuditLog[] }>(functions, 'getAuditLogs');

const exportUserDataFn = httpsCallable<{
  userId?: string;
  dataTypes?: string[];
  format?: 'json' | 'csv' | 'xml';
}, { downloadUrl: string; expiresAt: string }>(functions, 'exportUserData');

const deleteUserDataFn = httpsCallable<{
  userId?: string;
  dataTypes?: string[];
  confirmation: boolean;
}, { success: boolean; deletedData: string[] }>(functions, 'deleteUserData');

const anonymizeUserDataFn = httpsCallable<{
  userId: string;
  dataTypes?: string[];
}, { success: boolean; anonymizedData: string[] }>(functions, 'anonymizeUserData');

/**
 * LGPD Service
 * Implementa RN08: Conformidade LGPD e RN12: Auditoria e Transparência
 */
export class LGPDService {
  // Real-time listeners storage
  private static listeners: Map<string, Unsubscribe> = new Map();

  /**
   * Busca registros de consentimento do usuário
   * @param filters Filtros de busca
   * @returns Promise com registros de consentimento
   */
  static async getConsentRecords(filters: {
    userId?: string;
    consentType?: string;
    status?: string;
  } = {}): Promise<ConsentRecord[]> {
    try {
      const result = await getConsentRecordsFn(filters);
      
      if (!result.data?.consents) {
        return [];
      }

      return result.data.consents;
    } catch (error: any) {
      console.error('Erro ao buscar registros de consentimento:', error);
      throw new Error(error.message || 'Erro ao buscar registros de consentimento');
    }
  }

  /**
   * Atualiza consentimento do usuário
   * @param consentData Dados do consentimento
   * @returns Promise com ID do registro de consentimento
   */
  static async updateConsent(consentData: UpdateConsentData): Promise<string> {
    try {
      // Validação básica
      const validation = this.validateConsentData(consentData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const result = await updateConsentFn(consentData);
      
      if (!result.data?.consentId) {
        throw new Error('Erro interno: ID do consentimento não retornado');
      }

      return result.data.consentId;
    } catch (error: any) {
      console.error('Erro ao atualizar consentimento:', error);
      throw new Error(error.message || 'Erro ao atualizar consentimento');
    }
  }

  /**
   * Concede consentimento para um tipo específico
   * @param consentType Tipo de consentimento
   * @param purpose Finalidade do consentimento
   * @returns Promise com ID do registro
   */
  static async giveConsent(
    consentType: ConsentRecord['consentType'],
    purpose: string
  ): Promise<string> {
    return this.updateConsent({
      consentType,
      status: 'given',
      purpose
    });
  }

  /**
   * Retira consentimento para um tipo específico
   * @param consentType Tipo de consentimento
   * @param purpose Finalidade do consentimento
   * @returns Promise com ID do registro
   */
  static async withdrawConsent(
    consentType: ConsentRecord['consentType'],
    purpose: string
  ): Promise<string> {
    return this.updateConsent({
      consentType,
      status: 'withdrawn',
      purpose
    });
  }

  /**
   * Cria solicitação de dados (LGPD)
   * @param requestData Dados da solicitação
   * @returns Promise com ID da solicitação
   */
  static async createDataRequest(requestData: CreateDataRequestData): Promise<string> {
    try {
      // Validação básica
      const validation = this.validateDataRequestData(requestData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const result = await createDataRequestFn(requestData);
      
      if (!result.data?.requestId) {
        throw new Error('Erro interno: ID da solicitação não retornado');
      }

      return result.data.requestId;
    } catch (error: any) {
      console.error('Erro ao criar solicitação de dados:', error);
      throw new Error(error.message || 'Erro ao criar solicitação de dados');
    }
  }

  /**
   * Solicita acesso aos dados pessoais (Artigo 15)
   * @param requestedData Tipos de dados solicitados
   * @param reason Motivo da solicitação
   * @returns Promise com ID da solicitação
   */
  static async requestDataAccess(
    requestedData?: string[],
    reason?: string
  ): Promise<string> {
    return this.createDataRequest({
      type: 'access',
      requestedData,
      reason: reason || 'Solicitação de acesso aos dados pessoais conforme LGPD'
    });
  }

  /**
   * Solicita portabilidade dos dados (Artigo 18)
   * @param requestedData Tipos de dados para portabilidade
   * @param reason Motivo da solicitação
   * @returns Promise com ID da solicitação
   */
  static async requestDataPortability(
    requestedData?: string[],
    reason?: string
  ): Promise<string> {
    return this.createDataRequest({
      type: 'portability',
      requestedData,
      reason: reason || 'Solicitação de portabilidade dos dados conforme LGPD'
    });
  }

  /**
   * Solicita exclusão dos dados (Artigo 16)
   * @param requestedData Tipos de dados para exclusão
   * @param reason Motivo da solicitação
   * @returns Promise com ID da solicitação
   */
  static async requestDataDeletion(
    requestedData?: string[],
    reason?: string
  ): Promise<string> {
    return this.createDataRequest({
      type: 'deletion',
      requestedData,
      reason: reason || 'Solicitação de exclusão dos dados conforme LGPD'
    });
  }

  /**
   * Solicita retificação dos dados (Artigo 16)
   * @param description Descrição das correções necessárias
   * @param reason Motivo da solicitação
   * @returns Promise com ID da solicitação
   */
  static async requestDataRectification(
    description: string,
    reason?: string
  ): Promise<string> {
    return this.createDataRequest({
      type: 'rectification',
      description,
      reason: reason || 'Solicitação de retificação dos dados conforme LGPD'
    });
  }

  /**
   * Busca solicitações de dados do usuário
   * @param filters Filtros de busca
   * @returns Promise com solicitações
   */
  static async getDataRequests(filters: {
    userId?: string;
    type?: string;
    status?: string;
  } = {}): Promise<DataRequest[]> {
    try {
      const result = await getDataRequestsFn(filters);
      
      if (!result.data?.requests) {
        return [];
      }

      return result.data.requests;
    } catch (error: any) {
      console.error('Erro ao buscar solicitações de dados:', error);
      throw new Error(error.message || 'Erro ao buscar solicitações de dados');
    }
  }

  /**
   * Busca política de privacidade atual
   * @param version Versão específica (opcional)
   * @param language Idioma (opcional)
   * @returns Promise com política de privacidade
   */
  static async getPrivacyPolicy(
    version?: string,
    language?: string
  ): Promise<PrivacyPolicy> {
    try {
      const result = await getPrivacyPolicyFn({ version, language });
      
      if (!result.data?.policy) {
        throw new Error('Política de privacidade não encontrada');
      }

      return result.data.policy;
    } catch (error: any) {
      console.error('Erro ao buscar política de privacidade:', error);
      throw new Error(error.message || 'Erro ao buscar política de privacidade');
    }
  }

  /**
   * Busca logs de auditoria
   * @param filters Filtros de busca
   * @returns Promise with audit logs
   */
  static async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<AuditLog[]> {
    try {
      const result = await getAuditLogsFn(filters);
      
      if (!result.data?.logs) {
        return [];
      }

      return result.data.logs;
    } catch (error: any) {
      console.error('Erro ao buscar logs de auditoria:', error);
      throw new Error(error.message || 'Erro ao buscar logs de auditoria');
    }
  }

  /**
   * Exporta dados do usuário
   * @param dataTypes Tipos de dados para exportar
   * @param format Formato do arquivo
   * @returns Promise com URL de download
   */
  static async exportUserData(
    dataTypes?: string[],
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    try {
      const result = await exportUserDataFn({ dataTypes, format });
      
      if (!result.data?.downloadUrl) {
        throw new Error('Erro ao gerar exportação');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao exportar dados:', error);
      throw new Error(error.message || 'Erro ao exportar dados');
    }
  }

  /**
   * Exclui dados do usuário (IRREVERSÍVEL)
   * @param dataTypes Tipos de dados para exclusão
   * @param confirmation Confirmação explícita
   * @returns Promise com resultado da exclusão
   */
  static async deleteUserData(
    dataTypes?: string[],
    confirmation: boolean = false
  ): Promise<{ success: boolean; deletedData: string[] }> {
    try {
      if (!confirmation) {
        throw new Error('Confirmação explícita é obrigatória para exclusão de dados');
      }

      const result = await deleteUserDataFn({ dataTypes, confirmation });
      
      if (!result.data) {
        throw new Error('Erro ao processar exclusão');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao excluir dados:', error);
      throw new Error(error.message || 'Erro ao excluir dados');
    }
  }

  /**
   * Anonimiza dados do usuário
   * @param userId ID do usuário
   * @param dataTypes Tipos de dados para anonimizar
   * @returns Promise com resultado da anonimização
   */
  static async anonymizeUserData(
    userId: string,
    dataTypes?: string[]
  ): Promise<{ success: boolean; anonymizedData: string[] }> {
    try {
      if (!userId?.trim()) {
        throw new Error('ID do usuário é obrigatório');
      }

      const result = await anonymizeUserDataFn({ userId, dataTypes });
      
      if (!result.data) {
        throw new Error('Erro ao processar anonimização');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao anonimizar dados:', error);
      throw new Error(error.message || 'Erro ao anonimizar dados');
    }
  }

  /**
   * Configura listener para solicitações de dados do usuário
   * @param userId ID do usuário
   * @param callback Função de callback
   * @returns Função para cancelar o listener
   */
  static listenToDataRequests(
    userId: string,
    callback: (requests: DataRequest[]) => void
  ): Unsubscribe {
    try {
      if (!userId?.trim()) {
        throw new Error('ID do usuário é obrigatório');
      }

      const requestsQuery = query(
        collection(db, 'dataRequests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(requestsQuery,
        (snapshot) => {
          const requests: DataRequest[] = [];
          snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as DataRequest);
          });
          callback(requests);
        },
        (error) => {
          console.error('Erro no listener de solicitações:', error);
        }
      );

      const listenerId = `data_requests_${userId}`;
      this.listeners.set(listenerId, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
      };
    } catch (error: any) {
      console.error('Erro ao configurar listener de solicitações:', error);
      throw new Error('Erro ao configurar atualizações em tempo real');
    }
  }

  /**
   * Configura listener para registros de consentimento
   * @param userId ID do usuário
   * @param callback Função de callback
   * @returns Função para cancelar o listener
   */
  static listenToConsentRecords(
    userId: string,
    callback: (consents: ConsentRecord[]) => void
  ): Unsubscribe {
    try {
      if (!userId?.trim()) {
        throw new Error('ID do usuário é obrigatório');
      }

      const consentsQuery = query(
        collection(db, 'consentRecords'),
        where('userId', '==', userId),
        orderBy('givenAt', 'desc')
      );

      const unsubscribe = onSnapshot(consentsQuery,
        (snapshot) => {
          const consents: ConsentRecord[] = [];
          snapshot.forEach((doc) => {
            consents.push({ id: doc.id, ...doc.data() } as ConsentRecord);
          });
          callback(consents);
        },
        (error) => {
          console.error('Erro no listener de consentimentos:', error);
        }
      );

      const listenerId = `consents_${userId}`;
      this.listeners.set(listenerId, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
      };
    } catch (error: any) {
      console.error('Erro ao configurar listener de consentimentos:', error);
      throw new Error('Erro ao configurar atualizações em tempo real');
    }
  }

  /**
   * Limpa todos os listeners ativos
   */
  static cleanupListeners(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  /**
   * Valida dados de consentimento
   */
  static validateConsentData(data: Partial<UpdateConsentData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    const validConsentTypes = ['data_processing', 'marketing', 'analytics', 'third_party', 'profiling', 'location'];
    if (!data.consentType || !validConsentTypes.includes(data.consentType)) {
      errors.push('Tipo de consentimento inválido');
    }

    const validStatuses = ['given', 'withdrawn'];
    if (!data.status || !validStatuses.includes(data.status)) {
      errors.push('Status de consentimento inválido');
    }

    if (!data.purpose?.trim()) {
      errors.push('Finalidade do consentimento é obrigatória');
    } else if (data.purpose.length < 10 || data.purpose.length > 500) {
      errors.push('Finalidade deve ter entre 10 e 500 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida dados de solicitação LGPD
   */
  static validateDataRequestData(data: Partial<CreateDataRequestData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    const validTypes = ['access', 'portability', 'deletion', 'rectification', 'restriction'];
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push('Tipo de solicitação inválido');
    }

    if (data.description && data.description.length > 2000) {
      errors.push('Descrição não pode ter mais de 2000 caracteres');
    }

    if (data.reason && data.reason.length > 1000) {
      errors.push('Motivo não pode ter mais de 1000 caracteres');
    }

    if (data.requestedData && data.requestedData.length > 20) {
      errors.push('Máximo de 20 tipos de dados podem ser solicitados');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Verifica se o usuário tem consentimento ativo para um tipo específico
   * @param consentType Tipo de consentimento
   * @param consents Lista de consentimentos do usuário
   * @returns true se tem consentimento ativo
   */
  static hasActiveConsent(
    consentType: ConsentRecord['consentType'],
    consents: ConsentRecord[]
  ): boolean {
    const latestConsent = consents
      .filter(c => c.consentType === consentType)
      .sort((a, b) => new Date(b.givenAt).getTime() - new Date(a.givenAt).getTime())[0];

    if (!latestConsent) return false;

    // Verificar se não foi retirado
    if (latestConsent.status === 'withdrawn') return false;

    // Verificar se não expirou
    if (latestConsent.expiresAt && new Date(latestConsent.expiresAt) < new Date()) {
      return false;
    }

    return latestConsent.status === 'given';
  }

  /**
   * Formata registro de consentimento para exibição
   */
  static formatConsentForDisplay(consent: ConsentRecord) {
    return {
      ...consent,
      givenAtFormatted: new Date(consent.givenAt).toLocaleString('pt-BR'),
      withdrawnAtFormatted: consent.withdrawnAt ? new Date(consent.withdrawnAt).toLocaleString('pt-BR') : null,
      expiresAtFormatted: consent.expiresAt ? new Date(consent.expiresAt).toLocaleDateString('pt-BR') : null,
      statusText: this.getConsentStatusText(consent.status),
      typeText: this.getConsentTypeText(consent.consentType),
      isExpired: consent.expiresAt ? new Date(consent.expiresAt) < new Date() : false,
      isActive: consent.status === 'given' && (!consent.expiresAt || new Date(consent.expiresAt) >= new Date())
    };
  }

  /**
   * Formata solicitação de dados para exibição
   */
  static formatDataRequestForDisplay(request: DataRequest) {
    return {
      ...request,
      createdAtFormatted: new Date(request.createdAt).toLocaleString('pt-BR'),
      processedAtFormatted: request.processedAt ? new Date(request.processedAt).toLocaleString('pt-BR') : null,
      completedAtFormatted: request.completedAt ? new Date(request.completedAt).toLocaleString('pt-BR') : null,
      deadlineFormatted: new Date(request.deadline).toLocaleDateString('pt-BR'),
      statusText: this.getRequestStatusText(request.status),
      typeText: this.getRequestTypeText(request.type),
      priorityText: this.getPriorityText(request.priority),
      isOverdue: new Date(request.deadline) < new Date() && request.status !== 'completed',
      timeRemaining: this.calculateTimeRemaining(request.deadline)
    };
  }

  // Métodos auxiliares de formatação
  private static getConsentStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'given': 'Concedido',
      'withdrawn': 'Retirado',
      'expired': 'Expirado'
    };
    return statusMap[status] || status;
  }

  private static getConsentTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      'data_processing': 'Processamento de Dados',
      'marketing': 'Marketing',
      'analytics': 'Análises',
      'third_party': 'Terceiros',
      'profiling': 'Perfilagem',
      'location': 'Localização'
    };
    return typeMap[type] || type;
  }

  private static getRequestStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pendente',
      'processing': 'Processando',
      'completed': 'Concluída',
      'rejected': 'Rejeitada'
    };
    return statusMap[status] || status;
  }

  private static getRequestTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      'access': 'Acesso aos Dados',
      'portability': 'Portabilidade',
      'deletion': 'Exclusão',
      'rectification': 'Retificação',
      'restriction': 'Restrição'
    };
    return typeMap[type] || type;
  }

  private static getPriorityText(priority: string): string {
    const priorityMap: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta'
    };
    return priorityMap[priority] || priority;
  }

  private static calculateTimeRemaining(deadline: string): string {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return 'Vencido';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} dia${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      return 'Menos de 1 hora';
    }
  }
}

export default LGPDService;
