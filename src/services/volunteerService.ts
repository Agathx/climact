import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';

export interface Volunteer {
  id: string;
  name: string;
  role: string;
  location: string;
  skills: string[];
  rating: number;
  completedActivities: number;
  joinedDate: string;
  status: 'online' | 'busy' | 'offline';
  bio: string;
  isConnected: boolean;
  photoURL?: string;
}

export interface VolunteerGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  isPublic: boolean;
  recentActivity: string;
}

/**
 * Obtém lista de voluntários
 */
export const getVolunteers = async (): Promise<Volunteer[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(
      usersCollection, 
      where('role', '==', 'voluntario'),
      where('isApproved', '==', true),
      orderBy('displayName')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || data.name || 'Voluntário',
        role: getVolunteerRole(data.completedActivities || 0),
        location: data.address || data.city || 'Não informado',
        skills: data.skills || ['Voluntariado Geral'],
        rating: data.rating || 4.5,
        completedActivities: data.completedActivities || 0,
        joinedDate: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        status: getVolunteerStatus(),
        bio: data.bio || 'Voluntário engajado em causas ambientais.',
        isConnected: false,
        photoURL: data.photoURL
      } as Volunteer;
    });
  } catch (error: any) {
    console.error('Erro ao carregar voluntários:', error);
    return [];
  }
};

/**
 * Obtém grupos de voluntários
 */
export const getVolunteerGroups = async (): Promise<VolunteerGroup[]> => {
  try {
    const groupsCollection = collection(db, 'volunteerGroups');
    const q = query(groupsCollection, orderBy('memberCount', 'desc'));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return getDefaultVolunteerGroups();
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VolunteerGroup));
  } catch (error: any) {
    console.error('Erro ao carregar grupos de voluntários:', error);
    return getDefaultVolunteerGroups();
  }
};

/**
 * Obtém dados de um voluntário específico
 */
export const getVolunteerById = async (volunteerId: string): Promise<Volunteer | null> => {
  try {
    const volunteerDoc = await getDoc(doc(db, 'users', volunteerId));
    
    if (!volunteerDoc.exists()) {
      return null;
    }
    
    const data = volunteerDoc.data();
    
    return {
      id: volunteerDoc.id,
      name: data.displayName || data.name || 'Voluntário',
      role: getVolunteerRole(data.completedActivities || 0),
      location: data.address || data.city || 'Não informado',
      skills: data.skills || ['Voluntariado Geral'],
      rating: data.rating || 4.5,
      completedActivities: data.completedActivities || 0,
      joinedDate: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      status: getVolunteerStatus(),
      bio: data.bio || 'Voluntário engajado em causas ambientais.',
      isConnected: false,
      photoURL: data.photoURL
    };
  } catch (error: any) {
    console.error('Erro ao carregar voluntário:', error);
    return null;
  }
};

/**
 * Obtém voluntários por habilidade
 */
export const getVolunteersBySkill = async (skill: string): Promise<Volunteer[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(
      usersCollection,
      where('role', '==', 'voluntario'),
      where('skills', 'array-contains', skill)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || data.name || 'Voluntário',
        role: getVolunteerRole(data.completedActivities || 0),
        location: data.address || data.city || 'Não informado',
        skills: data.skills || [],
        rating: data.rating || 4.5,
        completedActivities: data.completedActivities || 0,
        joinedDate: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        status: getVolunteerStatus(),
        bio: data.bio || 'Voluntário especializado.',
        isConnected: false,
        photoURL: data.photoURL
      } as Volunteer;
    });
  } catch (error: any) {
    console.error('Erro ao buscar voluntários por habilidade:', error);
    return [];
  }
};

/**
 * Funções auxiliares
 */
const getVolunteerRole = (completedActivities: number): string => {
  if (completedActivities >= 50) return 'Voluntário Ouro';
  if (completedActivities >= 20) return 'Voluntário Prata';
  return 'Voluntário Bronze';
};

const getVolunteerStatus = (): 'online' | 'busy' | 'offline' => {
  const statuses: ('online' | 'busy' | 'offline')[] = ['online', 'busy', 'offline'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const getDefaultVolunteerGroups = (): VolunteerGroup[] => {
  return [
    {
      id: 'default-emergency',
      name: 'Resposta Rápida',
      description: 'Grupo especializado em resposta a emergências climáticas',
      memberCount: 15,
      category: 'Emergência',
      isPublic: true,
      recentActivity: 'há 2 horas'
    },
    {
      id: 'default-education',
      name: 'Educadores Ambientais',
      description: 'Voluntários focados em educação e conscientização ambiental',
      memberCount: 12,
      category: 'Educação',
      isPublic: true,
      recentActivity: 'há 1 dia'
    },
    {
      id: 'default-action',
      name: 'Ação Direta',
      description: 'Ações práticas de preservação ambiental',
      memberCount: 8,
      category: 'Ação Direta',
      isPublic: false,
      recentActivity: 'há 3 horas'
    }
  ];
};
