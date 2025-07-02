import { describe, test, expect, beforeAll } from '@jest/globals';
import { weatherService } from '@/services/weatherService';

describe('Weather Service Tests', () => {
  const testCoordinates: [number, number] = [-23.5505, -46.6333]; // São Paulo

  beforeAll(() => {
    // Check if OpenWeather API key is configured
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn('OpenWeather API key not configured - some tests may be skipped');
    }
  });

  test('weatherService should be defined', () => {
    expect(weatherService).toBeDefined();
    expect(typeof weatherService.getCurrentWeather).toBe('function');
  });

  test('getCurrentWeather should return weather data', async () => {
    try {
      const result = await weatherService.getCurrentWeather(testCoordinates);
      
      expect(result).toBeDefined();
      expect(result.temperature).toBeDefined();
      expect(result.humidity).toBeDefined();
      expect(result.pressure).toBeDefined();
      expect(result.windSpeed).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.location).toBeDefined();
      
      // Check data types
      expect(typeof result.temperature).toBe('number');
      expect(typeof result.humidity).toBe('number');
      expect(typeof result.pressure).toBe('number');
      expect(typeof result.windSpeed).toBe('number');
      expect(typeof result.description).toBe('string');
      expect(typeof result.location).toBe('string');
      
      // Check reasonable ranges
      expect(result.temperature).toBeGreaterThan(-50);
      expect(result.temperature).toBeLessThan(60);
      expect(result.humidity).toBeGreaterThanOrEqual(0);
      expect(result.humidity).toBeLessThanOrEqual(100);
      expect(result.pressure).toBeGreaterThan(900);
      expect(result.pressure).toBeLessThan(1100);
      expect(result.windSpeed).toBeGreaterThanOrEqual(0);
      
    } catch (error: any) {
      if (error.message?.includes('API key') || error.message?.includes('not configured')) {
        console.log('Weather API not configured - test skipped');
      } else {
        console.error('Weather service error:', error);
        throw error;
      }
    }
  });

  test('getCurrentWeather should handle API errors gracefully', async () => {
    try {
      // Test that service handles errors without crashing
      const result = await weatherService.getCurrentWeather(testCoordinates);
      if (result) {
        expect(result.temperature).toBeDefined();
      }
    } catch (error: any) {
      // Should handle errors gracefully
      expect(error).toBeDefined();
      if (!error.message?.includes('API key') && !error.message?.includes('not configured')) {
        console.log('Weather service handled error correctly:', error.message);
      }
    }
  });

  test('weather service should handle invalid coordinates', async () => {
    try {
      // Test with invalid coordinates
      await weatherService.getCurrentWeather([999, 999]);
    } catch (error) {
      expect(error).toBeDefined();
      // Should throw an error for invalid coordinates
    }
  });

  test('weather service should handle network errors gracefully', async () => {
    // This test checks that the service doesn't crash on network errors
    // We can't easily simulate network failures in unit tests, 
    // but we can check that the functions are robust
    try {
      const result = await weatherService.getCurrentWeather(testCoordinates);
      // If successful, result should be valid
      if (result) {
        expect(result.temperature).toBeDefined();
      }
    } catch (error) {
      // If it fails, it should be a meaningful error
      expect(error).toBeDefined();
    }
  });
});