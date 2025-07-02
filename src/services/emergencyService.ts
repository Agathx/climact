import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export interface EmergencyContact {
  id: string;
  name: string;
  type: 'fire' | 'police' | 'medical' | 'civil_defense' | 'environmental' | 'general';
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city: string;
  state: string;
  region: string;
  available24h: boolean;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Obtém lista de contatos de emergência
 */
export const getEmergencyContacts = async (): Promise<EmergencyContact[]> => {
  try {
    const contactsCollection = collection(db, 'emergencyContacts');
    const q = query(contactsCollection, orderBy('priority', 'desc'), orderBy('name', 'asc'));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Retorna contatos nacionais básicos se não houver dados no Firebase
      return getDefaultEmergencyContacts();
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EmergencyContact));
  } catch (error: any) {
    console.error('Erro ao carregar contatos de emergência:', error);
    // Em caso de erro, retorna contatos básicos
    return getDefaultEmergencyContacts();
  }
};

/**
 * Obtém contatos por região
 */
export const getEmergencyContactsByRegion = async (region: string): Promise<EmergencyContact[]> => {
  try {
    const contactsCollection = collection(db, 'emergencyContacts');
    const q = query(
      contactsCollection, 
      where('region', '==', region),
      orderBy('priority', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EmergencyContact));
  } catch (error: any) {
    console.error('Erro ao carregar contatos por região:', error);
    throw new Error(error.message ?? 'Erro ao carregar contatos');
  }
};

/**
 * Obtém contatos por tipo
 */
export const getEmergencyContactsByType = async (type: string): Promise<EmergencyContact[]> => {
  try {
    const contactsCollection = collection(db, 'emergencyContacts');
    const q = query(
      contactsCollection, 
      where('type', '==', type),
      orderBy('priority', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EmergencyContact));
  } catch (error: any) {
    console.error('Erro ao carregar contatos por tipo:', error);
    throw new Error(error.message ?? 'Erro ao carregar contatos');
  }
};

/**
 * Contatos de emergência padrão (nacionais)
 */
const getDefaultEmergencyContacts = (): EmergencyContact[] => {
  return [
    {
      id: 'default-bombeiros',
      name: 'Bombeiros',
      type: 'fire',
      phone: '193',
      city: 'Nacional',
      state: 'BR',
      region: 'Nacional',
      available24h: true,
      description: 'Emergências de incêndio, resgate e primeiros socorros',
      priority: 'high'
    },
    {
      id: 'default-samu',
      name: 'SAMU - Serviço de Atendimento Móvel de Urgência',
      type: 'medical',
      phone: '192',
      city: 'Nacional',
      state: 'BR',
      region: 'Nacional',
      available24h: true,
      description: 'Atendimento médico de urgência e emergência',
      priority: 'high'
    },
    {
      id: 'default-policia',
      name: 'Polícia Militar',
      type: 'police',
      phone: '190',
      city: 'Nacional',
      state: 'BR',
      region: 'Nacional',
      available24h: true,
      description: 'Emergências policiais e segurança pública',
      priority: 'high'
    },
    {
      id: 'default-defesa-civil',
      name: 'Defesa Civil',
      type: 'civil_defense',
      phone: '199',
      city: 'Nacional',
      state: 'BR',
      region: 'Nacional',
      available24h: true,
      description: 'Emergências relacionadas a desastres naturais',
      priority: 'high'
    },
    {
      id: 'default-cvv',
      name: 'CVV - Centro de Valorização da Vida',
      type: 'general',
      phone: '188',
      city: 'Nacional',
      state: 'BR',
      region: 'Nacional',
      available24h: true,
      description: 'Apoio emocional e prevenção ao suicídio',
      priority: 'medium'
    }
  ];
};
