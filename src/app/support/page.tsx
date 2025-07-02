'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Shield,
  Users,
  AlertTriangle
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'reports' | 'profile' | 'emergency' | 'education' | 'general';
  tags: string[];
}

interface SupportResource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'document' | 'link';
  url?: string;
  category: string;
}

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = {
    reports: { name: 'Relatórios', icon: AlertTriangle, color: 'text-orange-600' },
    profile: { name: 'Perfil', icon: Users, color: 'text-blue-600' },
    emergency: { name: 'Emergências', icon: Shield, color: 'text-red-600' },
    education: { name: 'Educação', icon: BookOpen, color: 'text-green-600' },
    general: { name: 'Geral', icon: HelpCircle, color: 'text-gray-600' }
  };

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'Como reportar um incidente ambiental?',
      answer: 'Para reportar um incidente, acesse a seção "Reportar" no dashboard, preencha as informações obrigatórias (tipo de incidente, localização, descrição), adicione fotos se possível, e envie. O sistema analisará automaticamente via IA e, se aprovado, será enviado para validação comunitária.',
      category: 'reports',
      tags: ['reportar', 'incidente', 'ambiental']
    },
    {
      id: '2',
      question: 'Como posso me tornar um voluntário?',
      answer: 'Para se tornar voluntário, vá ao seu perfil, clique em "Solicitar Evolução de Perfil", selecione "Voluntário", preencha suas especialidades, experiência e disponibilidade, anexe documentos necessários (RG, CPF, certificados), e envie a solicitação. Ela será analisada pelos administradores.',
      category: 'profile',
      tags: ['voluntário', 'perfil', 'evolução']
    },
    {
      id: '3',
      question: 'O que fazer em caso de emergência climática?',
      answer: 'Em emergências climáticas: 1) Mantenha-se seguro primeiro; 2) Ligue 193 (bombeiros) ou 199 (defesa civil); 3) Se possível, reporte no app para alertar a comunidade; 4) Siga as instruções dos órgãos competentes; 5) Use a função SOS do app se precisar de ajuda da comunidade.',
      category: 'emergency',
      tags: ['emergência', 'climática', 'socorro']
    },
    {
      id: '4',
      question: 'Como funciona a validação comunitária?',
      answer: 'A validação comunitária permite que outros usuários votem em relatórios. Após a aprovação da IA, os relatórios são apresentados à comunidade para votação (aprovar/reprovar). Cada usuário pode votar uma vez por relatório. Relatórios com muitas aprovações são enviados à Defesa Civil.',
      category: 'reports',
      tags: ['validação', 'comunidade', 'votação']
    },
    {
      id: '5',
      question: 'Como acessar os módulos educacionais?',
      answer: 'Acesse "Educação" no dashboard. Lá você encontrará módulos sobre mudanças climáticas, sustentabilidade, resposta a emergências e prevenção. Complete os módulos para ganhar pontos, certificados e desbloquear conteúdo avançado.',
      category: 'education',
      tags: ['educação', 'módulos', 'certificados']
    },
    {
      id: '6',
      question: 'Como fazer denúncias anônimas?',
      answer: 'Use a página de denúncias anônimas (não precisa estar logado). Preencha o formulário com o máximo de detalhes possível, adicione evidências se tiver, e envie. Você receberá um código para acompanhar o status da denúncia.',
      category: 'reports',
      tags: ['denúncia', 'anônima', 'privacidade']
    },
    {
      id: '7',
      question: 'O ClimACT funciona offline?',
      answer: 'O ClimACT é uma PWA (Progressive Web App) que oferece funcionalidades limitadas offline, como visualizar informações já carregadas e preparar relatórios. Para enviar dados e acessar funcionalidades completas, é necessária conexão com internet.',
      category: 'general',
      tags: ['offline', 'pwa', 'conectividade']
    },
    {
      id: '8',
      question: 'Como participar do chat comunitário?',
      answer: 'Acesse "Chat" no dashboard. Você pode participar de canais gerais, de emergência, educacionais ou de suporte. Mantenha o respeito e siga as diretrizes da comunidade. Mensagens são moderadas por IA e voluntários.',
      category: 'general',
      tags: ['chat', 'comunidade', 'moderação']
    },
    {
      id: '9',
      question: 'Como funciona o sistema de doações?',
      answer: 'Na seção "Doações", você pode criar solicitações (se for ONG) ou atender solicitações existentes. Especifique itens necessários, urgência e localização. O sistema conecta doadores com receptores na mesma região.',
      category: 'general',
      tags: ['doações', 'ong', 'ajuda']
    },
    {
      id: '10',
      question: 'Meus dados estão seguros?',
      answer: 'Sim! Seguimos a LGPD e boas práticas de segurança. Dados são criptografados, acesso é controlado por autenticação, e você pode gerenciar suas permissões de privacidade no perfil. Dados anônimos são usados apenas para estatísticas agregadas.',
      category: 'general',
      tags: ['privacidade', 'lgpd', 'segurança']
    }
  ];

  const supportResources: SupportResource[] = [
    {
      id: '1',
      title: 'Guia Completo do ClimACT',
      description: 'Manual completo com todas as funcionalidades da plataforma',
      type: 'document',
      category: 'Geral',
      url: '/docs/manual-usuario.pdf'
    },
    {
      id: '2',
      title: 'Como Reportar Incidentes - Vídeo Tutorial',
      description: 'Tutorial em vídeo mostrando passo a passo como reportar incidentes',
      type: 'video',
      category: 'Relatórios',
      url: 'https://youtube.com/watch?v=example'
    },
    {
      id: '3',
      title: 'Evolução de Perfil - Passo a Passo',
      description: 'Guia detalhado para solicitar evolução de perfil de usuário',
      type: 'guide',
      category: 'Perfil'
    },
    {
      id: '4',
      title: 'Protocolos de Emergência',
      description: 'Documento oficial com protocolos para diferentes tipos de emergência',
      type: 'document',
      category: 'Emergências',
      url: '/docs/protocolos-emergencia.pdf'
    }
  ];

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <HelpCircle className="inline-block w-8 h-8 mr-3 text-blue-600" />
          Suporte e Ajuda
        </h1>
        <p className="text-gray-600">
          Encontre respostas para suas dúvidas e aprenda a usar melhor o ClimACT
        </p>
      </div>

      {/* Contato Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Chat Suporte</h3>
            <p className="text-sm text-gray-600 mb-3">Fale conosco em tempo real</p>
            <Button size="sm" className="w-full">
              Iniciar Chat
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Mail className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold mb-1">Email</h3>
            <p className="text-sm text-gray-600 mb-3">suporte@climact.com.br</p>
            <Button size="sm" variant="outline" className="w-full">
              Enviar Email
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Phone className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <h3 className="font-semibold mb-1">Telefone</h3>
            <p className="text-sm text-gray-600 mb-3">(11) 1234-5678</p>
            <Button size="sm" variant="outline" className="w-full">
              Ligar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faq">Perguntas Frequentes</TabsTrigger>
          <TabsTrigger value="resources">Recursos e Guias</TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
              <CardDescription>
                Encontre respostas rápidas para as dúvidas mais comuns
              </CardDescription>
              
              {/* Filtros */}
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar dúvidas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as categorias</option>
                  {Object.entries(categories).map(([key, category]) => (
                    <option key={key} value={key}>{category.name}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {filteredFAQs.map((faq) => {
                  const category = categories[faq.category];
                  const Icon = category.icon;
                  const isExpanded = expandedFAQ === faq.id;
                  
                  return (
                    <div key={faq.id} className="border rounded-lg">
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${category.color}`} />
                          <div>
                            <h3 className="font-semibold">{faq.question}</h3>
                            <Badge variant="outline" className="mt-1">
                              {category.name}
                            </Badge>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t bg-gray-50">
                          <p className="text-gray-700 mt-3 leading-relaxed">
                            {faq.answer}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {faq.tags.map((tag, index) => (
                              <Badge key={`tag-${tag}`} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {filteredFAQs.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhuma resposta encontrada
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Tente ajustar sua busca ou entre em contato conosco
                  </p>
                  <Button>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Falar com Suporte
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Recursos e Guias</CardTitle>
              <CardDescription>
                Documentos, vídeos e materiais para ajudá-lo a usar o ClimACT
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {supportResources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {resource.category}
                          </Badge>
                        </div>
                        <Badge className="ml-2">
                          {resource.type === 'guide' && 'Guia'}
                          {resource.type === 'video' && 'Vídeo'}
                          {resource.type === 'document' && 'PDF'}
                          {resource.type === 'link' && 'Link'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                      <Button variant="outline" className="w-full">
                        {resource.url ? (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {resource.type === 'video' ? 'Assistir' : 'Acessar'}
                          </>
                        ) : (
                          'Em breve'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Informações de Contato Detalhadas */}
      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          📞 Informações de Contato
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <strong>Suporte Técnico:</strong><br />
            Segunda a Sexta: 8h às 18h<br />
            Sábado: 8h às 12h<br />
            Email: suporte@climact.com.br<br />
            Telefone: (11) 1234-5678
          </div>
          <div>
            <strong>Emergências 24h:</strong><br />
            Use sempre os números oficiais:<br />
            Bombeiros: 193<br />
            SAMU: 192<br />
            Defesa Civil: 199
          </div>
        </div>
      </div>
    </div>
  );
}
