interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

interface NewsAPIArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface ProcessedNews {
  title: string;
  snippet: string;
  source: string;
  date: string;
  imageUrl: string;
  imageHint: string;
  link: string;
  urgent?: boolean;
}

class NewsService {
  private readonly apiRoute = '/api/news';

  private getDefaultImage(): string {
    return 'https://placehold.co/600x400/e2e8f0/64748b?text=ClimACT+News';
  }

  private generateImageHint(title: string, description: string): string {
    const content = `${title} ${description}`.toLowerCase();
    
    if (content.includes('chuva') || content.includes('alagamento') || content.includes('inundação')) {
      return 'heavy rain flooding';
    }
    if (content.includes('seca') || content.includes('estiagem')) {
      return 'drought dry land';
    }
    if (content.includes('queimada') || content.includes('incêndio')) {
      return 'wildfire forest fire';
    }
    if (content.includes('tempestade') || content.includes('ciclone')) {
      return 'storm hurricane';
    }
    if (content.includes('terremoto') || content.includes('tremor')) {
      return 'earthquake damage';
    }
    if (content.includes('deslizamento') || content.includes('desmoronamento')) {
      return 'landslide mudslide';
    }
    if (content.includes('calor') || content.includes('temperatura')) {
      return 'heat wave thermometer';
    }
    if (content.includes('governo') || content.includes('política')) {
      return 'government building politics';
    }
    if (content.includes('reflorestamento') || content.includes('plantio')) {
      return 'reforestation tree planting';
    }
    
    return 'climate news environment';
  }

  private isUrgentNews(title: string, description: string): boolean {
    const content = `${title} ${description}`.toLowerCase();
    const urgentKeywords = [
      'alerta', 'emergência', 'urgente', 'crítico', 'catástrofe',
      'evacuação', 'risco', 'perigo', 'desastre', 'marca histórica',
      'sem precedentes', 'nível máximo', 'estado de calamidade'
    ];
    
    return urgentKeywords.some(keyword => content.includes(keyword));
  }

  async getClimateNews(pageSize: number = 20): Promise<ProcessedNews[]> {
    try {
      const queries = [
        'mudanças climáticas Brasil',
        'desastres naturais Brasil',
        'CEMADEN alerta',
        'clima extremo Brasil',
        'sustentabilidade ambiental'
      ];

      const allNews: ProcessedNews[] = [];

      for (const query of queries) {
        try {
          const response = await fetch(
            `${this.apiRoute}?endpoint=everything&q=${encodeURIComponent(query)}&language=pt&pageSize=${Math.ceil(pageSize / queries.length)}`
          );

          if (!response.ok) {
            console.warn(`Erro ao buscar notícias para "${query}":`, response.status);
            continue;
          }

          const data: NewsAPIResponse = await response.json();
          
          if (data.status === 'ok' && data.articles) {
            const processedArticles = data.articles
              .filter(article => article.title && article.description)
              .map(article => this.processArticle(article));
            
            allNews.push(...processedArticles);
          }
        } catch (error) {
          console.warn(`Erro ao processar query "${query}":`, error);
        }
      }

      // Remove duplicatas e ordena por data
      const uniqueNews = allNews.filter((news, index, self) => 
        index === self.findIndex(n => n.title === news.title)
      );

      return uniqueNews
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, pageSize);

    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      return this.getFallbackNews();
    }
  }

  private processArticle(article: NewsAPIArticle): ProcessedNews {
    return {
      title: article.title,
      snippet: article.description || 'Descrição não disponível.',
      source: article.source.name,
      date: article.publishedAt,
      imageUrl: article.urlToImage || this.getDefaultImage(),
      imageHint: this.generateImageHint(article.title, article.description || ''),
      link: article.url,
      urgent: this.isUrgentNews(article.title, article.description || '')
    };
  }

  private getFallbackNews(): ProcessedNews[] {
    return [
      {
        title: "API de Notícias não configurada",
        snippet: "Para exibir notícias reais, configure a variável NEXT_PUBLIC_NEWS_API_KEY no arquivo .env com sua chave da NewsAPI.",
        source: "ClimACT",
        date: new Date().toISOString(),
        imageUrl: this.getDefaultImage(),
        imageHint: "configuration settings",
        link: "https://newsapi.org/",
        urgent: false
      },
      {
        title: "Como configurar a API de Notícias",
        snippet: "Acesse newsapi.org, crie uma conta gratuita, obtenha sua API key e adicione ao arquivo .env como NEXT_PUBLIC_NEWS_API_KEY=sua_chave_aqui",
        source: "ClimACT Setup",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        imageUrl: this.getDefaultImage(),
        imageHint: "api configuration tutorial",
        link: "https://newsapi.org/register",
        urgent: false
      }
    ];
  }

  async getTopHeadlines(country: string = 'br', category: string = 'general'): Promise<ProcessedNews[]> {
    try {
      const response = await fetch(
        `${this.apiRoute}?endpoint=top-headlines&country=${country}&category=${category}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NewsAPIResponse = await response.json();
      
      if (data.status === 'ok' && data.articles) {
        return data.articles
          .filter(article => article.title && article.description)
          .map(article => this.processArticle(article));
      }

      return this.getFallbackNews();
    } catch (error) {
      console.error('Erro ao buscar manchetes:', error);
      return this.getFallbackNews();
    }
  }
}

export const newsService = new NewsService();
