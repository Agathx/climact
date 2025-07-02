import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  getDocs,
  doc,
  getDoc,
  GeoPoint,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MapItem } from '@/components/interactive-map';

export interface PublicIncident {
  id: string;
  title: string;
  description: string;
  type: 'incident' | 'alert' | 'shelter';
  severity: 'Low' | 'Medium' | 'High';
  status: 'active' | 'resolved' | 'investigating';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  source: 'user_report' | 'official_alert' | 'cemaden' | 'system';
  sourceId?: string; // ID do relatório/alerta original
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: Record<string, any>;
}

export interface Shelter {
  id: string;
  name: string;
  type: 'emergency' | 'temporary' | 'permanent';
  status: 'active' | 'inactive' | 'full';
  capacity: number;
  available_spots: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  contact?: {
    phone?: string;
    email?: string;
  };
  facilities: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GetIncidentsFilters {
  location?: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // em km
  types?: ('incident' | 'alert' | 'shelter')[];
  status?: string[];
  limit?: number;
}

/**
 * Busca incidentes públicos para exibição no mapa
 */
export const getPublicIncidents = async (filters: GetIncidentsFilters = {}): Promise<MapItem[]> => {
  try {
    const items: MapItem[] = [];
    
    // Buscar incidentes ativos
    if (!filters.types || filters.types.includes('incident') || filters.types.includes('alert')) {
      const incidentsQuery = query(
        collection(db, 'incidents'),
        where('status', 'in', filters.status || ['active', 'investigating']),
        orderBy('createdAt', 'desc'),
        firestoreLimit(filters.limit || 50)
      );
      
      const incidentsSnapshot = await getDocs(incidentsQuery);
      
      incidentsSnapshot.docs.forEach(doc => {
        const data = doc.data() as PublicIncident;
        
        // Filtrar por localização se especificado
        if (filters.location && filters.radius) {
          const distance = calculateDistance(
            filters.location.latitude,
            filters.location.longitude,
            data.location.latitude,
            data.location.longitude
          );
          
          if (distance > filters.radius) return;
        }
        
        items.push({
          id: doc.id,
          type: data.type === 'alert' ? 'alert' : 'report',
          title: data.title,
          description: data.description,
          position: {
            lat: data.location.latitude,
            lng: data.location.longitude
          },
          criticality: data.severity,
          source: data.source,
          status: data.status === 'active' ? 'validated' : 'pending'
        });
      });
    }
    
    // Buscar abrigos ativos
    if (!filters.types || filters.types.includes('shelter')) {
      const sheltersQuery = query(
        collection(db, 'shelters'),
        where('status', 'in', ['active', 'full']),
        orderBy('name', 'asc'),
        firestoreLimit(filters.limit || 20)
      );
      
      const sheltersSnapshot = await getDocs(sheltersQuery);
      
      sheltersSnapshot.docs.forEach(doc => {
        const data = doc.data() as Shelter;
        
        // Filtrar por localização se especificado
        if (filters.location && filters.radius) {
          const distance = calculateDistance(
            filters.location.latitude,
            filters.location.longitude,
            data.location.latitude,
            data.location.longitude
          );
          
          if (distance > filters.radius) return;
        }
        
        items.push({
          id: doc.id,
          type: 'shelter',
          title: data.name,
          description: `Capacidade: ${data.capacity} pessoas. ${
            data.available_spots > 0 
              ? `${data.available_spots} vagas disponíveis` 
              : 'Lotado'
          }.`,
          position: {
            lat: data.location.latitude,
            lng: data.location.longitude
          }
        });
      });
    }
    
    return items;
  } catch (error: any) {
    console.error('Erro ao buscar incidentes públicos:', error);
    throw new Error(error.message || 'Erro ao buscar incidentes');
  }
};

/**
 * Busca alertas oficiais ativos
 */
export const getOfficialAlerts = async (): Promise<MapItem[]> => {
  try {
    const alertsQuery = query(
      collection(db, 'official_alerts'),
      where('status', '==', 'active'),
      where('expiresAt', '>', Timestamp.now()),
      orderBy('expiresAt', 'asc'),
      firestoreLimit(20)
    );
    
    const alertsSnapshot = await getDocs(alertsQuery);
    
    return alertsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'alert' as const,
        title: data.title,
        description: data.description,
        position: {
          lat: data.location.latitude,
          lng: data.location.longitude
        },
        criticality: data.severity || 'Medium',
        source: 'Defesa Civil'
      };
    });
  } catch (error: any) {
    console.error('Erro ao buscar alertas oficiais:', error);
    return [];
  }
};

/**
 * Calcula distância entre duas coordenadas em km
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Cria um incidente público a partir de um relatório aprovado
 */
export const createPublicIncidentFromReport = async (reportId: string): Promise<string | null> => {
  try {
    const { doc: docRef, getDoc, addDoc, collection, Timestamp } = await import('firebase/firestore');
    
    // Buscar o relatório original
    const reportDoc = await getDoc(docRef(db, 'reports', reportId));
    
    if (!reportDoc.exists()) {
      throw new Error('Relatório não encontrado');
    }
    
    const reportData = reportDoc.data();
    
    // Criar incidente público
    const incidentData: Omit<PublicIncident, 'id'> = {
      title: reportData.title || `Incidente ${reportData.incidentType}`,
      description: reportData.description,
      type: 'incident',
      severity: reportData.severity === 'critica' ? 'High' :
               reportData.severity === 'alta' ? 'High' :
               reportData.severity === 'media' ? 'Medium' : 'Low',
      status: 'active',
      location: {
        latitude: reportData.location.latitude,
        longitude: reportData.location.longitude,
        address: reportData.location.address
      },
      source: 'user_report',
      sourceId: reportId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      metadata: {
        originalReport: reportId,
        incidentType: reportData.incidentType
      }
    };
    
    const docRef2 = await addDoc(collection(db, 'incidents'), incidentData);
    return docRef2.id;
  } catch (error: any) {
    console.error('Erro ao criar incidente público:', error);
    return null;
  }
};

export default {
  getPublicIncidents,
  getOfficialAlerts,
  createPublicIncidentFromReport
};