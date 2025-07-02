'use client';

import { useMemo } from 'react';
import { useSession } from '@/hooks/use-session';
import {
  BookOpen,
  FilePlus2,
  MapPin,
  Newspaper,
  User,
  CheckCircle,
  Bell,
  MessageCircle,
  Shield,
  Heart,
  HelpCircle,
  Settings,
  DollarSign,
  UserCheck,
  Home,
  AlertTriangle,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: any;
  category: string;
  roles: ('cidadao' | 'voluntario' | 'ong' | 'defesa_civil' | 'admin')[];
  description?: string;
}

const allNavItems: NavItem[] = [
  // Principal - Todos os usuários
  {
    href: "/dashboard",
    label: "Dashboard Principal",
    icon: Home,
    category: "Principal",
    roles: ['cidadao', 'voluntario', 'ong', 'defesa_civil', 'admin'],
    description: "Visão geral do sistema"
  },
  {
    href: "/dashboard/map",
    label: "Mapa Interativo",
    icon: MapPin,
    category: "Principal",
    roles: ['cidadao', 'voluntario', 'ong', 'defesa_civil', 'admin'],
    description: "Visualize incidentes e alertas no mapa"
  },

  // Relatos e Comunicação
  {
    href: "/dashboard/report",
    label: "Reportar Incidente",
    icon: FilePlus2,
    category: "Relatos",
    roles: ['cidadao', 'voluntario'],
    description: "Relate situações de risco em sua área"
  },
  {
    href: "/dashboard/alerts",
    label: "Alertas e Avisos",
    icon: Bell,
    category: "Comunicação",
    roles: ['cidadao', 'voluntario', 'ong', 'defesa_civil', 'admin'],
    description: "Receba alertas oficiais da Defesa Civil"
  },
  {
    href: "/dashboard/chat",
    label: "Chat de Emergência",
    icon: MessageCircle,
    category: "Comunicação",
    roles: ['cidadao', 'voluntario', 'ong'],
    description: "Coordene ajuda com a comunidade"
  },

  // Educação e Preparação
  {
    href: "/dashboard/education",
    label: "Trilhas Educativas",
    icon: BookOpen,
    category: "Educação",
    roles: ['cidadao', 'voluntario', 'ong'],
    description: "Como João, aprenda sobre prevenção de desastres"
  },

  // Gestão e Validação
  {
    href: "/dashboard/validate",
    label: "Validar Relatórios",
    icon: CheckCircle,
    category: "Gestão",
    roles: ['defesa_civil', 'admin'],
    description: "Analise e valide relatórios recebidos"
  },
  {
    href: "/dashboard/defesa-civil",
    label: "Painel Defesa Civil",
    icon: Shield,
    category: "Gestão",
    roles: ['defesa_civil', 'admin'],
    description: "Emita alertas oficiais e coordene resposta"
  },

  // Ação Comunitária
  {
    href: "/dashboard/support",
    label: "Solicitar Ajuda",
    icon: AlertTriangle,
    category: "Ação Comunitária",
    roles: ['cidadao', 'voluntario'],
    description: "Solicite ajuda emergencial: abrigo, comida, resgate"
  },
  {
    href: "/dashboard/ong",
    label: "Rede de ONGs",
    icon: Heart,
    category: "Ação Comunitária",
    roles: ['cidadao', 'voluntario', 'ong', 'admin'],
    description: "Conecte-se com organizações de apoio"
  },
  {
    href: "/dashboard/volunteer",
    label: "Voluntariado",
    icon: UserCheck,
    category: "Ação Comunitária",
    roles: ['cidadao', 'voluntario', 'ong'],
    description: "Participe de ações comunitárias"
  },
  {
    href: "/dashboard/donations",
    label: "Doações e Ajuda",
    icon: DollarSign,
    category: "Ação Comunitária",
    roles: ['cidadao', 'voluntario', 'ong'],
    description: "Organize e receba ajuda material"
  },

  // Informações e Suporte
  {
    href: "/dashboard/news",
    label: "Notícias",
    icon: Newspaper,
    category: "Informações",
    roles: ['cidadao', 'voluntario', 'ong', 'defesa_civil', 'admin'],
    description: "Acompanhe notícias sobre clima e prevenção"
  },
  {
    href: "/dashboard/help",
    label: "Suporte",
    icon: HelpCircle,
    category: "Informações",
    roles: ['cidadao', 'voluntario', 'ong', 'defesa_civil', 'admin'],
    description: "Obtenha ajuda sobre o sistema"
  },
  {
    href: "/dashboard/profile",
    label: "Perfil",
    icon: User,
    category: "Configurações",
    roles: ['cidadao', 'voluntario', 'ong', 'defesa_civil', 'admin'],
    description: "Gerencie suas informações pessoais"
  },
];

export function useUserNavigation() {
  const { user } = useSession();

  const userNavItems = useMemo(() => {
    if (!user) {
      // Se não há usuário logado, retorna apenas itens básicos
      return allNavItems.filter(item => 
        ['cidadao'].some(role => item.roles.includes(role as any))
      );
    }

    // Filtra itens baseado no papel do usuário
    return allNavItems.filter(item => 
      item.roles.includes(user.role as any)
    );
  }, [user]);

  const groupedNavItems = useMemo(() => {
    return userNavItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, NavItem[]>);
  }, [userNavItems]);

  const getWelcomeMessage = () => {
    if (!user) return "Bem-vindo ao ClimACT";
    
    switch (user.role) {
      case 'cidadao':
        return `Olá ${user.name}! Você pode reportar situações de risco e se manter informado.`;
      case 'voluntario':
        return `Bem-vindo, ${user.name}! Participe de ações comunitárias e ajude sua região.`;
      case 'ong':
        return `Olá, ${user.name}! Coordene ações de ajuda e conecte-se com a comunidade.`;
      case 'defesa_civil':
        return `Bem-vindo, ${user.name}! Analise relatórios e emita alertas oficiais para a população.`;
      case 'admin':
        return `Olá, ${user.name}! Você tem acesso completo ao sistema ClimACT.`;
      default:
        return `Bem-vindo, ${user.name}!`;
    }
  };

  const getPrimaryActions = () => {
    if (!user) return [];

    switch (user.role) {
      case 'cidadao':
        return [
          { href: '/dashboard/report', label: 'Reportar Situação', icon: FilePlus2 },
          { href: '/dashboard/education', label: 'Aprender', icon: BookOpen },
          { href: '/dashboard/alerts', label: 'Ver Alertas', icon: Bell },
        ];
      case 'voluntario':
        return [
          { href: '/dashboard/volunteer', label: 'Ações Voluntárias', icon: UserCheck },
          { href: '/dashboard/education', label: 'Capacitação', icon: BookOpen },
          { href: '/dashboard/chat', label: 'Coordenar Ajuda', icon: MessageCircle },
        ];
      case 'ong':
        return [
          { href: '/dashboard/ong', label: 'Painel ONG', icon: Heart },
          { href: '/dashboard/donations', label: 'Gerenciar Doações', icon: DollarSign },
          { href: '/dashboard/chat', label: 'Chat Comunidade', icon: MessageCircle },
        ];
      case 'defesa_civil':
        return [
          { href: '/dashboard/validate', label: 'Validar Relatórios', icon: CheckCircle },
          { href: '/dashboard/defesa-civil', label: 'Emitir Alertas', icon: Shield },
          { href: '/dashboard/map', label: 'Monitorar Região', icon: MapPin },
        ];
      default:
        return [
          { href: '/dashboard/map', label: 'Mapa', icon: MapPin },
          { href: '/dashboard/alerts', label: 'Alertas', icon: Bell },
        ];
    }
  };

  return {
    userNavItems,
    groupedNavItems,
    getWelcomeMessage,
    getPrimaryActions,
    userRole: user?.role || 'cidadao',
    userName: user?.name || 'Usuário'
  };
}
