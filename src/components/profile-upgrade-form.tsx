'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { requestProfileUpgrade } from '@/services/profileService';
import type { UserRole, VoluntarioProfile, OngProfile, DefesaCivilProfile } from '@/types/user';

interface ProfileUpgradeFormProps {
  currentRole: UserRole;
  targetRole: Exclude<UserRole, 'cidadao' | 'admin'>;
  onCancel: () => void;
  onSuccess: () => void;
}

type FormDataType = Partial<VoluntarioProfile & OngProfile & DefesaCivilProfile & { agreeToTerms: boolean }>;

export function ProfileUpgradeForm({ currentRole, targetRole, onCancel, onSuccess }: ProfileUpgradeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File>>({});
  const [formData, setFormData] = useState<FormDataType>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Implementar upload de documentos para Firebase Storage
      const documentsUrls: { [key: string]: string } = {};
      
      for (const [key, file] of Object.entries(uploadedDocs)) {
        if (file) {
          // TODO: Implementar upload real para Firebase Storage
          // Por enquanto, simula URLs
          documentsUrls[key] = `https://storage.firebase.com/documents/${Date.now()}_${file.name}`;
        }
      }

      // Chama a função requestProfileUpgrade
      await requestProfileUpgrade({
        requestedRole: targetRole,
        requestData: formData as VoluntarioProfile | OngProfile | DefesaCivilProfile,
        documentsUrls
      });

      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Sua solicitação será analisada em até 5 dias úteis.",
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (docKey: string, file: File) => {
    setUploadedDocs(prev => ({ ...prev, [docKey]: file }));
  };

  const requiredDocuments = getRequiredDocuments(targetRole);
  const isFormValid = validateForm(targetRole, formData, uploadedDocs);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Solicitar {getRoleDisplayName(targetRole)}
        </CardTitle>
        <CardDescription>
          Preencha os campos abaixo para solicitar a evolução do seu perfil. 
          Sua solicitação será analisada por nossa equipe.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Campos específicos por perfil */}
          {renderFormFields(targetRole, formData, setFormData)}

          {/* Upload de documentos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documentos Obrigatórios</h3>
            <div className="grid gap-4">
              {requiredDocuments.map((doc) => (
                <div key={doc.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{doc.label}</h4>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept={doc.accept}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(doc.key, file);
                      }}
                      className="w-auto"
                    />
                    {uploadedDocs[doc.key] && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Termos de concordância */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms || false}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, agreeToTerms: checked === true }))
                }
              />
              <Label htmlFor="terms" className="text-sm">
                Declaro que as informações fornecidas são verdadeiras e estou ciente das 
                responsabilidades do perfil {getRoleDisplayName(targetRole)}.
              </Label>
            </div>
          </div>

          {!isFormValid && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Preencha todos os campos obrigatórios e faça upload dos documentos necessários.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <div className="flex gap-4 p-6 pt-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!isFormValid || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function renderFormFields(
  targetRole: Exclude<UserRole, 'cidadao' | 'admin'>, 
  formData: FormDataType, 
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>
) {
  switch (targetRole) {
    case 'voluntario':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="skills">Habilidades/Especialidades</Label>
              <Input
                id="skills"
                placeholder="Ex: Primeiros socorros, construção civil"
                value={(formData.skills as string[])?.join(', ') || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">Disponibilidade</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                availability: { days: [value], hours: '08:00-18:00' }
              }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua disponibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekdays">Dias úteis</SelectItem>
                  <SelectItem value="weekends">Fins de semana</SelectItem>
                  <SelectItem value="flexible">Flexível</SelectItem>
                  <SelectItem value="emergencies">Apenas emergências</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialties">Especialidades</Label>
            <Textarea
              id="specialties"
              placeholder="Descreva suas especialidades e experiência prévia"
              value={(formData.specialties as string[])?.join(', ') || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
            />
          </div>
        </>
      );

    case 'ong':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nome da Organização *</Label>
              <Input
                id="organizationName"
                required
                value={formData.organizationName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                required
                placeholder="00.000.000/0000-00"
                value={formData.cnpj || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição da Organização *</Label>
            <Textarea
              id="description"
              required
              placeholder="Descreva a missão e atividades da sua organização"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Site da Organização</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://exemplo.org"
                value={formData.websiteUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="areasOfActuation">Áreas de Atuação *</Label>
              <Input
                id="areasOfActuation"
                required
                placeholder="Ex: Meio ambiente, educação, assistência social"
                value={(formData.areasOfActuation as string[])?.join(', ') || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  areasOfActuation: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
              />
            </div>
          </div>
        </>
      );

    case 'defesa_civil':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Órgão/Instituição *</Label>
              <Input
                id="organization"
                required
                placeholder="Ex: Defesa Civil Municipal"
                value={formData.organization || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Cargo *</Label>
              <Input
                id="position"
                required
                placeholder="Ex: Coordenador, Agente"
                value={formData.position || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="municipality">Município *</Label>
              <Input
                id="municipality"
                required
                value={formData.municipality || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, municipality: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SP">São Paulo</SelectItem>
                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  <SelectItem value="MG">Minas Gerais</SelectItem>
                  {/* Adicionar outros estados */}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Número de Matrícula/Registro *</Label>
            <Input
              id="registrationNumber"
              required
              value={formData.registrationNumber || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
            />
          </div>
        </>
      );

    default:
      return null;
  }
}

function getRequiredDocuments(targetRole: Exclude<UserRole, 'cidadao' | 'admin'>) {
  const commonDocs = [
    {
      key: 'identity',
      label: 'Documento de Identidade',
      description: 'RG ou CNH (frente e verso)',
      accept: 'image/*,.pdf'
    },
    {
      key: 'cpf',
      label: 'CPF',
      description: 'Documento de CPF válido',
      accept: 'image/*,.pdf'
    }
  ];

  switch (targetRole) {
    case 'voluntario':
      return [
        ...commonDocs,
        {
          key: 'criminal_record',
          label: 'Antecedentes Criminais',
          description: 'Certidão de antecedentes criminais',
          accept: '.pdf'
        }
      ];

    case 'ong':
      return [
        ...commonDocs,
        {
          key: 'cnpj_certificate',
          label: 'Comprovante de CNPJ',
          description: 'Cartão CNPJ ou comprovante da Receita Federal',
          accept: 'image/*,.pdf'
        },
        {
          key: 'social_contract',
          label: 'Contrato Social',
          description: 'Estatuto ou contrato social da organização',
          accept: '.pdf'
        }
      ];

    case 'defesa_civil':
      return [
        ...commonDocs,
        {
          key: 'work_certificate',
          label: 'Comprovante de Vínculo',
          description: 'Declaração de vínculo com o órgão público',
          accept: '.pdf'
        },
        {
          key: 'authorization_letter',
          label: 'Carta de Autorização',
          description: 'Autorização do superior hierárquico',
          accept: '.pdf'
        }
      ];

    default:
      return commonDocs;
  }
}

function validateForm(
  targetRole: Exclude<UserRole, 'cidadao' | 'admin'>, 
  formData: FormDataType, 
  uploadedDocs: Record<string, File>
): boolean {
  // Verificar se termos foram aceitos
  if (!formData.agreeToTerms) return false;

  // Verificar documentos obrigatórios
  const requiredDocs = getRequiredDocuments(targetRole);
  const hasAllDocs = requiredDocs.every(doc => uploadedDocs[doc.key]);
  
  if (!hasAllDocs) return false;

  // Verificar campos específicos por role
  switch (targetRole) {
    case 'voluntario':
      return !!(formData.skills && formData.availability);
    
    case 'ong':
      return !!(
        formData.organizationName && 
        formData.cnpj && 
        formData.description && 
        formData.areasOfActuation
      );
    
    case 'defesa_civil':
      return !!(
        formData.organization && 
        formData.position && 
        formData.municipality && 
        formData.state && 
        formData.registrationNumber
      );
    
    default:
      return false;
  }
}

function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    voluntario: 'Voluntário',
    ong: 'ONG',
    defesa_civil: 'Defesa Civil',
    cidadao: 'Cidadão',
    admin: 'Administrador'
  };
  return roleNames[role] || role;
}
