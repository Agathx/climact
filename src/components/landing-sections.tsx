import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Shield, 
  BookOpen, 
  MapPin, 
  Heart,
  Award,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import Link from 'next/link';

// Componente de Hero Section melhorado para a landing page
export function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      
      <div className="container relative mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge de destaque */}
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-2">
            🌱 Tecnologia Social para o Futuro Sustentável
          </Badge>
          
          {/* Título principal */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-headline">
            Juntos por um{' '}
            <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              Futuro Sustentável
            </span>
          </h1>
          
          {/* Subtítulo */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Uma plataforma colaborativa que conecta comunidades, cientistas cidadãos e organizações 
            na prevenção de desastres ambientais e construção da resiliência climática.
          </p>
          
          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">
                Começar Agora
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="/dashboard/map">
                Explorar o Mapa
                <MapPin className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
            <StatsCard
              icon={<Users className="h-8 w-8 text-primary" />}
              number="10K+"
              label="Cidadãos Engajados"
            />
            <StatsCard
              icon={<Shield className="h-8 w-8 text-primary" />}
              number="500+"
              label="Relatórios Validados"
            />
            <StatsCard
              icon={<Award className="h-8 w-8 text-primary" />}
              number="50+"
              label="Certificações Emitidas"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Componente para cards de estatísticas
function StatsCard({ icon, number, label }: { icon: React.ReactNode; number: string; label: string }) {
  return (
    <Card className="text-center border-none shadow-lg bg-white/50 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex justify-center mb-3">{icon}</div>
        <div className="text-3xl font-bold text-foreground mb-1">{number}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

// Seção de funcionalidades principais
export function FeaturesSection() {
  const features = [
    {
      icon: <Shield className="h-12 w-12 text-primary" />,
      title: 'Monitoramento em Tempo Real',
      description: 'Acesse mapas interativos com alertas da Defesa Civil, dados climáticos oficiais e relatos validados pela comunidade.',
      benefits: ['Alertas personalizados', 'Dados oficiais integrados', 'Validação comunitária']
    },
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: 'Ciência Cidadã',
      description: 'Fortaleça sua comunidade reportando incidentes, validando ocorrências e participando ativamente da prevenção.',
      benefits: ['Relatórios georreferenciados', 'Sistema de reputação', 'Rede de apoio local']
    },
    {
      icon: <BookOpen className="h-12 w-12 text-primary" />,
      title: 'Educação Gamificada',
      description: 'Aprenda sobre sustentabilidade e prevenção através de trilhas interativas, quizzes e conquiste certificados.',
      benefits: ['Trilhas personalizadas', 'Certificações válidas', 'Ranking de engajamento']
    }
  ];

  return (
    <section className="py-20 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-headline">
            Como o ClimACT Funciona
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Três pilares fundamentais que tornam nossa plataforma única na construção da resiliência climática.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Card de funcionalidade
function FeatureCard({ 
  icon, 
  title, 
  description, 
  benefits
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  benefits: string[];
}) {
  const getFeatureIndex = (title: string) => {
    const titles = ['Monitoramento em Tempo Real', 'Ciência Cidadã', 'Educação Gamificada'];
    return titles.indexOf(title) + 1;
  };

  return (
    <Card className="relative group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
          <Badge variant="outline" className="text-xs">
            0{getFeatureIndex(title)}
          </Badge>
        </div>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">{description}</p>
        <ul className="space-y-2">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-primary mr-2 shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Componente de status para alertas
export function AlertStatus({ 
  type, 
  message 
}: { 
  type: 'info' | 'warning' | 'danger'; 
  message: string;
}) {
  const config = {
    info: {
      icon: <Info className="h-4 w-4" />,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      iconColor: 'text-blue-500'
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      iconColor: 'text-yellow-500'
    },
    danger: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-red-50 text-red-800 border-red-200',
      iconColor: 'text-red-500'
    }
  };

  const { icon, color, iconColor } = config[type];

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${color}`}>
      <span className={iconColor}>{icon}</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// Componente de progresso do usuário
export function UserProgress({ 
  level, 
  currentXP, 
  nextLevelXP, 
  completedModules 
}: {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  completedModules: number;
}) {
  const progress = (currentXP / nextLevelXP) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Seu Progresso</span>
          <Badge variant="secondary">Nível {level}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>XP Atual: {currentXP}</span>
            <span>Próximo: {nextLevelXP}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{completedModules}</div>
            <div className="text-xs text-muted-foreground">Módulos Completos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{Math.floor(progress)}%</div>
            <div className="text-xs text-muted-foreground">Progresso do Nível</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de call-to-action final
export function CTASection() {
  return (
    <section className="py-20 lg:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">
            Pronto para fazer a diferença?
          </h2>
          <p className="text-xl opacity-90">
            Junte-se a milhares de pessoas que estão construindo um futuro mais resiliente e sustentável.
            Sua comunidade precisa de você.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-6">
              <Link href="/signup">
                Criar Conta Gratuita
                <Heart className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link href="/dashboard/map">
                Ver Mapa de Alertas
                <MapPin className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
