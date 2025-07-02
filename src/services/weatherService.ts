interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

interface ForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level: number;
      grnd_level: number;
      humidity: number;
      temp_kf: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number; // Probability of precipitation
    rain?: {
      '3h': number;
    };
    sys: {
      pod: string;
    };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

export interface ProcessedWeatherData {
  location: {
    name: string;
    coordinates: [number, number];
    country: string;
  };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    cloudCover: number;
    condition: string;
    description: string;
    icon: string;
    uvIndex?: number;
  };
  alerts: WeatherAlert[];
  forecast: WeatherForecast[];
  lastUpdated: Date;
}

export interface WeatherAlert {
  id: string;
  type: 'rain' | 'storm' | 'heat' | 'cold' | 'wind' | 'fog';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  affectedAreas: string[];
}

export interface WeatherForecast {
  datetime: Date;
  temperature: {
    min: number;
    max: number;
    current: number;
  };
  humidity: number;
  windSpeed: number;
  precipitation: {
    probability: number;
    amount?: number;
  };
  condition: string;
  description: string;
  icon: string;
}

class WeatherService {
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  constructor() {
    if (!this.apiKey) {
      console.warn('OpenWeather API key não configurada. Os dados meteorológicos não funcionarão.');
    }
  }

  // Converter temperatura de Kelvin para Celsius
  private kelvinToCelsius(kelvin: number): number {
    return Math.round(kelvin - 273.15);
  }

  // Converter velocidade do vento de m/s para km/h
  private msToKmh(ms: number): number {
    return Math.round(ms * 3.6);
  }

  // Traduzir condições climáticas para português
  private translateCondition(condition: string, description: string): { condition: string; description: string } {
    const translations: Record<string, { condition: string; description: string }> = {
      'clear sky': { condition: 'Céu limpo', description: 'Céu completamente limpo' },
      'few clouds': { condition: 'Poucas nuvens', description: 'Algumas nuvens esparsas' },
      'scattered clouds': { condition: 'Nuvens dispersas', description: 'Nuvens espalhadas' },
      'broken clouds': { condition: 'Nublado', description: 'Muitas nuvens' },
      'overcast clouds': { condition: 'Encoberto', description: 'Céu totalmente nublado' },
      'light rain': { condition: 'Chuva fraca', description: 'Chuva leve' },
      'moderate rain': { condition: 'Chuva moderada', description: 'Chuva de intensidade moderada' },
      'heavy intensity rain': { condition: 'Chuva forte', description: 'Chuva intensa' },
      'very heavy rain': { condition: 'Chuva muito forte', description: 'Chuva muito intensa' },
      'extreme rain': { condition: 'Chuva extrema', description: 'Chuva de intensidade extrema' },
      'thunderstorm': { condition: 'Tempestade', description: 'Tempestade com raios' },
      'snow': { condition: 'Neve', description: 'Precipitação de neve' },
      'mist': { condition: 'Neblina', description: 'Visibilidade reduzida por neblina' },
      'fog': { condition: 'Neblina densa', description: 'Visibilidade muito reduzida' },
      'haze': { condition: 'Névoa seca', description: 'Atmosfera embaçada' }
    };

    const key = description.toLowerCase();
    return translations[key] || { condition: condition, description: description };
  }

  // Determinar alertas baseados nas condições
  private generateWeatherAlerts(data: OpenWeatherResponse, forecast?: ForecastResponse): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const now = new Date();

    // Alerta de chuva forte
    if (data.rain && data.rain['1h'] && data.rain['1h'] > 10) {
      alerts.push({
        id: `rain-${Date.now()}`,
        type: 'rain',
        severity: data.rain['1h'] > 25 ? 'high' : 'medium',
        title: 'Alerta de Chuva Forte',
        description: `Chuva intensa detectada: ${data.rain['1h']}mm na última hora`,
        startTime: now,
        endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 horas
        affectedAreas: [data.name]
      });
    }

    // Alerta de vento forte
    if (data.wind.speed > 15) { // > 54 km/h
      alerts.push({
        id: `wind-${Date.now()}`,
        type: 'wind',
        severity: data.wind.speed > 25 ? 'high' : 'medium',
        title: 'Alerta de Vento Forte',
        description: `Ventos fortes detectados: ${this.msToKmh(data.wind.speed)} km/h`,
        startTime: now,
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 horas
        affectedAreas: [data.name]
      });
    }

    // Alerta de temperatura extrema
    const tempC = this.kelvinToCelsius(data.main.temp);
    if (tempC > 35) {
      alerts.push({
        id: `heat-${Date.now()}`,
        type: 'heat',
        severity: tempC > 40 ? 'high' : 'medium',
        title: 'Alerta de Calor Extremo',
        description: `Temperatura muito alta: ${tempC}°C`,
        startTime: now,
        endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 horas
        affectedAreas: [data.name]
      });
    }

    // Alerta de tempestade
    if (data.weather.some(w => w.main.toLowerCase().includes('thunderstorm'))) {
      alerts.push({
        id: `storm-${Date.now()}`,
        type: 'storm',
        severity: 'high',
        title: 'Alerta de Tempestade',
        description: 'Tempestade com raios detectada na região',
        startTime: now,
        endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 horas
        affectedAreas: [data.name]
      });
    }

    return alerts;
  }

  // Processar previsão do tempo
  private processForecast(forecast: ForecastResponse): WeatherForecast[] {
    return forecast.list.slice(0, 8).map(item => { // Próximas 24 horas (3h intervals)
      const translated = this.translateCondition(item.weather[0].main, item.weather[0].description);
      
      return {
        datetime: new Date(item.dt * 1000),
        temperature: {
          min: this.kelvinToCelsius(item.main.temp_min),
          max: this.kelvinToCelsius(item.main.temp_max),
          current: this.kelvinToCelsius(item.main.temp)
        },
        humidity: item.main.humidity,
        windSpeed: this.msToKmh(item.wind.speed),
        precipitation: {
          probability: Math.round(item.pop * 100),
          amount: item.rain?.['3h']
        },
        condition: translated.condition,
        description: translated.description,
        icon: item.weather[0].icon
      };
    });
  }

  async getCurrentWeather(lat: number, lon: number): Promise<ProcessedWeatherData | null> {
    if (!this.apiKey) {
      console.warn('API key não configurada, usando dados de exemplo');
      return this.getFallbackWeatherData();
    }

    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(`${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&lang=pt_br`),
        fetch(`${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&lang=pt_br`)
      ]);

      // Verificar erros específicos da API
      if (!currentResponse.ok) {
        if (currentResponse.status === 401) {
          console.error('🔑 API key inválida ou não ativada. Verificações:');
          console.error('   - A chave está correta?');
          console.error('   - A chave foi ativada? (pode levar algumas horas)');
          console.error('   - Você está usando a chave certa da sua conta OpenWeather?');
          throw new Error('API key inválida ou não ativada. Verifique sua chave da OpenWeather.');
        }
        if (currentResponse.status === 429) {
          console.error('⚠️ Limite de requisições excedido (60 por minuto no plano gratuito)');
          throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }
        if (currentResponse.status === 404) {
          throw new Error('Localização não encontrada.');
        }
        throw new Error(`Erro na API OpenWeather: ${currentResponse.status} - ${currentResponse.statusText}`);
      }

      if (!forecastResponse.ok) {
        console.warn('Erro ao buscar previsão, usando apenas dados atuais');
      }

      const currentData: OpenWeatherResponse = await currentResponse.json();
      const forecastData: ForecastResponse | null = forecastResponse.ok ? 
        await forecastResponse.json() : null;

      const translated = this.translateCondition(currentData.weather[0].main, currentData.weather[0].description);

      return {
        location: {
          name: currentData.name,
          coordinates: [currentData.coord.lat, currentData.coord.lon],
          country: currentData.sys.country
        },
        current: {
          temperature: this.kelvinToCelsius(currentData.main.temp),
          feelsLike: this.kelvinToCelsius(currentData.main.feels_like),
          humidity: currentData.main.humidity,
          pressure: currentData.main.pressure,
          windSpeed: this.msToKmh(currentData.wind.speed),
          windDirection: currentData.wind.deg,
          visibility: Math.round(currentData.visibility / 1000), // Convert to km
          cloudCover: currentData.clouds.all,
          condition: translated.condition,
          description: translated.description,
          icon: currentData.weather[0].icon
        },
        alerts: this.generateWeatherAlerts(currentData, forecastData || undefined),
        forecast: forecastData ? this.processForecast(forecastData) : [],
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('❌ Erro ao buscar dados meteorológicos:', error);
      
      // Se for erro de configuração, usar dados de exemplo
      if (error instanceof Error && error.message.includes('API key')) {
        console.warn('🔄 Usando dados de exemplo devido a problema com API key');
        return this.getFallbackWeatherData();
      }
      
      // Para outros erros, propagar
      throw error;
    }
  }

  async getWeatherByCity(cityName: string): Promise<ProcessedWeatherData | null> {
    if (!this.apiKey) {
      return this.getFallbackWeatherData();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&lang=pt_br`
      );

      if (!response.ok) {
        throw new Error('Cidade não encontrada');
      }

      const data: OpenWeatherResponse = await response.json();
      return this.getCurrentWeather(data.coord.lat, data.coord.lon);

    } catch (error) {
      console.error('Erro ao buscar dados por cidade:', error);
      return this.getFallbackWeatherData();
    }
  }

  // Buscar múltiplas cidades (para dashboard regional)
  async getMultipleCitiesWeather(cities: string[]): Promise<ProcessedWeatherData[]> {
    const weatherPromises = cities.map(city => this.getWeatherByCity(city));
    const results = await Promise.allSettled(weatherPromises);
    
    return results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<ProcessedWeatherData>).value);
  }

  // Dados de fallback quando API não está disponível
  private getFallbackWeatherData(): ProcessedWeatherData {
    return {
      location: {
        name: 'São Paulo',
        coordinates: [-23.5505, -46.6333],
        country: 'BR'
      },
      current: {
        temperature: 24,
        feelsLike: 27,
        humidity: 65,
        pressure: 1013,
        windSpeed: 12,
        windDirection: 180,
        visibility: 10,
        cloudCover: 40,
        condition: 'Parcialmente nublado',
        description: 'Algumas nuvens com sol',
        icon: '02d'
      },
      alerts: [],
      forecast: [],
      lastUpdated: new Date()
    };
  }

  // Analisar condições para riscos climáticos
  async analyzeClimateRisks(lat: number, lon: number): Promise<{
    floodRisk: number;
    stormRisk: number;
    heatRisk: number;
    overallRisk: number;
    recommendations: string[];
  }> {
    const weather = await this.getCurrentWeather(lat, lon);
    
    if (!weather) {
      return {
        floodRisk: 0,
        stormRisk: 0,
        heatRisk: 0,
        overallRisk: 0,
        recommendations: ['Dados meteorológicos indisponíveis']
      };
    }

    let floodRisk = 0;
    let stormRisk = 0;
    let heatRisk = 0;
    const recommendations: string[] = [];

    // Analisar risco de enchente
    if (weather.current.humidity > 80) floodRisk += 2;
    if (weather.current.pressure < 1000) floodRisk += 2;
    if (weather.forecast.some(f => f.precipitation.probability > 70)) floodRisk += 3;

    // Analisar risco de tempestade
    if (weather.current.windSpeed > 50) stormRisk += 3;
    if (weather.current.pressure < 995) stormRisk += 2;
    if (weather.alerts.some(a => a.type === 'storm')) stormRisk += 4;

    // Analisar risco de calor extremo
    if (weather.current.temperature > 32) heatRisk += 2;
    if (weather.current.temperature > 38) heatRisk += 3;
    if (weather.current.humidity < 30) heatRisk += 1;

    // Gerar recomendações
    if (floodRisk > 5) {
      recommendations.push('Alto risco de alagamento - evite áreas baixas');
    }
    if (stormRisk > 5) {
      recommendations.push('Risco de tempestade - busque abrigo seguro');
    }
    if (heatRisk > 4) {
      recommendations.push('Calor extremo - mantenha-se hidratado e evite exposição solar');
    }

    const overallRisk = Math.max(floodRisk, stormRisk, heatRisk);

    return {
      floodRisk: Math.min(floodRisk, 10),
      stormRisk: Math.min(stormRisk, 10),
      heatRisk: Math.min(heatRisk, 10),
      overallRisk: Math.min(overallRisk, 10),
      recommendations: recommendations.length > 0 ? recommendations : ['Condições meteorológicas normais']
    };
  }
}

export const weatherService = new WeatherService();
