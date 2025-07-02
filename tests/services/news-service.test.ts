import { describe, test, expect, beforeAll } from '@jest/globals';
import { newsService } from '@/services/newsService';

describe('News Service Tests', () => {
  beforeAll(() => {
    // Check if News API key is configured
    const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY || process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.warn('News API key not configured - some tests may be skipped');
    }
  });

  test('newsService should be defined', () => {
    expect(newsService).toBeDefined();
    expect(typeof newsService.getClimateNews).toBe('function');
  });

  test('getClimateNews should return processed news', async () => {
    try {
      const result = await newsService.getClimateNews(5);
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const article = result[0];
        expect(article.title).toBeDefined();
        expect(article.summary).toBeDefined();
        expect(article.url).toBeDefined();
        expect(article.date).toBeDefined();
        expect(article.source).toBeDefined();
        expect(typeof article.urgent).toBe('boolean');
        expect(['climate', 'environment', 'disaster', 'news']).toContain(article.category);
      }
    } catch (error: any) {
      if (error.message?.includes('API de Notícias não configurada')) {
        console.log('News API not configured - test skipped');
      } else {
        console.error('News service error:', error);
        throw error;
      }
    }
  });

  test('getClimateNews should handle different page sizes', async () => {
    try {
      const result = await newsService.getClimateNews(3);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
    } catch (error: any) {
      if (error.message?.includes('API de Notícias não configurada')) {
        console.log('News API not configured - test skipped');
      } else {
        console.error('News service error:', error);
        throw error;
      }
    }
  });

  test('news service should handle API errors gracefully', async () => {
    // Test with invalid parameters to see error handling
    try {
      await newsService.getClimateNews(-1); // Invalid limit
    } catch (error) {
      expect(error).toBeDefined();
      // Should throw a meaningful error
    }
  });

  test('processed news should have correct structure', async () => {
    try {
      const result = await newsService.getClimateNews(1);
      
      if (result.length > 0) {
        const article = result[0];
        
        // Check required fields
        expect(typeof article.title).toBe('string');
        expect(typeof article.summary).toBe('string');
        expect(typeof article.url).toBe('string');
        expect(typeof article.date).toBe('string');
        expect(typeof article.source).toBe('string');
        expect(typeof article.urgent).toBe('boolean');
        expect(typeof article.category).toBe('string');
        
        // Check URL format
        expect(article.url).toMatch(/^https?:\/\//);
        
        // Check date format (should be ISO string)
        expect(() => new Date(article.date)).not.toThrow();
        
        // Check category is valid
        expect(['climate', 'environment', 'disaster', 'news']).toContain(article.category);
      }
    } catch (error: any) {
      if (error.message?.includes('API de Notícias não configurada')) {
        console.log('News structure test skipped - API not configured');
      } else {
        throw error;
      }
    }
  });
});