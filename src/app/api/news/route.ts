import { NextRequest, NextResponse } from 'next/server';

const GNEWS_API_URL = process.env.NEXT_PUBLIC_GNEWS_API_URL || 'https://gnews.io/api/v4';
const GNEWS_API_KEY = process.env.NEXT_PUBLIC_GNEWS_API_KEY || process.env.NEWS_API_KEY;

interface GNewsResponse {
  totalArticles: number;
  articles: any[];
}

export async function GET(request: NextRequest) {
  if (!GNEWS_API_KEY) {
    return NextResponse.json(
      { error: 'API key de notícias não configurada' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'search';
  const query = searchParams.get('q') || 'mudanças climáticas Brasil';
  const country = searchParams.get('country') || 'br';
  const category = searchParams.get('category') || 'science';
  const pageSize = searchParams.get('pageSize') || '20';
  const language = searchParams.get('language') || 'pt';

  try {
    let url: string;
    
    if (endpoint === 'top-headlines') {
      url = `${GNEWS_API_URL}/top-headlines?country=${country}&category=${category}&lang=${language}&max=${pageSize}&apikey=${GNEWS_API_KEY}`;
    } else {
      url = `${GNEWS_API_URL}/search?q=${encodeURIComponent(query)}&lang=${language}&country=${country}&max=${pageSize}&apikey=${GNEWS_API_KEY}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ClimACT/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GNews API error: ${response.status} - ${errorText}`);
    }

    const data: GNewsResponse = await response.json();
    
    // Convert GNews format to NewsAPI format for compatibility
    const convertedData = {
      status: 'ok',
      totalResults: data.totalArticles,
      articles: data.articles.map(article => ({
        source: article.source,
        author: null,
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.image,
        publishedAt: article.publishedAt,
        content: article.content
      }))
    };
    
    return NextResponse.json(convertedData);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notícias: ' + error.message },
      { status: 500 }
    );
  }
}
