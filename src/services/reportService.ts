import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type { Report, ReportStatus } from '@/types/report';

// Cloud Functions callables
const submitReportCallable = httpsCallable(functions, 'submitReport');
const validateReportCommunityCallable = httpsCallable(functions, 'validateReportCommunity');
const reviewReportDefesaCivilCallable = httpsCallable(functions, 'reviewReportDefesaCivil');
const getReportsCallable = httpsCallable(functions, 'getReports');

export interface SubmitReportData {
  incidentType: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  mediaUrls?: string[];
}

export interface CommunityValidationData {
  reportId: string;
  vote: 'up' | 'down';
}

export interface DefesaCivilReviewData {
  reportId: string;
  decision: 'approve' | 'reject';
  reason?: string;
}

export interface GetReportsFilters {
  status?: ReportStatus;
  location?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  limit?: number;
  startAfter?: string;
}

/**
 * Submeter novo relatório (RN02)
 */
export const submitReport = async (data: SubmitReportData): Promise<{ reportId: string; status: string }> => {
  try {
    // Em desenvolvimento, simular resposta bem-sucedida
    if (process.env.NODE_ENV === 'development') {
      console.info('Modo desenvolvimento: simulando submissão de relatório');
      return {
        reportId: `mock-report-${Date.now()}`,
        status: 'pending'
      };
    }

    const result = await submitReportCallable(data);
    return result.data as { reportId: string; status: string };
  } catch (error: any) {
    console.error('Erro ao submeter relatório:', error);
    throw new Error(error.message ?? 'Erro ao submeter relatório');
  }
};

/**
 * Votar em relatório na validação comunitária (RN02)
 */
export const validateReportCommunity = async (data: CommunityValidationData): Promise<{ success: boolean }> => {
  try {
    const result = await validateReportCommunityCallable(data);
    return result.data as { success: boolean };
  } catch (error: any) {
    console.error('Erro ao votar no relatório:', error);
    throw new Error(error.message ?? 'Erro ao votar no relatório');
  }
};

/**
 * Revisão final pela Defesa Civil (RN02)
 */
export const reviewReportDefesaCivil = async (data: DefesaCivilReviewData): Promise<{ success: boolean }> => {
  try {
    const result = await reviewReportDefesaCivilCallable(data);
    return result.data as { success: boolean };
  } catch (error: any) {
    console.error('Erro ao revisar relatório:', error);
    throw new Error(error.message ?? 'Erro ao revisar relatório');
  }
};

/**
 * Obter relatórios com filtros
 */
export const getReports = async (filters?: GetReportsFilters): Promise<{ reports: Report[] }> => {
  try {
    const result = await getReportsCallable(filters || {});
    return result.data as { reports: Report[] };
  } catch (error: any) {
    console.error('Erro ao obter relatórios:', error);
    throw new Error(error.message ?? 'Erro ao obter relatórios');
  }
};

/**
 * Upload de mídia para relatório
 */
export const uploadReportMedia = async (file: File, reportId?: string): Promise<string> => {
  try {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const storage = getStorage();
    
    // Criar referência única para o arquivo
    const fileName = `${Date.now()}_${file.name}`;
    const folderPath = reportId ? `reports/${reportId}` : 'temp-reports';
    const storageRef = ref(storage, `${folderPath}/${fileName}`);
    
    // Upload do arquivo
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error: any) {
    console.error('Erro no upload da mídia:', error);
    throw new Error('Erro ao fazer upload da mídia');
  }
};

/**
 * Validar dados do relatório antes do envio
 */
export const validateReportData = (data: SubmitReportData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.incidentType) {
    errors.push('Selecione o tipo de incidente');
  }
  
  if (!data.description || data.description.trim().length < 10) {
    errors.push('Descrição deve ter pelo menos 10 caracteres');
  }
  
  if (!data.location?.latitude || !data.location?.longitude) {
    errors.push('Localização é obrigatória');
  }
  
  if (!data.severity) {
    errors.push('Selecione a severidade do incidente');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Obter status de relatório específico
 */
export const getReportStatus = async (reportId: string): Promise<Report | null> => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    
    const reportDoc = await getDoc(doc(db, 'reports', reportId));
    
    if (reportDoc.exists()) {
      return { id: reportDoc.id, ...reportDoc.data() } as Report;
    }
    
    return null;
  } catch (error: any) {
    console.error('Erro ao obter status do relatório:', error);
    throw new Error(error.message ?? 'Erro ao obter status do relatório');
  }
};

/**
 * Obter relatórios do usuário atual
 */
export const getUserReports = async (): Promise<Report[]> => {
  try {
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    const { getCurrentUser } = await import('./authService');
    
    const user = await getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    const q = query(
      collection(db, 'reports'),
      where('uid', '==', user.uid),
      orderBy('submittedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Report);
  } catch (error: any) {
    console.error('Erro ao obter relatórios do usuário:', error);
    throw new Error(error.message ?? 'Erro ao obter relatórios do usuário');
  }
};

/**
 * Obter tipos de incidentes disponíveis
 */
export const getIncidentTypes = (): { value: string; label: string; icon?: string }[] => {
  return [
    { value: 'incendio', label: 'Incêndio', icon: '🔥' },
    { value: 'enchente', label: 'Enchente', icon: '🌊' },
    { value: 'deslizamento', label: 'Deslizamento', icon: '⛰️' },
    { value: 'tempestade', label: 'Tempestade', icon: '⛈️' },
    { value: 'acidente', label: 'Acidente', icon: '🚨' },
    { value: 'poluicao', label: 'Poluição', icon: '☠️' },
    { value: 'desmatamento', label: 'Desmatamento', icon: '🌳' },
    { value: 'animal_ferido', label: 'Animal Ferido', icon: '🐾' },
    { value: 'outros', label: 'Outros', icon: '❓' }
  ];
};

/**
 * Obter níveis de severidade
 */
export const getSeverityLevels = (): { value: string; label: string; color: string }[] => {
  return [
    { value: 'baixa', label: 'Baixa', color: 'green' },
    { value: 'media', label: 'Média', color: 'yellow' },
    { value: 'alta', label: 'Alta', color: 'orange' },
    { value: 'critica', label: 'Crítica', color: 'red' }
  ];
};
