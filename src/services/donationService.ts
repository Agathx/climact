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
  doc
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
export interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  category: 'environmental' | 'emergency_relief' | 'infrastructure' | 'education' | 'community';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  organizationId: string;
  organizationName: string;
  organizationVerified: boolean;
  images: string[];
  location?: {
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    country: string;
  };
  tags: string[];
  donorsCount: number;
  updatesCount: number;
  featured: boolean;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  transparency: {
    documentsRequired: boolean;
    reportsRequired: boolean;
    auditRequired: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  campaignId: string;
  donorId: string;
  donorName?: string; // opcional para doações anônimas
  amount: number;
  currency: string;
  paymentMethod: 'pix' | 'credit_card' | 'bank_transfer' | 'crypto';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  anonymous: boolean;
  message?: string;
  transactionId?: string;
  paymentDetails?: any;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface DonationUpdate {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  images?: string[];
  type: 'progress' | 'milestone' | 'completion' | 'emergency' | 'transparency';
  amountUsed?: number;
  receipts?: string[];
  createdAt: string;
  createdBy: string;
}

export interface CreateCampaignData {
  title: string;
  description: string;
  shortDescription: string;
  targetAmount: number;
  currency: string;
  category: DonationCampaign['category'];
  endDate?: string;
  images: string[];
  location?: DonationCampaign['location'];
  tags: string[];
  urgency: DonationCampaign['urgency'];
  transparency: DonationCampaign['transparency'];
}

export interface CreateDonationData {
  campaignId: string;
  amount: number;
  paymentMethod: Donation['paymentMethod'];
  anonymous: boolean;
  message?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  clientSecret?: string;
  pixCode?: string;
  bankDetails?: any;
  expiresAt: string;
}

// Cloud Functions
const getDonationCampaignsFn = httpsCallable<{
  campaignId?: string;
  category?: string;
  status?: string;
  organizationId?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
}, { 
  campaigns: DonationCampaign[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>(functions, 'getDonationCampaigns');

const createDonationCampaignFn = httpsCallable<CreateCampaignData, { campaignId: string }>(functions, 'createDonationCampaign');

const createDonationFn = httpsCallable<CreateDonationData, { 
  donationId: string;
  paymentIntent: PaymentIntent;
}>(functions, 'createDonation');

const confirmDonationFn = httpsCallable<{ 
  donationId: string;
  paymentConfirmation: any;
}, { success: boolean; donation: Donation }>(functions, 'confirmDonation');

const getDonationHistoryFn = httpsCallable<{
  userId?: string;
  campaignId?: string;
  status?: string;
  limit?: number;
}, { donations: Donation[] }>(functions, 'getDonationHistory');

const getCampaignUpdatesFn = httpsCallable<{
  campaignId: string;
  limit?: number;
}, { updates: DonationUpdate[] }>(functions, 'getCampaignUpdates');

const createCampaignUpdateFn = httpsCallable<{
  campaignId: string;
  title: string;
  content: string;
  type: DonationUpdate['type'];
  images?: string[];
  amountUsed?: number;
  receipts?: string[];
}, { updateId: string }>(functions, 'createCampaignUpdate');

const getCampaignStatsFn = httpsCallable<{
  campaignId?: string;
  organizationId?: string;
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
}, {
  totalRaised: number;
  totalDonations: number;
  totalDonors: number;
  averageDonation: number;
  campaignsCount: number;
  completionRate: number;
}>(functions, 'getCampaignStats');

/**
 * Donation Service
 * Implementa RN06: Sistema de Doações
 */
export class DonationService {
  // Real-time listeners storage
  private static listeners: Map<string, Unsubscribe> = new Map();

  /**
   * Busca campanhas de doação com filtros
   * @param filters Filtros de busca
   * @returns Promise com lista de campanhas
   */
  static async getCampaigns(filters: {
    campaignId?: string;
    category?: string;
    status?: string;
    organizationId?: string;
    featured?: boolean;
    limit?: number;
    page?: number;
  } = {}): Promise<{
    campaigns: DonationCampaign[];
    pagination?: any;
  }> {
    try {
      const result = await getDonationCampaignsFn(filters);
      
      if (!result.data) {
        return { campaigns: [] };
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao buscar campanhas:', error);
      throw new Error(error.message || 'Erro ao buscar campanhas');
    }
  }

  /**
   * Busca campanha específica por ID
   * @param campaignId ID da campanha
   * @returns Promise com dados da campanha
   */
  static async getCampaign(campaignId: string): Promise<DonationCampaign> {
    try {
      if (!campaignId?.trim()) {
        throw new Error('ID da campanha é obrigatório');
      }

      const result = await this.getCampaigns({ campaignId });
      
      if (!result.campaigns || result.campaigns.length === 0) {
        throw new Error('Campanha não encontrada');
      }

      return result.campaigns[0];
    } catch (error: any) {
      console.error('Erro ao buscar campanha:', error);
      throw new Error(error.message || 'Erro ao buscar campanha');
    }
  }

  /**
   * Busca campanhas em destaque
   * @param limit Limite de resultados
   * @returns Promise com campanhas em destaque
   */
  static async getFeaturedCampaigns(limit: number = 10): Promise<DonationCampaign[]> {
    const result = await this.getCampaigns({ featured: true, limit });
    return result.campaigns;
  }

  /**
   * Busca campanhas por categoria
   * @param category Categoria das campanhas
   * @param limit Limite de resultados
   * @returns Promise com campanhas da categoria
   */
  static async getCampaignsByCategory(
    category: DonationCampaign['category'],
    limit: number = 20
  ): Promise<DonationCampaign[]> {
    const result = await this.getCampaigns({ category, status: 'active', limit });
    return result.campaigns;
  }

  /**
   * Cria nova campanha de doação (apenas organizações verificadas)
   * @param campaignData Dados da campanha
   * @returns Promise com ID da campanha criada
   */
  static async createCampaign(campaignData: CreateCampaignData): Promise<string> {
    try {
      // Validação básica
      const validation = this.validateCampaignData(campaignData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const result = await createDonationCampaignFn(campaignData);
      
      if (!result.data?.campaignId) {
        throw new Error('Erro interno: ID da campanha não retornado');
      }

      return result.data.campaignId;
    } catch (error: any) {
      console.error('Erro ao criar campanha:', error);
      throw new Error(error.message || 'Erro ao criar campanha');
    }
  }

  /**
   * Cria nova doação
   * @param donationData Dados da doação
   * @returns Promise com ID da doação e dados de pagamento
   */
  static async createDonation(donationData: CreateDonationData): Promise<{
    donationId: string;
    paymentIntent: PaymentIntent;
  }> {
    try {
      // Validação básica
      const validation = this.validateDonationData(donationData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const result = await createDonationFn(donationData);
      
      if (!result.data?.donationId || !result.data?.paymentIntent) {
        throw new Error('Erro interno: dados de doação/pagamento não retornados');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao criar doação:', error);
      throw new Error(error.message || 'Erro ao criar doação');
    }
  }

  /**
   * Confirma pagamento de doação
   * @param donationId ID da doação
   * @param paymentConfirmation Dados de confirmação do pagamento
   * @returns Promise com dados da doação confirmada
   */
  static async confirmDonation(
    donationId: string,
    paymentConfirmation: any
  ): Promise<Donation> {
    try {
      if (!donationId?.trim()) {
        throw new Error('ID da doação é obrigatório');
      }

      const result = await confirmDonationFn({ donationId, paymentConfirmation });
      
      if (!result.data?.donation) {
        throw new Error('Erro ao confirmar doação');
      }

      return result.data.donation;
    } catch (error: any) {
      console.error('Erro ao confirmar doação:', error);
      throw new Error(error.message || 'Erro ao confirmar doação');
    }
  }

  /**
   * Busca histórico de doações do usuário
   * @param filters Filtros de busca
   * @returns Promise com histórico de doações
   */
  static async getDonationHistory(filters: {
    userId?: string;
    campaignId?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<Donation[]> {
    try {
      const result = await getDonationHistoryFn(filters);
      
      if (!result.data?.donations) {
        return [];
      }

      return result.data.donations;
    } catch (error: any) {
      console.error('Erro ao buscar histórico de doações:', error);
      throw new Error(error.message || 'Erro ao buscar histórico de doações');
    }
  }

  /**
   * Busca atualizações de uma campanha
   * @param campaignId ID da campanha
   * @param limit Limite de resultados
   * @returns Promise com atualizações da campanha
   */
  static async getCampaignUpdates(
    campaignId: string,
    limit: number = 20
  ): Promise<DonationUpdate[]> {
    try {
      if (!campaignId?.trim()) {
        throw new Error('ID da campanha é obrigatório');
      }

      const result = await getCampaignUpdatesFn({ campaignId, limit });
      
      if (!result.data?.updates) {
        return [];
      }

      return result.data.updates;
    } catch (error: any) {
      console.error('Erro ao buscar atualizações da campanha:', error);
      throw new Error(error.message || 'Erro ao buscar atualizações da campanha');
    }
  }

  /**
   * Cria atualização para campanha (apenas criador da campanha)
   * @param updateData Dados da atualização
   * @returns Promise com ID da atualização criada
   */
  static async createCampaignUpdate(updateData: {
    campaignId: string;
    title: string;
    content: string;
    type: DonationUpdate['type'];
    images?: string[];
    amountUsed?: number;
    receipts?: string[];
  }): Promise<string> {
    try {
      // Validação básica
      if (!updateData.campaignId?.trim()) {
        throw new Error('ID da campanha é obrigatório');
      }

      if (!updateData.title?.trim()) {
        throw new Error('Título da atualização é obrigatório');
      }

      if (!updateData.content?.trim()) {
        throw new Error('Conteúdo da atualização é obrigatório');
      }

      const result = await createCampaignUpdateFn(updateData);
      
      if (!result.data?.updateId) {
        throw new Error('Erro interno: ID da atualização não retornado');
      }

      return result.data.updateId;
    } catch (error: any) {
      console.error('Erro ao criar atualização:', error);
      throw new Error(error.message || 'Erro ao criar atualização');
    }
  }

  /**
   * Busca estatísticas de campanhas/doações
   * @param filters Filtros para estatísticas
   * @returns Promise com estatísticas
   */
  static async getStats(filters: {
    campaignId?: string;
    organizationId?: string;
    timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
  } = {}) {
    try {
      const result = await getCampaignStatsFn(filters);
      
      if (!result.data) {
        throw new Error('Erro ao buscar estatísticas');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error(error.message || 'Erro ao buscar estatísticas');
    }
  }

  /**
   * Configura listener em tempo real para uma campanha
   * @param campaignId ID da campanha
   * @param callback Função de callback para mudanças
   * @returns Função para cancelar o listener
   */
  static listenToCampaign(
    campaignId: string,
    callback: (campaign: DonationCampaign | null) => void
  ): Unsubscribe {
    try {
      if (!campaignId?.trim()) {
        throw new Error('ID da campanha é obrigatório');
      }

      const unsubscribe = onSnapshot(
        doc(db, 'donationCampaigns', campaignId),
        (doc) => {
          if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as DonationCampaign);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Erro no listener da campanha:', error);
        }
      );

      const listenerId = `campaign_${campaignId}`;
      this.listeners.set(listenerId, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
      };
    } catch (error: any) {
      console.error('Erro ao configurar listener da campanha:', error);
      throw new Error('Erro ao configurar atualizações em tempo real');
    }
  }

  /**
   * Configura listener para doações de uma campanha
   * @param campaignId ID da campanha
   * @param callback Função de callback
   * @returns Função para cancelar o listener
   */
  static listenToCampaignDonations(
    campaignId: string,
    callback: (donations: Donation[]) => void
  ): Unsubscribe {
    try {
      if (!campaignId?.trim()) {
        throw new Error('ID da campanha é obrigatório');
      }

      const donationsQuery = query(
        collection(db, 'donations'),
        where('campaignId', '==', campaignId),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(donationsQuery,
        (snapshot) => {
          const donations: Donation[] = [];
          snapshot.forEach((doc) => {
            donations.push({ id: doc.id, ...doc.data() } as Donation);
          });
          callback(donations);
        },
        (error) => {
          console.error('Erro no listener de doações:', error);
        }
      );

      const listenerId = `donations_${campaignId}`;
      this.listeners.set(listenerId, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
      };
    } catch (error: any) {
      console.error('Erro ao configurar listener de doações:', error);
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
   * Valida dados de campanha
   */
  static validateCampaignData(data: Partial<CreateCampaignData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validação de textos básicos
    this.validateCampaignTexts(data, errors);

    // Validação de valores e categoria
    this.validateCampaignValues(data, errors);

    // Validação de mídia e tags
    this.validateCampaignMedia(data, errors);

    // Validação de data
    this.validateCampaignDate(data, errors);

    // Validação de localização
    this.validateCampaignLocation(data, errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida textos da campanha
   */
  private static validateCampaignTexts(data: Partial<CreateCampaignData>, errors: string[]): void {
    if (!data.title?.trim()) {
      errors.push('Título é obrigatório');
    } else if (data.title.length < 10 || data.title.length > 100) {
      errors.push('Título deve ter entre 10 e 100 caracteres');
    }

    if (!data.description?.trim()) {
      errors.push('Descrição é obrigatória');
    } else if (data.description.length < 100 || data.description.length > 5000) {
      errors.push('Descrição deve ter entre 100 e 5000 caracteres');
    }

    if (!data.shortDescription?.trim()) {
      errors.push('Descrição curta é obrigatória');
    } else if (data.shortDescription.length < 20 || data.shortDescription.length > 200) {
      errors.push('Descrição curta deve ter entre 20 e 200 caracteres');
    }
  }

  /**
   * Valida valores e categoria da campanha
   */
  private static validateCampaignValues(data: Partial<CreateCampaignData>, errors: string[]): void {
    if (!data.targetAmount || data.targetAmount <= 0) {
      errors.push('Meta de arrecadação deve ser maior que zero');
    } else if (data.targetAmount > 10000000) { // 10 milhões
      errors.push('Meta de arrecadação muito alta');
    }

    const validCategories = ['environmental', 'emergency_relief', 'infrastructure', 'education', 'community'];
    if (!data.category || !validCategories.includes(data.category)) {
      errors.push('Categoria inválida');
    }

    const validUrgencies = ['low', 'medium', 'high', 'critical'];
    if (!data.urgency || !validUrgencies.includes(data.urgency)) {
      errors.push('Urgência inválida');
    }
  }

  /**
   * Valida mídia e tags da campanha
   */
  private static validateCampaignMedia(data: Partial<CreateCampaignData>, errors: string[]): void {
    if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
      errors.push('Pelo menos uma imagem é obrigatória');
    } else if (data.images.length > 10) {
      errors.push('Máximo de 10 imagens permitidas');
    }

    if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
      errors.push('Pelo menos uma tag é obrigatória');
    } else if (data.tags.length > 10) {
      errors.push('Máximo de 10 tags permitidas');
    }
  }

  /**
   * Valida data da campanha
   */
  private static validateCampaignDate(data: Partial<CreateCampaignData>, errors: string[]): void {
    if (!data.endDate) return;

    const endDate = new Date(data.endDate);
    const now = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2); // Máximo 2 anos

    if (endDate <= now) {
      errors.push('Data de fim deve ser futura');
    } else if (endDate > maxDate) {
      errors.push('Data de fim não pode ser mais de 2 anos no futuro');
    }
  }

  /**
   * Valida localização da campanha
   */
  private static validateCampaignLocation(data: Partial<CreateCampaignData>, errors: string[]): void {
    if (!data.location) return;

    if (!data.location.coordinates || data.location.coordinates.length !== 2) {
      errors.push('Coordenadas de localização inválidas');
      return;
    }

    const [lng, lat] = data.location.coordinates;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push('Coordenadas fora dos limites válidos');
    }

    if (!data.location.address?.trim()) {
      errors.push('Endereço é obrigatório quando localização é fornecida');
    }
  }

  /**
   * Valida dados de doação
   */
  static validateDonationData(data: Partial<CreateDonationData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.campaignId?.trim()) {
      errors.push('ID da campanha é obrigatório');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Valor da doação deve ser maior que zero');
    } else if (data.amount < 1) { // Mínimo R$ 1,00
      errors.push('Valor mínimo da doação é R$ 1,00');
    } else if (data.amount > 1000000) { // Máximo R$ 1 milhão
      errors.push('Valor máximo da doação é R$ 1.000.000,00');
    }

    const validPaymentMethods = ['pix', 'credit_card', 'bank_transfer', 'crypto'];
    if (!data.paymentMethod || !validPaymentMethods.includes(data.paymentMethod)) {
      errors.push('Método de pagamento inválido');
    }

    if (data.anonymous === undefined || data.anonymous === null) {
      errors.push('É necessário especificar se a doação é anônima');
    }

    if (data.message && data.message.length > 500) {
      errors.push('Mensagem não pode ter mais de 500 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formata campanha para exibição
   */
  static formatCampaignForDisplay(campaign: DonationCampaign) {
    const progressPercentage = (campaign.currentAmount / campaign.targetAmount) * 100;
    const daysLeft = campaign.endDate ? 
      Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 
      null;

    return {
      ...campaign,
      createdAtFormatted: new Date(campaign.createdAt).toLocaleDateString('pt-BR'),
      startDateFormatted: new Date(campaign.startDate).toLocaleDateString('pt-BR'),
      endDateFormatted: campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('pt-BR') : null,
      progressPercentage: Math.min(100, Math.round(progressPercentage)),
      remainingAmount: Math.max(0, campaign.targetAmount - campaign.currentAmount),
      daysLeft,
      categoryText: this.getCategoryText(campaign.category),
      statusText: this.getStatusText(campaign.status),
      urgencyText: this.getUrgencyText(campaign.urgency),
      currentAmountFormatted: this.formatCurrency(campaign.currentAmount, campaign.currency),
      targetAmountFormatted: this.formatCurrency(campaign.targetAmount, campaign.currency),
      averageDonation: campaign.donorsCount > 0 ? campaign.currentAmount / campaign.donorsCount : 0
    };
  }

  /**
   * Formata doação para exibição
   */
  static formatDonationForDisplay(donation: Donation) {
    return {
      ...donation,
      createdAtFormatted: new Date(donation.createdAt).toLocaleString('pt-BR'),
      completedAtFormatted: donation.completedAt ? new Date(donation.completedAt).toLocaleString('pt-BR') : null,
      amountFormatted: this.formatCurrency(donation.amount, donation.currency),
      statusText: this.getDonationStatusText(donation.status),
      paymentMethodText: this.getPaymentMethodText(donation.paymentMethod)
    };
  }

  // Métodos auxiliares de formatação
  private static formatCurrency(amount: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  private static getCategoryText(category: string): string {
    const categoryMap: Record<string, string> = {
      'environmental': 'Ambiental',
      'emergency_relief': 'Socorro de Emergência',
      'infrastructure': 'Infraestrutura',
      'education': 'Educação',
      'community': 'Comunidade'
    };
    return categoryMap[category] || category;
  }

  private static getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'active': 'Ativa',
      'paused': 'Pausada',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    };
    return statusMap[status] || status;
  }

  private static getUrgencyText(urgency: string): string {
    const urgencyMap: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    return urgencyMap[urgency] || urgency;
  }

  private static getDonationStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pendente',
      'processing': 'Processando',
      'completed': 'Concluída',
      'failed': 'Falhou',
      'refunded': 'Reembolsada'
    };
    return statusMap[status] || status;
  }

  private static getPaymentMethodText(method: string): string {
    const methodMap: Record<string, string> = {
      'pix': 'PIX',
      'credit_card': 'Cartão de Crédito',
      'bank_transfer': 'Transferência Bancária',
      'crypto': 'Criptomoeda'
    };
    return methodMap[method] || method;
  }
}

export default DonationService;
