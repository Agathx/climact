'use client';

import { useState, useEffect } from 'react';
import { 
  Star, 
  Trophy, 
  Target, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  Lock,
  Award,
  Zap,
  BookOpen,
  Users,
  Shield,
  AlertTriangle,
  Mountain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSession } from '@/hooks/use-session';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  icon: any;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // em minutos
  points: number;
  badge?: {
    name: string;
    icon: any;
    color: string;
  };
  prerequisites?: string[];
  completed: boolean;
  locked: boolean;
  progress: number; // 0-100
  topics: {
    id: string;
    title: string;
    type: 'video' | 'text' | 'quiz' | 'interactive';
    completed: boolean;
  }[];
}

interface LearningTrail {
  id: string;
  title: string;
  description: string;
  category: 'prevention' | 'emergency_response' | 'climate_awareness' | 'community_action';
  icon: any;
  color: string;
  totalModules: number;
  completedModules: number;
  totalPoints: number;
  earnedPoints: number;
  modules: LearningModule[];
}

const learningTrails: LearningTrail[] = [
  {
    id: 'prevention',
    title: 'Prevenção de Desastres',
    description: 'Aprenda a identificar riscos e prevenir acidentes climáticos',
    category: 'prevention',
    icon: Shield,
    color: 'from-green-500 to-emerald-600',
    totalModules: 4,
    completedModules: 0,
    totalPoints: 400,
    earnedPoints: 0,
    modules: [
      {
        id: 'landslide-signs',
        title: 'Identificando Sinais de Deslizamento',
        description: 'Como João, aprenda a reconhecer os primeiros sinais de um deslizamento de terra',
        icon: Mountain,
        difficulty: 'beginner',
        estimatedTime: 15,
        points: 100,
        badge: {
          name: 'Observador Atento',
          icon: Target,
          color: 'text-green-600'
        },
        completed: false,
        locked: false,
        progress: 0,
        topics: [
          { id: '1', title: 'Sinais visuais no terreno', type: 'video', completed: false },
          { id: '2', title: 'Mudanças na vegetação', type: 'text', completed: false },
          { id: '3', title: 'Quiz: Identifique os riscos', type: 'quiz', completed: false },
          { id: '4', title: 'Simulação interativa', type: 'interactive', completed: false }
        ]
      },
      {
        id: 'flood-prevention',
        title: 'Prevenção de Enchentes',
        description: 'Aprenda a identificar riscos de alagamento em sua região',
        icon: AlertTriangle,
        difficulty: 'beginner',
        estimatedTime: 12,
        points: 100,
        completed: false,
        locked: true,
        progress: 0,
        topics: [
          { id: '1', title: 'Sinais de risco hídrico', type: 'video', completed: false },
          { id: '2', title: 'Medidas preventivas', type: 'text', completed: false },
          { id: '3', title: 'Quiz: Situações de risco', type: 'quiz', completed: false }
        ]
      }
    ]
  },
  {
    id: 'emergency_response',
    title: 'Resposta a Emergências',
    description: 'Protocolos e ações em situações de risco',
    category: 'emergency_response',
    icon: AlertTriangle,
    color: 'from-red-500 to-orange-600',
    totalModules: 3,
    completedModules: 0,
    totalPoints: 300,
    earnedPoints: 0,
    modules: [
      {
        id: 'emergency-report',
        title: 'Como Fazer um Relato Eficaz',
        description: 'Aprenda a reportar emergências de forma clara e precisa',
        icon: BookOpen,
        difficulty: 'beginner',
        estimatedTime: 10,
        points: 100,
        completed: false,
        locked: false,
        progress: 0,
        topics: [
          { id: '1', title: 'Informações essenciais', type: 'video', completed: false },
          { id: '2', title: 'Usando fotos e localização', type: 'text', completed: false },
          { id: '3', title: 'Prática: Simulação de relato', type: 'interactive', completed: false }
        ]
      }
    ]
  },
  {
    id: 'community_action',
    title: 'Ação Comunitária',
    description: 'Mobilize sua comunidade e construa redes de apoio',
    category: 'community_action',
    icon: Users,
    color: 'from-blue-500 to-purple-600',
    totalModules: 2,
    completedModules: 0,
    totalPoints: 200,
    earnedPoints: 0,
    modules: [
      {
        id: 'community-coordination',
        title: 'Coordenação Comunitária',
        description: 'Como organizar e coordenar ajuda em situações de emergência',
        icon: Users,
        difficulty: 'intermediate',
        estimatedTime: 20,
        points: 150,
        completed: false,
        locked: false,
        progress: 0,
        topics: [
          { id: '1', title: 'Formando redes de apoio', type: 'video', completed: false },
          { id: '2', title: 'Comunicação eficaz', type: 'text', completed: false },
          { id: '3', title: 'Cenário prático', type: 'interactive', completed: false }
        ]
      }
    ]
  }
];

export function GamifiedLearningTrails() {
  const { user } = useSession();
  const [selectedTrail, setSelectedTrail] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    completedModules: 0,
    currentLevel: 1,
    badges: [] as string[]
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const TrailCard = ({ trail }: { trail: LearningTrail }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardHeader className="pb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${trail.color} flex items-center justify-center mb-3`}>
          <trail.icon className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-lg group-hover:text-primary transition-colors">
          {trail.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {trail.description}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={(trail.completedModules / trail.totalModules) * 100} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {trail.completedModules}/{trail.totalModules} módulos
            </span>
            <span className="font-medium text-primary">
              {trail.earnedPoints}/{trail.totalPoints} pts
            </span>
          </div>

          <Button 
            onClick={() => setSelectedTrail(trail.id)}
            className="w-full"
            variant={trail.completedModules > 0 ? "default" : "outline"}
          >
            {trail.completedModules > 0 ? "Continuar" : "Começar"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ModuleCard = ({ module, trailId }: { module: LearningModule; trailId: string }) => (
    <Card className={`transition-all duration-300 ${
      module.locked ? 'opacity-50' : 'hover:shadow-md cursor-pointer'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            module.completed 
              ? 'bg-green-100 text-green-600' 
              : module.locked 
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-100 text-blue-600'
          }`}>
            {module.completed ? (
              <CheckCircle className="w-6 h-6" />
            ) : module.locked ? (
              <Lock className="w-6 h-6" />
            ) : (
              <module.icon className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{module.description}</p>
                
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getDifficultyColor(module.difficulty)}>
                    {module.difficulty === 'beginner' ? 'Iniciante' : 
                     module.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                  </Badge>
                  <Badge variant="outline">
                    {module.estimatedTime} min
                  </Badge>
                  <Badge variant="outline">
                    <Star className="w-3 h-3 mr-1" />
                    {module.points} pts
                  </Badge>
                </div>

                {module.progress > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso</span>
                      <span>{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>
                )}
              </div>

              <Button
                disabled={module.locked}
                variant={module.completed ? "outline" : "default"}
                className="ml-4"
              >
                {module.completed ? (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    Concluído
                  </>
                ) : module.locked ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Bloqueado
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {module.progress > 0 ? "Continuar" : "Iniciar"}
                  </>
                )}
              </Button>
            </div>

            {module.badge && !module.completed && (
              <div className="mt-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Conquiste: {module.badge.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (selectedTrail) {
    const trail = learningTrails.find(t => t.id === selectedTrail);
    if (!trail) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedTrail(null)}
          >
            ← Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{trail.title}</h1>
            <p className="text-muted-foreground">{trail.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {trail.modules.map((module) => (
              <ModuleCard key={module.id} module={module} trailId={trail.id} />
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Seu Progresso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {trail.earnedPoints}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    de {trail.totalPoints} pontos
                  </div>
                </div>

                <Progress value={(trail.earnedPoints / trail.totalPoints) * 100} />

                <div className="text-center text-sm text-muted-foreground">
                  {trail.completedModules} de {trail.totalModules} módulos concluídos
                </div>
              </CardContent>
            </Card>

            {/* Próximas conquistas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  Próximas Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trail.modules
                    .filter(m => !m.completed && !m.locked && m.badge)
                    .slice(0, 2)
                    .map((module) => {
                      const BadgeIcon = module.badge?.icon;
                      if (!BadgeIcon) return null;
                      
                      return (
                        <div key={module.id} className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                          <BadgeIcon className="w-5 h-5 text-yellow-600" />
                          <div className="text-sm">
                            <div className="font-medium">{module.badge?.name}</div>
                            <div className="text-muted-foreground">
                              Complete "{module.title}"
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Trilhas de Aprendizagem</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Desenvolva suas habilidades através de trilhas gamificadas. Ganhe pontos, conquiste medalhas e torne-se um cidadão mais preparado!
        </p>
      </div>

      {/* Stats do usuário */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{userStats.totalPoints}</div>
            <div className="text-sm text-muted-foreground">Pontos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{userStats.completedModules}</div>
            <div className="text-sm text-muted-foreground">Módulos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">Nível {userStats.currentLevel}</div>
            <div className="text-sm text-muted-foreground">Atual</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{userStats.badges.length}</div>
            <div className="text-sm text-muted-foreground">Medalhas</div>
          </CardContent>
        </Card>
      </div>

      {/* Trilhas disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {learningTrails.map((trail) => (
          <TrailCard key={trail.id} trail={trail} />
        ))}
      </div>
    </div>
  );
}
