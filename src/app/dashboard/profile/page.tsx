'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from '@/hooks/use-session';
import { ProfileUpgradeForm } from '@/components/profile-upgrade-form';

import { 
  User, 
  Edit, 
  FileUp, 
  BarChart2, 
  Award, 
  FileText, 
  AlertTriangle,
  ArrowLeft,
  Save,
  X,
  Camera,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/types/user';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  address?: string;
  bio?: string;
  birthDate?: string;
  skills?: string[];
  joinedAt: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  statistics: {
    reportsSubmitted: number;
    activitiesCompleted: number;
    communityPoints: number;
    hoursVolunteered: number;
  };
}

function ProfileLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 text-center md:text-left">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
             <Skeleton className="mt-2 h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
             <Skeleton className="mt-2 h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useSession();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetRole, setTargetRole] = useState<Exclude<UserRole, 'cidadao' | 'admin'>>('voluntario');
  
  // Firebase user profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editForm, setEditForm] = useState<UserProfile | null>(null);

  // Load user profile from Firebase
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        setProfileLoading(true);          // Get user profile from profileService
          const { getUserProfile, getUserStatistics } = await import('@/services/profileService');
          
          const [userProfile, userStats] = await Promise.all([
            getUserProfile(),
            getUserStatistics(user.uid)
          ]);
          
          if (userProfile && typeof userProfile === 'object') {
            const profileData: UserProfile = {
              uid: (userProfile as any).uid || user.uid,
              name: (userProfile as any).displayName || user.name || 'Usuário',
              email: (userProfile as any).email || user.email || '',
              role: (userProfile as any).role || user.role || 'cidadao',
              photoURL: (userProfile as any).photoURL || user.photoURL,
              phone: (userProfile as any).phone,
              address: (userProfile as any).address,
              bio: (userProfile as any).bio,
              birthDate: (userProfile as any).birthDate,
              skills: (userProfile as any).skills || [],
              joinedAt: (userProfile as any).createdAt?.toDate?.().toISOString() || new Date().toISOString(),
              verificationStatus: (userProfile as any).verificationStatus || 'pending',
            statistics: {
              reportsSubmitted: userStats?.reportsSubmitted || 0,
              activitiesCompleted: userStats?.activitiesCompleted || 0,
              communityPoints: userStats?.communityPoints || 0,
              hoursVolunteered: userStats?.hoursVolunteered || 0
            }
          };
          
          setProfile(profileData);
          setEditForm(profileData);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar seus dados",
          variant: "destructive"
        });
      } finally {
        setProfileLoading(false);
      }
    };

    if (user && !loading) {
      loadUserProfile();
    }
  }, [user, loading, toast]);

  const handleSaveProfile = async () => {
    if (!editForm || !user) return;
    
    try {        // Update profile in Firebase
        const { updateUserProfile } = await import('@/services/profileService');
        
        await updateUserProfile({
          displayName: editForm.name,
          phone: editForm.phone,
          address: editForm.address,
          bio: editForm.bio,
          birthDate: editForm.birthDate,
          skills: editForm.skills
        });
      
      setProfile(editForm);
      setIsEditing(false);
      
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      try {
        // Upload to Firebase Storage
        const { uploadProfilePhoto } = await import('@/services/profileService');
        
        toast({
          title: 'Enviando foto...',
          description: 'Aguarde enquanto fazemos o upload da sua foto.',
        });
        
        const photoURL = await uploadProfilePhoto(user.uid, file);
        
        setEditForm(prev => prev ? { ...prev, photoURL } : null);
        
        toast({
          title: 'Foto carregada!',
          description: 'Não esqueça de salvar o perfil para confirmar a alteração.',
        });
      } catch (error) {
        console.error('Erro ao fazer upload da foto:', error);
        toast({
          title: 'Erro no upload',
          description: 'Não foi possível enviar a foto. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors = {
      'cidadao': 'bg-blue-100 text-blue-800',
      'voluntario': 'bg-green-100 text-green-800',
      'ong': 'bg-purple-100 text-purple-800',
      'defesa_civil': 'bg-orange-100 text-orange-800',
      'admin': 'bg-red-100 text-red-800'
    };
    return colors[role] || colors.cidadao;
  };

  const getRoleDisplayName = (role: UserRole) => {
    const names = {
      'cidadao': 'Cidadão',
      'voluntario': 'Voluntário',
      'ong': 'ONG',
      'defesa_civil': 'Defesa Civil',
      'admin': 'Administrador'
    };
    return names[role] || 'Usuário';
  };

  if (loading) {
    return <ProfileLoadingSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Usuário não encontrado</CardTitle>
            <CardDescription>
              Você precisa estar logado para ver seu perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Fazer Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showUpgradeForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowUpgradeForm(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Solicitar Upgrade de Perfil</h1>
            <p className="text-muted-foreground">
              Evolua seu perfil para {getRoleDisplayName(targetRole)}
            </p>
          </div>
        </div>
        <ProfileUpgradeForm
          currentRole={profile?.role || 'cidadao'}
          targetRole={targetRole}
          onCancel={() => setShowUpgradeForm(false)}
          onSuccess={() => {
            setShowUpgradeForm(false);
            toast({
              title: 'Solicitação enviada!',
              description: 'Sua solicitação será analisada em até 48 horas.',
            });
          }}
        />
      </div>
    );
  }

  const currentProfile = isEditing ? editForm : profile;

  // Show loading while profile is being loaded
  if (profileLoading || !profile) {
    return <ProfileLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditForm(profile);
                  setIsEditing(false);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={currentProfile?.photoURL || ''} />
                <AvatarFallback className="text-xl">
                  {currentProfile?.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-3">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={editForm?.name || ''}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      value={editForm?.bio || ''}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, bio: e.target.value } : null)}
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{currentProfile?.name || 'Usuário'}</h2>
                  <p className="text-muted-foreground">{currentProfile?.bio || 'Bio não informada'}</p>
                </>
              )}
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge className={getRoleBadgeColor(currentProfile?.role || 'cidadao')}>
                  {getRoleDisplayName(currentProfile?.role || 'cidadao')}
                </Badge>
                {currentProfile?.verificationStatus === 'verified' && (
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {currentProfile?.role === 'cidadao' && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setTargetRole('voluntario');
                    setShowUpgradeForm(true);
                  }}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Tornar-se Voluntário
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm?.email || ''}
                  onChange={(e) => setEditForm(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={editForm?.phone || ''}
                  onChange={(e) => setEditForm(prev => prev ? { ...prev, phone: e.target.value } : null)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={editForm?.address || ''}
                  onChange={(e) => setEditForm(prev => prev ? { ...prev, address: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={editForm?.birthDate || ''}
                  onChange={(e) => setEditForm(prev => prev ? { ...prev, birthDate: e.target.value } : null)}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{currentProfile?.email || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{currentProfile?.phone || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{currentProfile?.address || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span>{currentProfile?.birthDate ? new Date(currentProfile.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Enviados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.statistics.reportsSubmitted}</div>
            <p className="text-xs text-muted-foreground">+2 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividades Completadas</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.statistics.activitiesCompleted}</div>
            <p className="text-xs text-muted-foreground">+1 esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos da Comunidade</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.statistics.communityPoints}</div>
            <p className="text-xs text-muted-foreground">+50 pontos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Voluntárias</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.statistics.hoursVolunteered}h</div>
            <p className="text-xs text-muted-foreground">+8h este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Habilidades e Interesses</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div>
              <Label htmlFor="skills">Habilidades (separadas por vírgula)</Label>
              <Input
                id="skills"
                value={editForm?.skills?.join(', ') || ''}
                onChange={(e) => setEditForm(prev => prev ? ({ 
                  ...prev, 
                  skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }) : null)}
                placeholder="Ex: Primeiros Socorros, Liderança, Educação Ambiental"
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentProfile?.skills?.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}