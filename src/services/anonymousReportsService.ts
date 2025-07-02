import { 
  httpsCallable, 
  connectFunctionsEmulator,
  getFunctions 
} from 'firebase/functions';
import { app } from '@/lib/firebase';
import { AnonymousReport, CreateAnonymousReportData } from '@/types/report';

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

// Cloud Functions
const createAnonymousReportFn = httpsCallable<CreateAnonymousReportData, { reportId: string }>(functions, 'createAnonymousReport');
const getAnonymousReportFn = httpsCallable<{ reportId: string }, AnonymousReport>(functions, 'getAnonymousReport');
const listAnonymousReportsFn = httpsCallable<{ 
  page?: number; 
  limit?: number; 
  status?: string;
  priority?: string;
  location?: string;
}, { 
  reports: AnonymousReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>(functions, 'listAnonymousReports');

/**
 * Anonymous Reports Service
 * Implementa RN07: Sistema de Relatórios Anônimos
 */
export class AnonymousReportsService {
  /**
   * Cria um novo relatório anônimo
   * @param reportData Dados do relatório anônimo
   * @returns Promise com ID do relatório criado
   */
  static async createReport(reportData: CreateAnonymousReportData): Promise<string> {
    try {
      // Validação básica
      if (!reportData.title?.trim()) {
        throw new Error('Título do relatório é obrigatório');
      }

      if (!reportData.description?.trim()) {
        throw new Error('Descrição do relatório é obrigatória');
      }

      if (!reportData.type) {
        throw new Error('Tipo do relatório é obrigatório');
      }

      if (!reportData.location?.coordinates || reportData.location.coordinates.length !== 2) {
        throw new Error('Localização válida é obrigatória');
      }

      const result = await createAnonymousReportFn(reportData);
      
      if (!result.data?.reportId) {
        throw new Error('Erro interno: ID do relatório não retornado');
      }

      return result.data.reportId;
    } catch (error: any) {
      console.error('Erro ao criar relatório anônimo:', error);
      throw new Error(error.message || 'Erro ao criar relatório anônimo');
    }
  }

  /**
   * Busca um relatório anônimo por ID
   * @param reportId ID do relatório
   * @returns Promise com dados do relatório
   */
  static async getReport(reportId: string): Promise<AnonymousReport> {
    try {
      if (!reportId?.trim()) {
        throw new Error('ID do relatório é obrigatório');
      }

      const result = await getAnonymousReportFn({ reportId });
      
      if (!result.data) {
        throw new Error('Relatório não encontrado');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao buscar relatório anônimo:', error);
      throw new Error(error.message || 'Erro ao buscar relatório anônimo');
    }
  }

  /**
   * Lista relatórios anônimos com filtros e paginação
   * @param filters Filtros de busca
   * @returns Promise com lista paginada de relatórios
   */
  static async listReports(filters: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    location?: string;
  } = {}) {
    try {
      const result = await listAnonymousReportsFn({
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        status: filters.status,
        priority: filters.priority,
        location: filters.location
      });

      if (!result.data) {
        throw new Error('Erro ao buscar relatórios');
      }

      return result.data;
    } catch (error: any) {
      console.error('Erro ao listar relatórios anônimos:', error);
      throw new Error(error.message || 'Erro ao listar relatórios anônimos');
    }
  }

  /**
   * Valida dados do relatório anônimo antes do envio
   * @param reportData Dados a serem validados
   * @returns Objeto com validação e erros
   */
  static validateReportData(reportData: Partial<CreateAnonymousReportData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validação de título
    this.validateTitle(reportData.title, errors);

    // Validação de descrição
    this.validateDescription(reportData.description, errors);

    // Validação de tipo
    this.validateType(reportData.type, errors);

    // Validação de prioridade
    this.validatePriority(reportData.priority, errors);

    // Validação de localização
    this.validateLocation(reportData.location, errors);

    // Validação de mídia
    this.validateMedia(reportData.mediaUrls, errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida título do relatório
   */
  private static validateTitle(title: string | undefined, errors: string[]): void {
    if (!title?.trim()) {
      errors.push('Título é obrigatório');
    } else if (title.length < 10) {
      errors.push('Título deve ter pelo menos 10 caracteres');
    } else if (title.length > 100) {
      errors.push('Título não pode ter mais de 100 caracteres');
    }
  }

  /**
   * Valida descrição do relatório
   */
  private static validateDescription(description: string | undefined, errors: string[]): void {
    if (!description?.trim()) {
      errors.push('Descrição é obrigatória');
    } else if (description.length < 20) {
      errors.push('Descrição deve ter pelo menos 20 caracteres');
    } else if (description.length > 2000) {
      errors.push('Descrição não pode ter mais de 2000 caracteres');
    }
  }

  /**
   * Valida tipo do relatório
   */
  private static validateType(type: string | undefined, errors: string[]): void {
    const validTypes = ['environmental', 'safety', 'infrastructure', 'other'];
    if (!type) {
      errors.push('Tipo do relatório é obrigatório');
    } else if (!validTypes.includes(type)) {
      errors.push('Tipo do relatório inválido');
    }
  }

  /**
   * Valida prioridade do relatório
   */
  private static validatePriority(priority: string | undefined, errors: string[]): void {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      errors.push('Prioridade inválida');
    }
  }

  /**
   * Valida localização do relatório
   */
  private static validateLocation(location: any, errors: string[]): void {
    if (!location?.coordinates) {
      errors.push('Localização é obrigatória');
      return;
    }

    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      errors.push('Coordenadas de localização inválidas');
      return;
    }

    const [lng, lat] = location.coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      errors.push('Coordenadas devem ser números válidos');
    } else if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push('Coordenadas fora dos limites válidos');
    }

    if (location.address && location.address.length > 200) {
      errors.push('Endereço não pode ter mais de 200 caracteres');
    }
  }

  /**
   * Valida mídia do relatório
   */
  private static validateMedia(mediaUrls: string[] | undefined, errors: string[]): void {
    if (mediaUrls && mediaUrls.length > 5) {
      errors.push('Máximo de 5 arquivos de mídia permitidos');
    }
  }

  /**
   * Formata dados do relatório para exibição
   * @param report Dados brutos do relatório
   * @returns Dados formatados para UI
   */
  static formatReportForDisplay(report: AnonymousReport) {
    return {
      ...report,
      createdAtFormatted: new Date(report.createdAt).toLocaleString('pt-BR'),
      statusText: this.getStatusText(report.status),
      priorityText: this.getPriorityText(report.priority),
      typeText: this.getTypeText(report.type)
    };
  }

  /**
   * Converte status para texto legível
   */
  private static getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pendente',
      'under_review': 'Em Análise',
      'investigating': 'Investigando',
      'resolved': 'Resolvido',
      'rejected': 'Rejeitado'
    };
    return statusMap[status] || status;
  }

  /**
   * Converte prioridade para texto legível
   */
  private static getPriorityText(priority: string): string {
    const priorityMap: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    return priorityMap[priority] || priority;
  }

  /**
   * Converte tipo para texto legível
   */
  private static getTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      'environmental': 'Ambiental',
      'safety': 'Segurança',
      'infrastructure': 'Infraestrutura',
      'other': 'Outro'
    };
    return typeMap[type] || type;
  }
}

export default AnonymousReportsService;
