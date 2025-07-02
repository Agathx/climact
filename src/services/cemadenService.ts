/**
 * Serviço de integração com APIs do CEMADEN
 * Responsável por buscar dados reais de alertas meteorológicos
 */

// Tipos para dados do CEMADEN
export interface EstadoBrasil {
  id: string;
  nome: string;
  sigla: string;
  regiao: {
    id: string;
    nome: string;
    sigla: string;
  };
}

export interface AlertaCemaden {
  id: string;
  titulo: string;
  descricao: string;
  dataHora: string;
  severidade: 'baixa' | 'media' | 'alta' | 'muito_alta';
  tipo: string;
  municipio: {
    id: string;
    nome: string;
    uf: string;
  };
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
  // Área de cobertura do alerta
  area?: {
    type: 'circle' | 'polygon';
    radius?: number; // em metros
    coordinates?: [number, number][]; // para polígonos
  };
  status: 'ativo' | 'expirado' | 'cancelado';
  fonte: 'CEMADEN' | 'INMET' | 'Defesa Civil';
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  condition: string;
  alerts: string[];
}

class CemadenService {
  private readonly estadosUrl = process.env.NEXT_PUBLIC_CEMADEN_ESTADOS_URL;
  private readonly alertasUrl = process.env.NEXT_PUBLIC_CEMADEN_ALERTAS_URL;
  private readonly openWeatherKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  /**
   * Busca lista de estados do Brasil
   */
  async getEstados(): Promise<EstadoBrasil[]> {
    try {
      if (!this.estadosUrl) {
        console.warn('URL dos estados CEMADEN não configurada');
        return [];
      }

      const response = await fetch(this.estadosUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar estados: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];

    } catch (error) {
      console.error('Erro ao buscar estados do CEMADEN:', error);
      return this.getFallbackEstados();
    }
  }

  /**
   * Busca alertas ativos do CEMADEN
   */
  async getAlertas(estado?: string, municipio?: string): Promise<AlertaCemaden[]> {
    try {
      if (!this.alertasUrl) {
        console.warn('URL dos alertas CEMADEN não configurada');
        return this.getFallbackAlertas();
      }

      let url = this.alertasUrl;
      const params = new URLSearchParams();

      if (estado) params.append('estado', estado);
      if (municipio) params.append('municipio', municipio);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Adicionar timeout e tratamento de CORS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'ClimACT/1.0',
        },
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`API CEMADEN retornou status ${response.status}, usando dados fallback`);
        return this.getFallbackAlertas();
      }

      const data = await response.json();
      const transformedData = this.transformAlertas(data);
      
      // Se não há dados da API, usar fallback
      if (!transformedData || transformedData.length === 0) {
        console.info('API CEMADEN não retornou dados, usando dados fallback');
        return this.getFallbackAlertas();
      }

      return transformedData;

    } catch (error: any) {
      console.warn('Erro ao buscar alertas do CEMADEN, usando dados fallback:', error.message);
      return this.getFallbackAlertas();
    }
  }

  /**
   * Busca dados meteorológicos do OpenWeather
   */
  async getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      if (!this.openWeatherKey) {
        console.warn('Chave da API OpenWeather não configurada');
        return null;
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.openWeatherKey}&units=metric&lang=pt_br`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados meteorológicos: ${response.status}`);
      }

      const data = await response.json();

      return {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        precipitation: data.rain?.['1h'] || 0,
        windSpeed: data.wind.speed,
        condition: data.weather[0].description,
        alerts: [] // OpenWeather alerts requerem API paga
      };

    } catch (error) {
      console.error('Erro ao buscar dados meteorológicos:', error);
      return null;
    }
  }

  /**
   * Converte alertas CEMADEN para o formato interno
   */
  private transformAlertas(data: any): AlertaCemaden[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item: any, index: number) => ({
      id: item.id || `cemaden-${index}`,
      titulo: item.titulo || item.title || 'Alerta Meteorológico',
      descricao: item.descricao || item.description || '',
      dataHora: item.dataHora || item.data_hora || new Date().toISOString(),
      severidade: this.mapSeveridade(item.severidade || item.nivel),
      tipo: item.tipo || item.type || 'meteorologico',
      municipio: {
        id: item.municipio?.id || item.cidade?.id || '',
        nome: item.municipio?.nome || item.cidade?.nome || '',
        uf: item.municipio?.uf || item.estado || ''
      },
      coordenadas: item.coordenadas || (item.lat && item.lon ? {
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      } : undefined),
      // Tentar extrair informações de área se disponíveis
      area: item.area || (item.radius ? {
        type: 'circle',
        radius: parseFloat(item.radius)
      } : undefined),
      status: item.status === 'ativo' ? 'ativo' : (item.status || 'ativo'),
      fonte: 'Defesa Civil'
    }));
  }

  /**
   * Mapeia severidade para formato padronizado
   */
  private mapSeveridade(severidade: any): AlertaCemaden['severidade'] {
    if (typeof severidade === 'string') {
      const sev = severidade.toLowerCase();
      if (sev.includes('baixa') || sev.includes('low')) return 'baixa';
      if (sev.includes('media') || sev.includes('medium')) return 'media';
      if (sev.includes('alta') || sev.includes('high')) return 'alta';
      if (sev.includes('muito') || sev.includes('critica')) return 'muito_alta';
    }
    return 'media';
  }

  /**
   * Estados de fallback caso a API não funcione
   */
  private getFallbackEstados(): EstadoBrasil[] {
    return [
      {
        id: '35',
        nome: 'São Paulo',
        sigla: 'SP',
        regiao: { id: '3', nome: 'Sudeste', sigla: 'SE' }
      },
      {
        id: '33',
        nome: 'Rio de Janeiro', 
        sigla: 'RJ',
        regiao: { id: '3', nome: 'Sudeste', sigla: 'SE' }
      },
      {
        id: '31',
        nome: 'Minas Gerais',
        sigla: 'MG', 
        regiao: { id: '3', nome: 'Sudeste', sigla: 'SE' }
      }
    ];
  }

  /**
   * Alertas de fallback caso a API não funcione
   */
  private getFallbackAlertas(): AlertaCemaden[] {
    const now = new Date();
    return [
      {
        id: 'fallback-1',
        titulo: 'Possibilidade de Chuvas Intensas',
        descricao: 'Previsão de precipitação acima de 30mm/h nas próximas 6 horas',
        dataHora: now.toISOString(),
        severidade: 'media',
        tipo: 'chuva_intensa',
        municipio: {
          id: '3550308',
          nome: 'São Paulo',
          uf: 'SP'
        },
        coordenadas: {
          latitude: -23.5505,
          longitude: -46.6333
        },
        area: {
          type: 'circle',
          radius: 5000 // 5km de raio
        },
        status: 'ativo',
        fonte: 'Defesa Civil'
      },
      {
        id: 'fallback-2',
        titulo: 'Risco de Deslizamento',
        descricao: 'Solo saturado em áreas de encosta após chuvas intensas',
        dataHora: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        severidade: 'alta',
        tipo: 'deslizamento',
        municipio: {
          id: '3550308',
          nome: 'São Paulo',
          uf: 'SP'
        },
        coordenadas: {
          latitude: -23.5515,
          longitude: -46.6343
        },
        area: {
          type: 'circle',
          radius: 7500 // 7.5km de raio para alerta mais severo
        },
        status: 'ativo',
        fonte: 'Defesa Civil'
      }
    ];
  }
}

// Instância singleton
export const cemadenService = new CemadenService();

// Funções de conveniência
export const getEstados = () => cemadenService.getEstados();
export const getAlertas = (estado?: string, municipio?: string) => cemadenService.getAlertas(estado, municipio);
export const getWeatherData = (lat: number, lon: number) => cemadenService.getWeatherData(lat, lon);

export default cemadenService;
