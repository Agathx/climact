import { describe, test, expect } from '@jest/globals';

describe('Firebase Configuration Tests', () => {
  test('All required Firebase environment variables should be set', () => {
    const requiredVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];

    requiredVars.forEach(varName => {
      expect(process.env[varName]).toBeTruthy();
      expect(process.env[varName]).not.toBe('');
    });
  });

  test('Firebase project ID should be correct', () => {
    expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('climact-suite');
  });

  test('Firebase config should have correct domain', () => {
    expect(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN).toBe('climact-suite.firebaseapp.com');
  });

  test('Firebase API key should be valid format', () => {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    expect(apiKey).toBeTruthy();
    expect(apiKey?.length).toBeGreaterThan(30);
    expect(apiKey).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test('Firebase app ID should be valid format', () => {
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    expect(appId).toBeTruthy();
    expect(appId).toMatch(/^\d+:\d+:web:[a-f0-9]+$/);
  });

  test('Storage bucket should be valid format', () => {
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    expect(bucket).toBeTruthy();
    expect(bucket).toMatch(/\.firebasestorage\.app$/);
  });

  test('Admin configuration should be present', () => {
    expect(process.env.FIREBASE_PROJECT_ID).toBeTruthy();
    expect(process.env.FIREBASE_CLIENT_EMAIL).toBeTruthy();
    expect(process.env.FIREBASE_PRIVATE_KEY).toBeTruthy();
    
    // Private key should be in correct format
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    expect(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(privateKey).toContain('-----END PRIVATE KEY-----');
  });

  test('External API keys should be configured', () => {
    // OpenWeather API
    expect(process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY).toBeTruthy();
    
    // GNews API
    expect(process.env.NEXT_PUBLIC_GNEWS_API_KEY || process.env.NEXT_PUBLIC_NEWS_API_KEY).toBeTruthy();
    expect(process.env.NEXT_PUBLIC_GNEWS_API_URL).toBeTruthy();
    
    // Gemini API
    expect(process.env.GEMINI_API_KEY).toBeTruthy();
    
    // Google Maps API
    expect(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).toBeTruthy();
  });

  test('CEMADEN URLs should be configured', () => {
    expect(process.env.NEXT_PUBLIC_CEMADEN_ESTADOS_URL).toBeTruthy();
    expect(process.env.NEXT_PUBLIC_CEMADEN_ALERTAS_URL).toBeTruthy();
    
    const estadosUrl = process.env.NEXT_PUBLIC_CEMADEN_ESTADOS_URL;
    const alertasUrl = process.env.NEXT_PUBLIC_CEMADEN_ALERTAS_URL;
    
    expect(estadosUrl).toMatch(/^https?:\/\//);
    expect(alertasUrl).toMatch(/^https?:\/\//);
  });
});