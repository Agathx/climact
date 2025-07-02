'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Heart, 
  MapPin, 
  MessageCircle,
  UserPlus,
  Search,
  Filter,
  Star,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';


interface Volunteer {
  id: string;
  name: string;
  role: string;
  location: string;
  skills: string[];
  rating: number;
  completedActivities: number;
  joinedDate: string;
  status: 'online' | 'offline' | 'busy';
  bio: string;
  isConnected?: boolean;
}

interface VolunteerGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  isPublic: boolean;
  recentActivity: string;
}

export default function VolunteerNetworkPage() {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [groups, setGroups] = useState<VolunteerGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Load volunteers and groups from Firebase
  useEffect(() => {
    const loadVolunteerData = async () => {
      try {
        setLoading(true);
        const { getVolunteers, getVolunteerGroups } = await import('@/services/volunteerService');
        
        const [volunteersData, groupsData] = await Promise.all([
          getVolunteers(),
          getVolunteerGroups()
        ]);
        
        setVolunteers(volunteersData || []);
        setGroups(groupsData || []);
      } catch (error) {
        console.error('Erro ao carregar dados de voluntários:', error);
        // Fallback to empty arrays if Firebase fails
        setVolunteers([]);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    loadVolunteerData();
  }, []);

  const handleConnectVolunteer = (volunteerId: string) => {
    setVolunteers(prev => 
      prev.map(vol => 
        vol.id === volunteerId 
          ? { ...vol, isConnected: !vol.isConnected }
          : vol
      )
    );
  };

  const handleMessageVolunteer = (volunteerId: string) => {
    router.push(`/dashboard/chat?user=${volunteerId}`);
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         volunteer.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'online') return matchesSearch && volunteer.status === 'online';
    if (selectedFilter === 'connected') return matchesSearch && volunteer.isConnected;
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'busy': return 'Ocupado';
      case 'offline': return 'Offline';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rede de Voluntários</h1>
          <p className="text-muted-foreground">
            Conecte-se com outros voluntários e fortaleça a comunidade
          </p>
        </div>
        <Button onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar voluntários por nome ou habilidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={selectedFilter === 'online' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('online')}
              >
                Online
              </Button>
              <Button
                variant={selectedFilter === 'connected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('connected')}
              >
                Conectados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="volunteers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="volunteers">Voluntários ({filteredVolunteers.length})</TabsTrigger>
          <TabsTrigger value="groups">Grupos ({groups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="volunteers" className="space-y-4">
          {filteredVolunteers.map((volunteer) => (
            <Card key={volunteer.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${volunteer.name}`} />
                      <AvatarFallback>
                        {volunteer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(volunteer.status)} border-2 border-white`} />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{volunteer.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {volunteer.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{volunteer.role}</Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{volunteer.rating}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm">{volunteer.bio}</p>

                    <div className="flex flex-wrap gap-1">
                      {volunteer.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          {volunteer.completedActivities} atividades
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Desde {new Date(volunteer.joinedDate).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(volunteer.status)}`} />
                          {getStatusLabel(volunteer.status)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMessageVolunteer(volunteer.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Conversar
                        </Button>
                        <Button
                          variant={volunteer.isConnected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleConnectVolunteer(volunteer.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          {volunteer.isConnected ? 'Conectado' : 'Conectar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredVolunteers.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2" />
                  <p>Nenhum voluntário encontrado</p>
                  <p className="text-sm">Tente ajustar os filtros de busca</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      <Badge variant={group.isPublic ? "secondary" : "outline"}>
                        {group.isPublic ? 'Público' : 'Privado'}
                      </Badge>
                      <Badge variant="outline">{group.category}</Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {group.memberCount} membros
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Ativo {group.recentActivity}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Participar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}