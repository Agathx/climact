'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  X, 
  Home, 
  BookOpen, 
  Users, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  MessageCircle,
  AlertTriangle,
  FileText,
  MapPin,
  Bell,
  Shield,
  Eye,
  Newspaper,
  Phone,
  Heart,
  Trophy,
  Sun,
  Moon,
  HelpCircle,
  Star,
  Download,
  Share,
  BarChart,
  Clock,
  Badge,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge as BadgeComponent } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSession } from '@/hooks/use-session';
import { useUserNavigation } from '@/hooks/use-user-navigation';
import { handleSignOut } from '@/app/auth/actions';

interface MobileMenuProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user } = useSession();
  const { userNavItems } = useUserNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);
  const [stats, setStats] = useState({
    unreadNotifications: 0,
    activeAlerts: 0,
    completedLessons: 0,
    communityPoints: 0,
    reportsSubmitted: 0,
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    lastSync: new Date()
  });

  // Load user stats from Firebase
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) return;
      
      try {
        const { getUserStatistics } = await import('@/services/profileService');
        const userStats = await getUserStatistics(user.uid);
        
        if (userStats) {
          setStats(prev => ({
            ...prev,
            communityPoints: userStats.communityPoints || 0,
            reportsSubmitted: userStats.reportsSubmitted || 0,
            completedLessons: userStats.activitiesCompleted || 0
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas do usuário:', error);
      }
    };

    if (user) {
      loadUserStats();
    }
  }, [user]);

  // Fechar menu ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleNavigation = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await handleSignOut();
      onClose();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isCurrentPage = (href: string) => pathname === href;

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      'cidadao': 'Cidadão',
      'voluntario': 'Voluntário',
      'ong': 'ONG',
      'defesa_civil': 'Defesa Civil',
      'admin': 'Administrador'
    };
    return roleNames[role as keyof typeof roleNames] || 'Usuário';
  };

  const getRoleIcon = (role: string) => {
    const roleIcons = {
      'cidadao': User,
      'voluntario': Heart,
      'ong': Users,
      'defesa_civil': Shield,
      'admin': Settings
    };
    const IconComponent = roleIcons[role as keyof typeof roleIcons] || User;
    return IconComponent;
  };

  const getQuickActions = () => {
    const baseActions = [
      { 
        icon: Bell, 
        label: 'Notificações', 
        href: '/dashboard/notifications',
        badge: stats.unreadNotifications > 0 ? stats.unreadNotifications : null,
        color: 'bg-blue-500'
      },
      { 
        icon: MessageCircle, 
        label: 'Chat', 
        href: '/dashboard/chat',
        badge: null,
        color: 'bg-green-500'
      },
      { 
        icon: Newspaper, 
        label: 'Notícias', 
        href: '/dashboard/news',
        badge: null,
        color: 'bg-purple-500'
      }
    ];

    const roleSpecificActions = {
      'cidadao': [
        { icon: AlertTriangle, label: 'Relatar', href: '/dashboard/report', badge: null, color: 'bg-red-500' },
        { icon: BookOpen, label: 'Aprender', href: '/dashboard/education', badge: null, color: 'bg-amber-500' }
      ],
      'voluntario': [
        { icon: Heart, label: 'Ações', href: '/dashboard/volunteer', badge: null, color: 'bg-pink-500' },
        { icon: Users, label: 'Comunidade', href: '/dashboard/community', badge: null, color: 'bg-indigo-500' }
      ],
      'defesa_civil': [
        { icon: Eye, label: 'Validar', href: '/dashboard/validate', badge: stats.activeAlerts, color: 'bg-orange-500' },
        { icon: BarChart, label: 'Painel', href: '/dashboard/analytics', badge: null, color: 'bg-cyan-500' }
      ],
      'admin': [
        { icon: Settings, label: 'Admin', href: '/dashboard/admin', badge: null, color: 'bg-gray-500' },
        { icon: BarChart, label: 'Métricas', href: '/dashboard/metrics', badge: null, color: 'bg-teal-500' }
      ]
    };

    const userRole = user?.role ?? 'cidadao';
    return [...baseActions, ...(roleSpecificActions[userRole as keyof typeof roleSpecificActions] || [])];
  };

  if (!user) {
    return null;
  }

  const quickActions = getQuickActions();
  const RoleIcon = getRoleIcon(user.role ?? 'cidadao');

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            className="fixed inset-0 bg-black/60 z-50 md:hidden border-0 p-0"
            onClick={onClose}
            aria-label="Fechar menu"
            type="button"
          />

          {/* Menu Drawer */}
          <div className="fixed left-0 top-0 h-full w-[320px] bg-background border-r shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Header com gradiente */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <RoleIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{user.name ?? 'Usuário'}</p>
                      <p className="text-sm opacity-90">
                        {getRoleDisplayName(user.role ?? 'cidadao')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="shrink-0 text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Status e Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {stats.isOnline ? (
                      <Wifi className="w-4 h-4" />
                    ) : (
                      <WifiOff className="w-4 h-4" />
                    )}
                    <span>{stats.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Sync: {stats.lastSync.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats Cards */}
              <div className="p-4 bg-muted/20">
                <div className="grid grid-cols-3 gap-2">
                  <Card className="p-3 text-center">
                    <div className="text-xs text-muted-foreground">Pontos</div>
                    <div className="text-lg font-bold text-primary">{stats.communityPoints}</div>
                  </Card>
                  <Card className="p-3 text-center">
                    <div className="text-xs text-muted-foreground">Lições</div>
                    <div className="text-lg font-bold text-green-600">{stats.completedLessons}</div>
                  </Card>
                  <Card className="p-3 text-center">
                    <div className="text-xs text-muted-foreground">Relatos</div>
                    <div className="text-lg font-bold text-blue-600">{stats.reportsSubmitted}</div>
                  </Card>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Ações Rápidas
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.href}
                      variant={isCurrentPage(action.href) ? "default" : "ghost"}
                      className="h-16 flex-col gap-1 relative"
                      onClick={() => handleNavigation(action.href)}
                    >
                      <div className={`w-8 h-8 rounded-full ${action.color} flex items-center justify-center text-white`}>
                        <action.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs">{action.label}</span>
                      {action.badge && (
                        <BadgeComponent className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
                          {action.badge}
                        </BadgeComponent>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Navegação Principal */}
              <div className="flex-1 overflow-y-auto">
                {/* Dashboard */}
                <div className="p-4">
                  <Button
                    variant={isCurrentPage('/dashboard') ? "default" : "ghost"}
                    className="w-full justify-start h-12 mb-2"
                    onClick={() => handleNavigation('/dashboard')}
                  >
                    <Home className="w-5 h-5 mr-3" />
                    Dashboard
                    {isCurrentPage('/dashboard') && (
                      <BadgeComponent className="ml-auto">Atual</BadgeComponent>
                    )}
                  </Button>
                </div>

                {/* Seções Expansíveis */}
                <div className="space-y-2">
                  {/* Navegação por Papel */}
                  <div className="px-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-sm font-medium text-muted-foreground"
                      onClick={() => toggleSection('role')}
                    >
                      <span>Funcionalidades do {getRoleDisplayName(user.role ?? 'cidadao')}</span>
                      <Badge className="w-4 h-4" />
                    </Button>
                    
                    {expandedSections.includes('role') && userNavItems.length > 0 && (
                      <div className="mt-2 space-y-1 pl-4">
                        {userNavItems.slice(0, 6).map((item) => (
                          <Button
                            key={item.href}
                            variant={isCurrentPage(item.href) ? "default" : "ghost"}
                            className="w-full justify-start h-10 text-sm"
                            onClick={() => handleNavigation(item.href)}
                          >
                            <item.icon className="w-4 h-4 mr-2" />
                            {item.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator className="mx-4" />

                  {/* Recursos Gerais */}
                  <div className="px-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-sm font-medium text-muted-foreground"
                      onClick={() => toggleSection('general')}
                    >
                      <span>Recursos Gerais</span>
                      <Badge className="w-4 h-4" />
                    </Button>
                    
                    {expandedSections.includes('general') && (
                      <div className="mt-2 space-y-1 pl-4">
                        <Button
                          variant={isCurrentPage('/dashboard/education') ? "default" : "ghost"}
                          className="w-full justify-start h-10 text-sm"
                          onClick={() => handleNavigation('/dashboard/education')}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Centro Educacional
                          <BadgeComponent className="ml-auto" variant="secondary">
                            <Trophy className="w-3 h-3" />
                          </BadgeComponent>
                        </Button>
                        
                        <Button
                          variant={isCurrentPage('/dashboard/map') ? "default" : "ghost"}
                          className="w-full justify-start h-10 text-sm"
                          onClick={() => handleNavigation('/dashboard/map')}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Mapa Interativo
                        </Button>
                        
                        <Button
                          variant={isCurrentPage('/dashboard/emergency-contacts') ? "default" : "ghost"}
                          className="w-full justify-start h-10 text-sm"
                          onClick={() => handleNavigation('/dashboard/emergency-contacts')}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Contatos de Emergência
                        </Button>
                        
                        <Button
                          variant={isCurrentPage('/dashboard/offline') ? "default" : "ghost"}
                          className="w-full justify-start h-10 text-sm"
                          onClick={() => handleNavigation('/dashboard/offline')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Modo Offline
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator className="mx-4" />

                  {/* Suporte e Ajuda */}
                  <div className="px-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-sm font-medium text-muted-foreground"
                      onClick={() => toggleSection('help')}
                    >
                      <span>Suporte e Ajuda</span>
                      <Badge className="w-4 h-4" />
                    </Button>
                    
                    {expandedSections.includes('help') && (
                      <div className="mt-2 space-y-1 pl-4">
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-10 text-sm"
                          onClick={() => handleNavigation('/dashboard/support')}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Solicitar Ajuda
                        </Button>
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-10 text-sm"
                          onClick={() => handleNavigation('/feedback')}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Feedback
                        </Button>
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-10 text-sm"
                          onClick={() => handleNavigation('/about')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Sobre o ClimACT
                        </Button>

                        <Button
                          variant="ghost"
                          className="w-full justify-start h-10 text-sm"
                          onClick={() => {
                            if (typeof window !== 'undefined' && navigator.share) {
                              navigator.share({
                                title: 'ClimACT',
                                text: 'Conheça o ClimACT - Plataforma de Ação Climática',
                                url: window.location.origin
                              });
                            }
                          }}
                        >
                          <Share className="w-4 h-4 mr-2" />
                          Compartilhar App
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer com controles */}
              <div className="border-t p-4 space-y-2 bg-muted/10">
                {/* Toggle Dark Mode */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                >
                  {isDarkMode ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />}
                  {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                </Button>

                {/* Configurações */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => handleNavigation('/dashboard/profile')}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Configurações
                </Button>

                {/* Logout */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                  disabled={isSigningOut}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  {isSigningOut ? 'Saindo...' : 'Sair'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Componente para o botão de abrir o menu
interface MobileMenuButtonProps {
  readonly onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="md:hidden"
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}
