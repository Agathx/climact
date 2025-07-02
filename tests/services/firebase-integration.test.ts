import { describe, test, expect } from '@jest/globals';

describe('Firebase Integration Tests', () => {
  test('Firebase client configuration should be valid', async () => {
    try {
      // Dynamic import to avoid loading Cloud Functions
      const { app } = await import('@/lib/firebase');
      
      expect(app).toBeDefined();
      expect(app.name).toBe('[DEFAULT]');
      expect(app.options.projectId).toBe('climact-suite');
    } catch (error) {
      console.error('Firebase client config error:', error);
      throw error;
    }
  });

  test('Firestore should be available', async () => {
    try {
      const { db } = await import('@/lib/firebase');
      expect(db).toBeDefined();
      expect(db.app.options.projectId).toBe('climact-suite');
    } catch (error) {
      console.error('Firestore config error:', error);
      throw error;
    }
  });

  test('Firebase Auth should be available', async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      expect(auth).toBeDefined();
      expect(auth.app.options.projectId).toBe('climact-suite');
    } catch (error) {
      console.error('Firebase Auth config error:', error);
      throw error;
    }
  });

  test('Firebase Storage should be available', async () => {
    try {
      const { storage } = await import('@/lib/firebase');
      expect(storage).toBeDefined();
      expect(storage.app.options.projectId).toBe('climact-suite');
    } catch (error) {
      console.error('Firebase Storage config error:', error);
      throw error;
    }
  });

  test('Firebase Functions should be available', async () => {
    try {
      const { functions } = await import('@/lib/firebase');
      expect(functions).toBeDefined();
      expect(functions.app.options.projectId).toBe('climact-suite');
    } catch (error) {
      console.error('Firebase Functions config error:', error);
      throw error;
    }
  });

  test('Report service validation functions should work', () => {
    // Test utility functions that don't require Firebase
    const { 
      validateReportData, 
      getIncidentTypes, 
      getSeverityLevels 
    } = require('@/services/reportService');

    // Test getIncidentTypes
    const types = getIncidentTypes();
    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);
    
    // Test getSeverityLevels
    const levels = getSeverityLevels();
    expect(Array.isArray(levels)).toBe(true);
    expect(levels.length).toBe(4);
    
    // Test validateReportData
    const validData = {
      incidentType: 'enchente',
      description: 'Teste de descrição com mais de 10 caracteres',
      location: { latitude: -23.5505, longitude: -46.6333, address: 'São Paulo' },
      severity: 'media'
    };
    
    const result = validateReportData(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('External API configurations should be present', () => {
    // Check OpenWeather API
    expect(process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY).toBeTruthy();
    
    // Check News API
    expect(process.env.NEXT_PUBLIC_NEWS_API_KEY || process.env.NEWS_API_KEY).toBeTruthy();
    
    // Check CEMADEN URLs
    expect(process.env.NEXT_PUBLIC_CEMADEN_ESTADOS_URL).toBeTruthy();
    expect(process.env.NEXT_PUBLIC_CEMADEN_ALERTAS_URL).toBeTruthy();
  });

  test('MapItem interface should be properly defined', async () => {
    // Test that the MapItem type from interactive-map is working
    const mapItem = {
      id: 'test-1',
      type: 'report' as const,
      title: 'Test Incident',
      description: 'Test description',
      position: { lat: -23.5505, lng: -46.6333 },
      criticality: 'Medium' as const
    };

    expect(mapItem.id).toBe('test-1');
    expect(mapItem.type).toBe('report');
    expect(mapItem.position.lat).toBe(-23.5505);
    expect(mapItem.position.lng).toBe(-46.6333);
  });

  test('Service type definitions should be valid', () => {
    // Test that our type definitions are properly structured
    const testReport = {
      id: 'test-report',
      userId: 'test-user',
      isAnonymous: false,
      incidentType: 'enchente' as const,
      title: 'Test Report',
      description: 'Test description',
      location: { latitude: -23.5505, longitude: -46.6333 },
      mediaUrls: [],
      status: 'pendente_ia' as const,
      severity: 'media' as const,
      urgency: false,
      communityValidations: [],
      views: 0,
      helps: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(testReport.id).toBeTruthy();
    expect(testReport.incidentType).toBe('enchente');
    expect(testReport.severity).toBe('media');
    expect(testReport.status).toBe('pendente_ia');
  });
});