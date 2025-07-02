import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type { UserRole, VoluntarioProfile, OngProfile, DefesaCivilProfile } from '@/types/user';

// Cloud Functions callables
const requestProfileUpgradeCallable = httpsCallable(functions, 'requestProfileUpgrade');
const reviewProfileUpgradeCallable = httpsCallable(functions, 'reviewProfileUpgrade');
const getUserProfileCallable = httpsCallable(functions, 'getUserProfile');
const updateUserProfileCallable = httpsCallable(functions, 'updateUserProfile');
const listProfileUpgradeRequestsCallable = httpsCallable(functions, 'listProfileUpgradeRequests');

export interface ProfileUpgradeRequestData {
  requestedRole: Exclude<UserRole, 'cidadao' | 'admin'>;
  requestData: VoluntarioProfile | OngProfile | DefesaCivilProfile;
  documentsUrls: { [key: string]: string };
}

export interface ProfileUpgradeReviewData {
  requestId: string;
  approved: boolean;
  rejectionReason?: string;
}

/**
 * Solicita evolução de perfil de usuário (RN01)
 * Apenas cidadãos podem solicitar evolução para voluntário, ONG ou defesa civil
 */
export const requestProfileUpgrade = async (data: ProfileUpgradeRequestData) => {
  try {
    const result = await requestProfileUpgradeCallable(data);
    return result.data;
  } catch (error: any) {
    console.error('Erro ao solicitar evolução de perfil:', error);
    throw new Error(error.message ?? 'Erro ao solicitar evolução de perfil');
  }
};

/**
 * Aprova ou rejeita solicitação de evolução de perfil (apenas admins)
 */
export const reviewProfileUpgrade = async (data: ProfileUpgradeReviewData) => {
  try {
    const result = await reviewProfileUpgradeCallable(data);
    return result.data;
  } catch (error: any) {
    console.error('Erro ao revisar solicitação:', error);
    throw new Error(error.message ?? 'Erro ao revisar solicitação');
  }
};

/**
 * Obtém perfil completo do usuário
 */
export const getUserProfile = async () => {
  try {
    const result = await getUserProfileCallable();
    return result.data;
  } catch (error: any) {
    console.error('Erro ao obter perfil:', error);
    throw new Error(error.message ?? 'Erro ao obter perfil');
  }
};

/**
 * Atualiza dados do perfil do usuário
 */
export const updateUserProfile = async (profileData: Partial<any>) => {
  try {
    const result = await updateUserProfileCallable({ profileData });
    return result.data;
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    throw new Error(error.message ?? 'Erro ao atualizar perfil');
  }
};

/**
 * Listar solicitações de evolução de perfil (apenas admins)
 */
export const listProfileUpgradeRequests = async (status?: string) => {
  try {
    const result = await listProfileUpgradeRequestsCallable({ status });
    return result.data;
  } catch (error: any) {
    console.error('Erro ao listar solicitações:', error);
    throw new Error(error.message ?? 'Erro ao listar solicitações');
  }
};

/**
 * Upload de documento para evolução de perfil
 */
export const uploadProfileDocument = async (file: File, documentType: string): Promise<string> => {
  try {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const storage = getStorage();
    
    // Criar referência única para o arquivo
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `profile-documents/${documentType}/${fileName}`);
    
    // Upload do arquivo
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error: any) {
    console.error('Erro no upload do documento:', error);
    throw new Error('Erro ao fazer upload do documento');
  }
};

/**
 * Validar dados de perfil antes do envio
 */
// Função auxiliar para validar dados de voluntário
const validateVoluntarioData = (data: any): string[] => {
  const errors: string[] = [];
  if (!data.especialidades?.length) {
    errors.push('Selecione pelo menos uma especialidade');
  }
  if (!data.disponibilidade) {
    errors.push('Informe sua disponibilidade');
  }
  if (!data.experiencia) {
    errors.push('Descreva sua experiência');
  }
  return errors;
};

// Função auxiliar para validar dados de ONG
const validateOngData = (data: any): string[] => {
  const errors: string[] = [];
  if (!data.cnpj) {
    errors.push('CNPJ é obrigatório');
  }
  if (!data.endereco?.logradouro) {
    errors.push('Endereço completo é obrigatório');
  }
  if (!data.areaAtuacao?.length) {
    errors.push('Selecione pelo menos uma área de atuação');
  }
  return errors;
};

// Função auxiliar para validar dados de defesa civil
const validateDefesaCivilData = (data: any): string[] => {
  const errors: string[] = [];
  if (!data.orgao) {
    errors.push('Órgão é obrigatório');
  }
  if (!data.cargo) {
    errors.push('Cargo é obrigatório');
  }
  if (!data.municipioAtuacao) {
    errors.push('Município de atuação é obrigatório');
  }
  return errors;
};

export const validateProfileData = (role: UserRole, data: any): { isValid: boolean; errors: string[] } => {
  let errors: string[] = [];
  
  switch (role) {
    case 'voluntario':
      errors = validateVoluntarioData(data);
      break;
    case 'ong':
      errors = validateOngData(data);
      break;
    case 'defesa_civil':
      errors = validateDefesaCivilData(data);
      break;
    default:
      errors = [];
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Obter perfis de usuários (para admins)
 */
export const getUsers = async (filters?: { role?: string; status?: string }) => {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    
    let q = collection(db, 'users');
    
    if (filters?.role) {
      q = query(q, where('role', '==', filters.role)) as any;
    }
    
    if (filters?.status) {
      q = query(q, where('isApproved', '==', filters.status === 'approved')) as any;
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error: any) {
    console.error('Erro ao obter usuários:', error);
    throw new Error(error.message ?? 'Erro ao obter usuários');
  }
};

/**
 * Obtém estatísticas do usuário
 */
export const getUserStatistics = async (userId: string) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    
    const statsDoc = await getDoc(doc(db, 'userStats', userId));
    
    if (statsDoc.exists()) {
      return statsDoc.data();
    }
    
    // Retorna estatísticas padrão se não existir
    return {
      reportsSubmitted: 0,
      activitiesCompleted: 0,
      communityPoints: 0,
      hoursVolunteered: 0
    };
  } catch (error: any) {
    console.error('Erro ao obter estatísticas do usuário:', error);
    throw new Error(error.message ?? 'Erro ao obter estatísticas');
  }
};

/**
 * Upload de foto de perfil
 */
export const uploadProfilePhoto = async (userId: string, file: File): Promise<string> => {
  try {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const storage = getStorage();
    
    // Criar referência única para a foto
    const fileName = `profile_${userId}_${Date.now()}.${file.type.split('/')[1]}`;
    const storageRef = ref(storage, `profile-photos/${fileName}`);
    
    // Upload do arquivo
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error: any) {
    console.error('Erro no upload da foto:', error);
    throw new Error('Erro ao fazer upload da foto de perfil');
  }
};

/**
 * Criar solicitação de mudança de role
 */
export const createRoleRequest = async (userId: string, requestData: {
  requestedRole: string;
  currentRole: string;
  requestedAt: Date;
  status: string;
  justification: string;
}) => {
  try {
    const { collection, addDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    
    const roleRequestsCollection = collection(db, 'roleRequests');
    const docRef = await addDoc(roleRequestsCollection, {
      userId,
      ...requestData,
      createdAt: new Date()
    });
    
    return { id: docRef.id, ...requestData };
  } catch (error: any) {
    console.error('Erro ao criar solicitação de role:', error);
    throw new Error(error.message ?? 'Erro ao criar solicitação');
  }
};
