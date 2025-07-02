// Sistema de educação gamificada

export type ModuleStatus = 'bloqueado' | 'disponivel' | 'em_progresso' | 'completo';
export type QuestionType = 'multipla_escolha' | 'verdadeiro_falso' | 'resposta_curta';
export type BadgeType = 'iniciante' | 'intermediario' | 'avancado' | 'especialista' | 'evento';

export interface EducationModule {
  id: string;
  title: string;
  description: string;
  category: string; // 'clima', 'desastres', 'sustentabilidade', etc.
  difficulty: 'basico' | 'intermediario' | 'avancado';
  estimatedTime: number; // em minutos
  points: number; // pontos ganhos ao completar
  prerequisites: string[]; // IDs de módulos que devem ser completados antes
  content: {
    sections: ModuleSection[];
  };
  quiz: Quiz;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface ModuleSection {
  id: string;
  title: string;
  type: 'text' | 'video' | 'image' | 'interactive';
  content: string | VideoContent | ImageContent | InteractiveContent;
  order: number;
}

export interface VideoContent {
  url: string;
  duration: number; // em segundos
  thumbnail?: string;
}

export interface ImageContent {
  url: string;
  caption?: string;
  alt: string;
}

export interface InteractiveContent {
  type: 'simulation' | 'game' | 'calculator';
  config: Record<string, any>; // Configuração específica da atividade
}

export interface Quiz {
  id: string;
  moduleId: string;
  questions: Question[];
  passingScore: number; // Pontuação mínima para passar (0-100)
  timeLimit?: number; // em minutos
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // Para múltipla escolha
  correctAnswer: string | number | boolean;
  explanation: string; // Explicação da resposta correta
  points: number;
}

export interface UserProgress {
  userId: string;
  moduleId: string;
  status: ModuleStatus;
  currentSection: number;
  progress: number; // 0-100
  quizAttempts: QuizAttempt[];
  timeSpent: number; // em minutos
  startedAt?: any;
  completedAt?: any;
  lastAccessedAt: any;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: {
    questionId: string;
    answer: string | number | boolean;
    isCorrect: boolean;
    timeSpent: number; // em segundos
  }[];
  score: number; // 0-100
  passed: boolean;
  startedAt: any;
  completedAt: any;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  imageUrl: string;
  requirements: {
    type: 'modules_completed' | 'points_earned' | 'quiz_score' | 'consecutive_days' | 'reports_validated';
    value: number;
    specifics?: string[]; // IDs específicos de módulos, categorias, etc.
  };
  points: number; // Pontos extras ganhos ao obter a medalha
  isActive: boolean;
  createdAt: any;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: any;
  progress?: number; // Para badges em progresso
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  points: number;
  level: number;
  badges: number; // Quantidade de badges
  rank: number;
  weeklyPoints?: number; // Pontos da semana
  monthlyPoints?: number; // Pontos do mês
}

// Sistema de níveis
export interface UserLevel {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[]; // Benefícios desbloqueados neste nível
  badgeImageUrl?: string;
}

// Conquistas especiais
export interface Achievement {
  id: string;
  userId: string;
  type: 'streak' | 'milestone' | 'collaboration' | 'validation' | 'education';
  title: string;
  description: string;
  points: number;
  unlockedAt: any;
  relatedId?: string; // ID relacionado (módulo, relatório, etc.)
}
