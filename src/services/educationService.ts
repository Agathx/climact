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
export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'article' | 'video' | 'infographic' | 'course' | 'quiz';
  category: 'climate_change' | 'sustainability' | 'emergency_response' | 'prevention' | 'awareness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  mediaUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // em minutos
  readingTime?: number; // em minutos
  published: boolean;
  featured: boolean;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  contentId: string;
  completed: boolean;
  progress: number; // 0-100
  timeSpent: number; // em minutos
  lastAccessed: string;
  completedAt?: string;
  score?: number; // para quizzes
}

export interface ClimateAlert {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'emergency' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    coordinates: [number, number]; // [longitude, latitude]
    radius: number; // em km
    address?: string;
  };
  startDate: string;
  endDate?: string;
  active: boolean;
  targetAudience: string[];
  actionRequired?: string;
  relatedContentIds?: string[];
  createdAt: string;
  createdBy: string;
}

export interface CreateContentData {
  title: string;
  description: string;
  content: string;
  type: EducationalContent['type'];
  category: EducationalContent['category'];
  difficulty: EducationalContent['difficulty'];
  tags: string[];
  mediaUrl?: string;
  duration?: number;
  readingTime?: number;
  featured?: boolean;
}

export interface CreateAlertData {
  title: string;
  message: string;
  type: ClimateAlert['type'];
  severity: ClimateAlert['severity'];
  location?: ClimateAlert['location'];
  startDate: string;
  endDate?: string;
  targetAudience: string[];
  actionRequired?: string;
  relatedContentIds?: string[];
}

// Cloud Functions
const getEducationalContentFn = httpsCallable<{ 
  contentId?: string;
  category?: string;
  difficulty?: string;
  featured?: boolean;
  limit?: number;
}, { content: EducationalContent[] }>(functions, 'getEducationalContent');

const createEducationalContentFn = httpsCallable<CreateContentData, { contentId: string }>(functions, 'createEducationalContent');
const updateContentProgressFn = httpsCallable<{ contentId: string; progress: number; timeSpent: number }, void>(functions, 'updateContentProgress');
const getUserProgressFn = httpsCallable<{ userId?: string }, { progress: UserProgress[] }>(functions, 'getUserProgress');

const createClimateAlertFn = httpsCallable<CreateAlertData, { alertId: string }>(functions, 'createClimateAlert');
const getClimateAlertsFn = httpsCallable<{ 
  location?: [number, number];
  active?: boolean;
  severity?: string;
}, { alerts: ClimateAlert[] }>(functions, 'getClimateAlerts');

/**
 * Education Service
 * Implementa RN03: Sistema de Educação e RN11: Alertas Climáticos
 */
export class EducationService {
  // Real-time listeners storage
  private static listeners: Map<string, Unsubscribe> = new Map();

  /**
   * Busca conteúdo educacional com filtros
   * @param filters Filtros de busca
   * @returns Promise com lista de conteúdos
   */
  static async getContent(filters: {
    contentId?: string;
    category?: string;
    difficulty?: string;
    featured?: boolean;
    limit?: number;
  } = {}): Promise<EducationalContent[]> {
    try {
      // Em desenvolvimento, usar dados fallback se Functions não estiver disponível
      if (process.env.NODE_ENV === 'development') {
        console.info('Modo desenvolvimento: usando dados educacionais fallback');
        return this.getFallbackContent();
      }

      const result = await getEducationalContentFn(filters);
      
      if (!result.data?.content) {
        console.warn('Education API retornou dados vazios, usando dados fallback');
        return this.getFallbackContent();
      }

      return result.data.content;
    } catch (error: any) {
      console.warn('Erro ao buscar conteúdo educacional, usando dados fallback:', error);
      return this.getFallbackContent();
    }
  }

  /**
   * Conteúdo educacional de fallback
   */
  private static getFallbackContent(): EducationalContent[] {
    return [
      {
        id: 'edu-1',
        title: 'Primeiros Socorros em Enchentes',
        description: 'Aprenda como agir em situações de emergência durante alagamentos.',
        content: 'Conteúdo sobre primeiros socorros em enchentes...',
        type: 'article',
        category: 'emergency_response',
        difficulty: 'beginner',
        tags: ['enchente', 'primeiros-socorros', 'emergência'],
        readingTime: 15,
        published: true,
        featured: true,
        views: 156,
        likes: 23,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: 'system',
        authorName: 'ClimACT Team'
      },
      {
        id: 'edu-2',
        title: 'Como Identificar Riscos Climáticos',
        description: 'Guia prático para reconhecer sinais de alertas meteorológicos.',
        content: 'Conteúdo sobre identificação de riscos...',
        type: 'article',
        category: 'prevention',
        difficulty: 'beginner',
        tags: ['prevenção', 'alertas', 'identificação'],
        readingTime: 10,
        published: true,
        featured: true,
        views: 89,
        likes: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: 'system',
        authorName: 'ClimACT Team'
      }
    ];
  }

  /**
   * Busca conteúdo em destaque
   * @returns Promise com conteúdos em destaque
   */
  static async getFeaturedContent(): Promise<EducationalContent[]> {
    return this.getContent({ featured: true, limit: 10 });
  }

  /**
   * Busca conteúdo por categoria
   * @param category Categoria do conteúdo
   * @param limit Limite de resultados
   * @returns Promise com conteúdos da categoria
   */
  static async getContentByCategory(
    category: EducationalContent['category'], 
    limit: number = 20
  ): Promise<EducationalContent[]> {
    return this.getContent({ category, limit });
  }

  /**
   * Cria novo conteúdo educacional (apenas educadores)
   * @param contentData Dados do conteúdo
   * @returns Promise com ID do conteúdo criado
   */
  static async createContent(contentData: CreateContentData): Promise<string> {
    try {
      // Validação básica
      const validation = this.validateContentData(contentData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const result = await createEducationalContentFn(contentData);
      
      if (!result.data?.contentId) {
        throw new Error('Erro interno: ID do conteúdo não retornado');
      }

      return result.data.contentId;
    } catch (error: any) {
      console.error('Erro ao criar conteúdo educacional:', error);
      throw new Error(error.message || 'Erro ao criar conteúdo educacional');
    }
  }

  /**
   * Atualiza progresso do usuário em um conteúdo
   * @param contentId ID do conteúdo
   * @param progress Progresso (0-100)
   * @param timeSpent Tempo gasto em minutos
   */
  static async updateProgress(
    contentId: string, 
    progress: number, 
    timeSpent: number
  ): Promise<void> {
    try {
      if (!contentId?.trim()) {
        throw new Error('ID do conteúdo é obrigatório');
      }

      if (progress < 0 || progress > 100) {
        throw new Error('Progresso deve estar entre 0 e 100');
      }

      if (timeSpent < 0) {
        throw new Error('Tempo gasto não pode ser negativo');
      }

      await updateContentProgressFn({ contentId, progress, timeSpent });
    } catch (error: any) {
      console.error('Erro ao atualizar progresso:', error);
      throw new Error(error.message || 'Erro ao atualizar progresso');
    }
  }

  /**
   * Busca progresso do usuário
   * @param userId ID do usuário (opcional, usa o usuário atual se não fornecido)
   * @returns Promise com progresso do usuário
   */
  static async getUserProgress(userId?: string): Promise<UserProgress[]> {
    try {
      const result = await getUserProgressFn({ userId });
      
      if (!result.data?.progress) {
        return [];
      }

      return result.data.progress;
    } catch (error: any) {
      console.error('Erro ao buscar progresso do usuário:', error);
      throw new Error(error.message || 'Erro ao buscar progresso do usuário');
    }
  }

  /**
   * Cria novo alerta climático (apenas autoridades)
   * @param alertData Dados do alerta
   * @returns Promise com ID do alerta criado
   */
  static async createAlert(alertData: CreateAlertData): Promise<string> {
    try {
      // Validação básica
      const validation = this.validateAlertData(alertData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const result = await createClimateAlertFn(alertData);
      
      if (!result.data?.alertId) {
        throw new Error('Erro interno: ID do alerta não retornado');
      }

      return result.data.alertId;
    } catch (error: any) {
      console.error('Erro ao criar alerta climático:', error);
      throw new Error(error.message || 'Erro ao criar alerta climático');
    }
  }

  /**
   * Busca alertas climáticos
   * @param filters Filtros de busca
   * @returns Promise com lista de alertas
   */
  static async getAlerts(filters: {
    location?: [number, number];
    active?: boolean;
    severity?: string;
  } = {}): Promise<ClimateAlert[]> {
    try {
      const result = await getClimateAlertsFn(filters);
      
      if (!result.data?.alerts) {
        return [];
      }

      return result.data.alerts;
    } catch (error: any) {
      console.error('Erro ao buscar alertas climáticos:', error);
      throw new Error(error.message || 'Erro ao buscar alertas climáticos');
    }
  }

  /**
   * Busca alertas ativos para uma localização
   * @param coordinates Coordenadas [longitude, latitude]
   * @returns Promise com alertas ativos na região
   */
  static async getActiveAlertsForLocation(coordinates: [number, number]): Promise<ClimateAlert[]> {
    return this.getAlerts({ location: coordinates, active: true });
  }

  /**
   * Configura listener em tempo real para alertas climáticos
   * @param callback Função de callback para mudanças
   * @param filters Filtros opcionais
   * @returns Função para cancelar o listener
   */
  static listenToAlerts(
    callback: (alerts: ClimateAlert[]) => void,
    filters: { active?: boolean; severity?: string } = {}
  ): Unsubscribe {
    try {
      let alertsQuery = query(
        collection(db, 'climateAlerts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      // Aplicar filtros
      if (filters.active !== undefined) {
        alertsQuery = query(alertsQuery, where('active', '==', filters.active));
      }

      if (filters.severity) {
        alertsQuery = query(alertsQuery, where('severity', '==', filters.severity));
      }

      const unsubscribe = onSnapshot(alertsQuery, 
        (snapshot) => {
          const alerts: ClimateAlert[] = [];
          snapshot.forEach((doc) => {
            alerts.push({ id: doc.id, ...doc.data() } as ClimateAlert);
          });
          callback(alerts);
        },
        (error) => {
          console.error('Erro no listener de alertas:', error);
        }
      );

      // Armazenar listener para limpeza posterior
      const listenerId = `alerts_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
      };
    } catch (error: any) {
      console.error('Erro ao configurar listener de alertas:', error);
      throw new Error('Erro ao configurar atualizações em tempo real');
    }
  }

  /**
   * Configura listener para progresso do usuário
   * @param userId ID do usuário
   * @param callback Função de callback
   * @returns Função para cancelar o listener
   */
  static listenToUserProgress(
    userId: string,
    callback: (progress: UserProgress[]) => void
  ): Unsubscribe {
    try {
      const progressQuery = query(
        collection(db, 'userProgress'),
        where('userId', '==', userId),
        orderBy('lastAccessed', 'desc')
      );

      const unsubscribe = onSnapshot(progressQuery,
        (snapshot) => {
          const progress: UserProgress[] = [];
          snapshot.forEach((doc) => {
            progress.push({ id: doc.id, ...doc.data() } as UserProgress);
          });
          callback(progress);
        },
        (error) => {
          console.error('Erro no listener de progresso:', error);
        }
      );

      const listenerId = `progress_${userId}_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);

      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
      };
    } catch (error: any) {
      console.error('Erro ao configurar listener de progresso:', error);
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
   * Valida dados de conteúdo educacional
   */
  static validateContentData(data: Partial<CreateContentData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.title?.trim()) {
      errors.push('Título é obrigatório');
    } else if (data.title.length < 5 || data.title.length > 100) {
      errors.push('Título deve ter entre 5 e 100 caracteres');
    }

    if (!data.description?.trim()) {
      errors.push('Descrição é obrigatória');
    } else if (data.description.length < 20 || data.description.length > 500) {
      errors.push('Descrição deve ter entre 20 e 500 caracteres');
    }

    if (!data.content?.trim()) {
      errors.push('Conteúdo é obrigatório');
    } else if (data.content.length < 100) {
      errors.push('Conteúdo deve ter pelo menos 100 caracteres');
    }

    const validTypes = ['article', 'video', 'infographic', 'course', 'quiz'];
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push('Tipo de conteúdo inválido');
    }

    const validCategories = ['climate_change', 'sustainability', 'emergency_response', 'prevention', 'awareness'];
    if (!data.category || !validCategories.includes(data.category)) {
      errors.push('Categoria inválida');
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!data.difficulty || !validDifficulties.includes(data.difficulty)) {
      errors.push('Nível de dificuldade inválido');
    }

    if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
      errors.push('Pelo menos uma tag é obrigatória');
    } else if (data.tags.length > 10) {
      errors.push('Máximo de 10 tags permitidas');
    }

    if (data.duration !== undefined && (data.duration < 1 || data.duration > 1440)) {
      errors.push('Duração deve estar entre 1 e 1440 minutos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida dados de alerta climático
   */
  static validateAlertData(data: Partial<CreateAlertData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validação de título e mensagem
    this.validateAlertTitleAndMessage(data, errors);

    // Validação de tipo e severidade
    this.validateAlertTypeAndSeverity(data, errors);

    // Validação de datas
    this.validateAlertDates(data, errors);

    // Validação de público-alvo
    this.validateAlertTargetAudience(data, errors);

    // Validação de localização
    this.validateAlertLocation(data, errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida título e mensagem do alerta
   */
  private static validateAlertTitleAndMessage(data: Partial<CreateAlertData>, errors: string[]): void {
    if (!data.title?.trim()) {
      errors.push('Título é obrigatório');
    } else if (data.title.length < 10 || data.title.length > 100) {
      errors.push('Título deve ter entre 10 e 100 caracteres');
    }

    if (!data.message?.trim()) {
      errors.push('Mensagem é obrigatória');
    } else if (data.message.length < 20 || data.message.length > 1000) {
      errors.push('Mensagem deve ter entre 20 e 1000 caracteres');
    }
  }

  /**
   * Valida tipo e severidade do alerta
   */
  private static validateAlertTypeAndSeverity(data: Partial<CreateAlertData>, errors: string[]): void {
    const validTypes = ['warning', 'emergency', 'info', 'success'];
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push('Tipo de alerta inválido');
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!data.severity || !validSeverities.includes(data.severity)) {
      errors.push('Severidade inválida');
    }
  }

  /**
   * Valida datas do alerta
   */
  private static validateAlertDates(data: Partial<CreateAlertData>, errors: string[]): void {
    if (!data.startDate) {
      errors.push('Data de início é obrigatória');
    } else if (new Date(data.startDate) < new Date()) {
      errors.push('Data de início não pode ser no passado');
    }

    if (data.endDate && data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
      errors.push('Data de fim deve ser posterior à data de início');
    }
  }

  /**
   * Valida público-alvo do alerta
   */
  private static validateAlertTargetAudience(data: Partial<CreateAlertData>, errors: string[]): void {
    if (!data.targetAudience || !Array.isArray(data.targetAudience) || data.targetAudience.length === 0) {
      errors.push('Público-alvo é obrigatório');
    }
  }

  /**
   * Valida localização do alerta
   */
  private static validateAlertLocation(data: Partial<CreateAlertData>, errors: string[]): void {
    if (!data.location) return;

    if (!data.location.coordinates || data.location.coordinates.length !== 2) {
      errors.push('Coordenadas de localização inválidas');
      return;
    }

    const [lng, lat] = data.location.coordinates;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push('Coordenadas fora dos limites válidos');
    }

    if (data.location.radius !== undefined && (data.location.radius < 0.1 || data.location.radius > 1000)) {
      errors.push('Raio deve estar entre 0.1 e 1000 km');
    }
  }

  /**
   * Formata conteúdo para exibição
   */
  static formatContentForDisplay(content: EducationalContent) {
    return {
      ...content,
      createdAtFormatted: new Date(content.createdAt).toLocaleDateString('pt-BR'),
      categoryText: this.getCategoryText(content.category),
      difficultyText: this.getDifficultyText(content.difficulty),
      typeText: this.getTypeText(content.type),
      durationText: content.duration ? `${content.duration} min` : null,
      readingTimeText: content.readingTime ? `${content.readingTime} min de leitura` : null
    };
  }

  /**
   * Formata alerta para exibição
   */
  static formatAlertForDisplay(alert: ClimateAlert) {
    return {
      ...alert,
      createdAtFormatted: new Date(alert.createdAt).toLocaleString('pt-BR'),
      startDateFormatted: new Date(alert.startDate).toLocaleString('pt-BR'),
      endDateFormatted: alert.endDate ? new Date(alert.endDate).toLocaleString('pt-BR') : null,
      typeText: this.getAlertTypeText(alert.type),
      severityText: this.getSeverityText(alert.severity)
    };
  }

  // Métodos de formatação de texto
  private static getCategoryText(category: string): string {
    const categoryMap: Record<string, string> = {
      'climate_change': 'Mudanças Climáticas',
      'sustainability': 'Sustentabilidade',
      'emergency_response': 'Resposta a Emergências',
      'prevention': 'Prevenção',
      'awareness': 'Conscientização'
    };
    return categoryMap[category] || category;
  }

  private static getDifficultyText(difficulty: string): string {
    const difficultyMap: Record<string, string> = {
      'beginner': 'Iniciante',
      'intermediate': 'Intermediário',
      'advanced': 'Avançado'
    };
    return difficultyMap[difficulty] || difficulty;
  }

  private static getTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      'article': 'Artigo',
      'video': 'Vídeo',
      'infographic': 'Infográfico',
      'course': 'Curso',
      'quiz': 'Quiz'
    };
    return typeMap[type] || type;
  }

  private static getAlertTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      'warning': 'Aviso',
      'emergency': 'Emergência',
      'info': 'Informação',
      'success': 'Sucesso'
    };
    return typeMap[type] || type;
  }

  private static getSeverityText(severity: string): string {
    const severityMap: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    return severityMap[severity] || severity;
  }
}

export default EducationService;
