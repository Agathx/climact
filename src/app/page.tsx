import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Shield, Users, MapPin, Bell, Heart } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">ClimACT</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/anonymous-report">
              <Button variant="outline">Denúncia Anônima</Button>
            </Link>
            <Link href="/login">
              <Button>Entrar</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Plataforma Colaborativa
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Combate às Mudanças
            <span className="text-green-600"> Climáticas</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Una-se à nossa comunidade para reportar incidentes ambientais, 
            receber alertas importantes e contribuir para um futuro mais sustentável.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Começar Agora
              </Button>
            </Link>
            <Link href="/emergency-contacts">
              <Button size="lg" variant="outline">
                Contatos de Emergência
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Reportes Seguros</CardTitle>
              <CardDescription>
                Relate incidentes ambientais de forma segura e anônima
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Sistema protegido com validação por IA e comunidade.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Alertas em Tempo Real</CardTitle>
              <CardDescription>
                Receba notificações sobre riscos climáticos na sua região
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Alertas oficiais da Defesa Civil e da comunidade.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Comunidade Ativa</CardTitle>
              <CardDescription>
                Conecte-se com voluntários e organizações locais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Participe de ações colaborativas para o meio ambiente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-10 w-10 text-red-600 mb-2" />
              <CardTitle>Mapa Interativo</CardTitle>
              <CardDescription>
                Visualize incidentes e recursos próximos a você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Mapa em tempo real com localização de riscos e ajuda.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-10 w-10 text-pink-600 mb-2" />
              <CardTitle>Pedidos de Ajuda</CardTitle>
              <CardDescription>
                Solicite ou ofereça ajuda durante emergências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Sistema SOS para situações de emergência climática.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Leaf className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Educação Ambiental</CardTitle>
              <CardDescription>
                Aprenda sobre sustentabilidade e prevenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Trilhas educacionais com gamificação e certificados.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 p-8 bg-white rounded-2xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Pronto para fazer a diferença?
          </h3>
          <p className="text-gray-600 mb-6">
            Junte-se a milhares de pessoas que já estão protegendo o meio ambiente.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Criar Conta Gratuita
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold">ClimACT</span>
              </div>
              <p className="text-gray-400">
                Plataforma colaborativa para combate às mudanças climáticas.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Links Úteis</h4>
              <ul className="space-y-2">
                <li><Link href="/anonymous-report" className="text-gray-400 hover:text-white">Denúncia Anônima</Link></li>
                <li><Link href="/emergency-contacts" className="text-gray-400 hover:text-white">Emergências</Link></li>
                <li><Link href="/support" className="text-gray-400 hover:text-white">Suporte</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contato</h4>
              <p className="text-gray-400">
                Em caso de emergência, ligue 190 ou 193
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
