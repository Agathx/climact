/**
 * Serviço para buscar notícias usando a API GNews
 * 
 * GNews oferece:
 * - 100 requisições gratuitas por dia
 * - Artigos de qualidade de publishers verificados
 * - Suporte a múltiplos idiomas
 * - Filtragem por país, categoria e palavras-chave
 * 
 * Documentação: https://gnews.io/docs/v4
 */

export interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

export interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

export interface ProcessedGNewsArticle {
  title: string;
  summary: string;
  content?: string;
  url: string;
  imageUrl?: string;
  date: string;
  source: string;
  urgent: boolean;
  category: 'climate' | 'environment' | 'disaster' | 'news';
}

class GNewsService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GNEWS_API_KEY || '';
    this.baseUrl = process.env.NEXT_PUBLIC_GNEWS_API_URL || 'https://gnews.io/api/v4';
  }

  private isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'sua_chave_gnews_aqui';
  }

  /**
   * Busca notícias relacionadas ao clima e meio ambiente
   */
  async getClimateNews(limit: number = 10): Promise<ProcessedGNewsArticle[]> {
    if (!this.isConfigured()) {
      return this.getFallbackNews();
    }

    try {
      // Termos de busca relacionados ao clima em português
      const climateTerms = [
        'mudanças climáticas',
        'aquecimento global',
        'sustentabilidade',
        'meio ambiente',
        'desmatamento',
        'energias renováveis',
        'poluição',
        'enchente',
        'seca',
        'tempestade'
      ].join(' OR ');

      const params = new URLSearchParams({
        q: climateTerms,
        lang: 'pt',
        country: 'br',
        max: limit.toString(),
        sortby: 'publishedAt',
        token: this.apiKey
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`GNews API error: ${response.status} ${response.statusText}`);
      }

      const data: GNewsResponse = await response.json();
      return this.processArticles(data.articles);

    } catch (error) {
      console.error('Erro ao buscar notícias do GNews:', error);
      
      // Fallback para NewsAPI se GNews falhar
      if (process.env.NEXT_PUBLIC_NEWS_API_KEY) {
        return this.getFallbackFromNewsAPI(limit);
      }
      
      return this.getFallbackNews();
    }
  }

  /**
   * Processa os artigos da API para o formato usado na aplicação
   */
  private processArticles(articles: GNewsArticle[]): ProcessedGNewsArticle[] {
    return articles.map(article => {
      const title = article.title;
      const lowerTitle = title.toLowerCase();
      
      // Determina se é urgente baseado em palavras-chave
      const urgentKeywords = [
        'emergência', 'alerta', 'urgente', 'desastre', 'catástrofe',
        'evacuação', 'socorro', 'extremo', 'crítico', 'grave'
      ];
      const urgent = urgentKeywords.some(keyword => lowerTitle.includes(keyword));

      // Determina a categoria
      let category: ProcessedGNewsArticle['category'] = 'news';
      if (lowerTitle.includes('clima') || lowerTitle.includes('aquecimento')) {
        category = 'climate';
      } else if (lowerTitle.includes('ambiente') || lowerTitle.includes('sustentabilidade')) {
        category = 'environment';
      } else if (lowerTitle.includes('enchente') || lowerTitle.includes('desastre') || lowerTitle.includes('tempestade')) {
        category = 'disaster';
      }

      return {
        title: title,
        summary: article.description || '',
        content: article.content,
        url: article.url,
        imageUrl: article.image || undefined,
        date: new Date(article.publishedAt).toISOString(),
        source: article.source.name,
        urgent,
        category
      };
    });
  }

  /**
   * Fallback usando NewsAPI (temporário)
   */
  private async getFallbackFromNewsAPI(limit: number): Promise<ProcessedGNewsArticle[]> {
    try {
      const { newsService } = await import('./newsService');
      const newsArticles = await newsService.getClimateNews(limit);
      
      // Converte formato NewsAPI para GNews
      return newsArticles.map(article => ({
        title: article.title,
        summary: article.summary,
        content: article.content,
        url: article.url,
        imageUrl: article.imageUrl,
        date: article.date,
        source: article.source,
        urgent: article.urgent,
        category: article.category as ProcessedGNewsArticle['category']
      }));
    } catch (error) {
      console.error('Erro no fallback para NewsAPI:', error);
      return this.getFallbackNews();
    }
  }

  /**
   * Notícias de fallback quando nenhuma API está configurada
   */
  private getFallbackNews(): ProcessedGNewsArticle[] {
    return [
      {
        title: "Configure a API GNews para ver notícias reais",
        summary: "Para exibir notícias reais sobre clima e meio ambiente, configure sua chave da API GNews.",
        url: "https://gnews.io",
        date: new Date().toISOString(),
        source: "Sistema ClimACT",
        urgent: false,
        category: 'news'
      },
      {
        title: "Como obter uma chave da API GNews",
        summary: "1. Acesse gnews.io 2. Crie uma conta gratuita 3. Obtenha sua API key 4. Configure no .env.local",
        url: "https://gnews.io/docs/v4",
        date: new Date().toISOString(),
        source: "Documentação",
        urgent: false,
        category: 'news'
      }
    ];
  }

  /**
   * Busca notícias por categoria específica
   */
  async getNewsByCategory(
    category: 'general' | 'business' | 'entertainment' | 'health' | 'science' | 'sports' | 'technology',
    limit: number = 10
  ): Promise<ProcessedGNewsArticle[]> {
    if (!this.isConfigured()) {
      return this.getFallbackNews();
    }

    try {
      const params = new URLSearchParams({
        category,
        lang: 'pt',
        country: 'br',
        max: limit.toString(),
        token: this.apiKey
      });

      const response = await fetch(`${this.baseUrl}/top-headlines?${params}`);
      
      if (!response.ok) {
        throw new Error(`GNews API error: ${response.status}`);
      }

      const data: GNewsResponse = await response.json();
      return this.processArticles(data.articles);

    } catch (error) {
      console.error('Erro ao buscar notícias por categoria:', error);
      return this.getFallbackNews();
    }
  }

  /**
   * Verifica o status da API
   */
  async checkApiStatus(): Promise<{ 
    configured: boolean; 
    working: boolean; 
    remainingRequests?: number;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { 
        configured: false, 
        working: false,
        error: 'API key não configurada'
      };
    }

    try {
      const params = new URLSearchParams({
        q: 'test',
        max: '1',
        token: this.apiKey
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`);
      
      if (response.ok) {
        // GNews retorna informações de quota no header
        const remainingRequests = response.headers.get('X-RateLimit-Remaining');
        
        return {
          configured: true,
          working: true,
          remainingRequests: remainingRequests ? parseInt(remainingRequests) : undefined
        };
      } else {
        return {
          configured: true,
          working: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        configured: true,
        working: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export const gNewsService = new GNewsService();
export { GNewsService };
