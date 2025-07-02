'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Phone, 
  MessageCircle, 
  Shield, 
  AlertTriangle, 
  FileText, 
  Heart,
  Search,
  Mail,
  Clock,
  Users,
  HelpCircle,
  ExternalLink,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface EmergencyContact {
  name: string;
  phone: string;
  description: string;
  available: string;
  icon: any;
  color: string;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('emergency');
  const [supportTicket, setSupportTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });

  const emergencyContacts: EmergencyContact[] = [
    {
      name: 'Bombeiros',
      phone: '193',
      description: 'Incêndios, resgates e emergências médicas',
      available: '24 horas',
      icon: Shield,
      color: 'text-red-600'
    },
    {
      name: 'SAMU',
      phone: '192',
      description: 'Serviço de Atendimento Móvel de Urgência',
      available: '24 horas',
      icon: Heart,
      color: 'text-red-500'
    },
    {
      name: 'Polícia Militar',
      phone: '190',
      description: 'Emergências policiais e segurança pública',
      available: '24 horas',
      icon: Shield,
      color: 'text-blue-600'
    },
    {
      name: 'Defesa Civil SP',
      phone: '199',
      description: 'Emergências climáticas e desastres naturais',
      available: '24 horas',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      name: 'Disque Denúncia',
      phone: '181',
      description: 'Denúncias anônimas de crimes ambientais',
      available: '24 horas',
      icon: Phone,
      color: 'text-green-600'
    }
  ];

  const faqs: FAQ[] = [
    {
      question: 'Como posso reportar um incidente ambiental?',
      answer: 'Você pode reportar incidentes através da seção "Reportar Incidente" no menu principal. Preencha todas as informações necessárias, incluindo localização e descrição detalhada.',
      category: 'reports'
    },
    {
      question: 'Posso fazer denúncias anônimas?',
      answer: 'Sim! Acesse a página de "Denúncia Anônima" disponível no site. Sua identidade será completamente protegida e você receberá um número de protocolo para acompanhamento.',
      category: 'reports'
    },
    {
      question: 'Como me voluntariar para ações ambientais?',
      answer: 'Visite a seção "Voluntariado" onde você pode ver oportunidades disponíveis, conectar-se com outros voluntários e participar de grupos de ação.',
      category: 'volunteer'
    },
    {
      question: 'Como posso acompanhar o status do meu relatório?',
      answer: 'Após enviar um relatório, você receberá um número de protocolo. Use este número na seção "Acompanhar" para verificar o status da sua denúncia.',
      category: 'reports'
    },
    {
      question: 'O que fazer em caso de emergência climática?',
      answer: 'Em emergências, ligue imediatamente para os números de emergência (193, 192, 199). Use também o botão SOS no mapa para solicitar socorro rápido.',
      category: 'emergency'
    },
    {
      question: 'Como posso melhorar meu perfil de voluntário?',
      answer: 'Complete mais atividades, participe de treinamentos educacionais e mantenha um histórico positivo de contribuições para a comunidade.',
      category: 'profile'
    }
  ];

  const handleSubmitTicket = async () => {
    if (!supportTicket.subject || !supportTicket.description) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o assunto e a descrição',
        variant: 'destructive',
      });
      return;
    }

    // Simular envio do ticket
    toast({
      title: 'Ticket criado com sucesso!',
      description: 'Nossa equipe entrará em contato em até 24 horas',
    });

    setSupportTicket({ subject: '', description: '', priority: 'medium' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Ajuda e Suporte</h1>
        <p className="text-muted-foreground">
          Central de ajuda, contatos de emergência e suporte técnico
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="emergency">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Emergência
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="support">
            <MessageCircle className="w-4 h-4 mr-2" />
            Suporte
          </TabsTrigger>
          <TabsTrigger value="guides">
            <FileText className="w-4 h-4 mr-2" />
            Guias
          </TabsTrigger>
        </TabsList>

        {/* Contatos de Emergência */}
        <TabsContent value="emergency" className="space-y-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                ⚠️ ATENÇÃO: Em caso de risco de vida, ligue IMEDIATAMENTE
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact) => (
              <Card key={contact.phone} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full bg-gray-100 ${contact.color}`}>
                      <contact.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{contact.name}</h3>
                      <div className="text-2xl font-bold text-primary mb-2">
                        {contact.phone}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {contact.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {contact.available}
                      </Badge>
                    </div>
                    <Button size="sm" onClick={() => window.open(`tel:${contact.phone}`)}>
                      <Phone className="w-4 h-4 mr-2" />
                      Ligar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas em Emergências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <AlertTriangle className="w-5 h-5 mr-3 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium">Denúncia Anônima</div>
                    <div className="text-sm text-muted-foreground">Reporte situações irregulares</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <Shield className="w-5 h-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">SOS no Mapa</div>
                    <div className="text-sm text-muted-foreground">Socorro com localização</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {['Todos', 'Relatórios', 'Voluntariado', 'Emergência'].map((filter) => (
              <Button key={filter} variant="outline" size="sm">
                {filter}
              </Button>
            ))}
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    {faq.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* Suporte Técnico */}
        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Criar Ticket de Suporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Assunto</label>
                  <Input
                    placeholder="Descreva brevemente o problema"
                    value={supportTicket.subject}
                    onChange={(e) => setSupportTicket(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    placeholder="Descreva detalhadamente o problema ou dúvida"
                    rows={4}
                    value={supportTicket.description}
                    onChange={(e) => setSupportTicket(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <Button onClick={handleSubmitTicket} className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar Ticket
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outras Formas de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">suporte@climact.org</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Chat ao Vivo</div>
                    <div className="text-sm text-muted-foreground">Seg-Sex, 8h às 18h</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Comunidade</div>
                    <div className="text-sm text-muted-foreground">Fórum de discussões</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Guias e Recursos */}
        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Como usar a plataforma', desc: 'Guia completo para novos usuários', icon: FileText },
              { title: 'Manual do Voluntário', desc: 'Tudo sobre voluntariado na plataforma', icon: Users },
              { title: 'Relatórios e Denúncias', desc: 'Como reportar incidentes corretamente', icon: AlertTriangle },
              { title: 'Configurações de Privacidade', desc: 'Gerencie seus dados e privacidade', icon: Shield },
              { title: 'Guia de Emergências', desc: 'Procedimentos em situações críticas', icon: Phone },
              { title: 'API para Desenvolvedores', desc: 'Documentação técnica da API', icon: ExternalLink }
            ].map((guide, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <guide.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{guide.desc}</p>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}