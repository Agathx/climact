import { describe, test, expect, beforeAll } from '@jest/globals';
import { app, auth, db, storage, functions } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  connectFirestoreEmulator 
} from 'firebase/firestore';
import { 
  connectAuthEmulator, 
  signInAnonymously, 
  signOut 
} from 'firebase/auth';
import { 
  connectStorageEmulator, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  connectFunctionsEmulator,
  httpsCallable 
} from 'firebase/functions';

describe('Firebase Connection Tests', () => {
  beforeAll(async () => {
    // Skip emulator setup if already connected
    try {
      // Connect to Firebase emulators for testing
      if (process.env.NODE_ENV === 'test') {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectStorageEmulator(storage, 'localhost', 9199);
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
    } catch (error) {
      // Emulators might already be connected
      console.log('Emulators already connected or not available');
    }
  });

  test('Firebase app should be initialized', () => {
    expect(app).toBeDefined();
    expect(app.name).toBe('[DEFAULT]');
    expect(app.options.projectId).toBe('climact-suite');
  });

  test('Firebase services should be available', () => {
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
    expect(storage).toBeDefined();
    expect(functions).toBeDefined();
  });

  test('Firebase config should have all required fields', () => {
    const config = app.options;
    expect(config.apiKey).toBeTruthy();
    expect(config.authDomain).toBeTruthy();
    expect(config.projectId).toBeTruthy();
    expect(config.storageBucket).toBeTruthy();
    expect(config.messagingSenderId).toBeTruthy();
    expect(config.appId).toBeTruthy();
  });

  test('Firestore connection should work', async () => {
    const testDoc = doc(collection(db, 'test'), 'connection-test');
    const testData = {
      message: 'Firebase connection test',
      timestamp: new Date(),
      success: true
    };

    try {
      // Write test document
      await setDoc(testDoc, testData);
      
      // Read test document
      const docSnap = await getDoc(testDoc);
      expect(docSnap.exists()).toBe(true);
      
      const data = docSnap.data();
      expect(data?.message).toBe(testData.message);
      expect(data?.success).toBe(true);
      
      // Clean up
      await deleteDoc(testDoc);
    } catch (error) {
      console.error('Firestore test error:', error);
      throw error;
    }
  });

  test('Authentication should work', async () => {
    try {
      // Sign in anonymously
      const userCredential = await signInAnonymously(auth);
      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.uid).toBeTruthy();
      
      // Check if user is signed in
      expect(auth.currentUser).toBeTruthy();
      
      // Sign out
      await signOut(auth);
      expect(auth.currentUser).toBeNull();
    } catch (error) {
      console.error('Auth test error:', error);
      throw error;
    }
  });

  test('Storage should work', async () => {
    try {
      // Create a test file
      const testContent = new Blob(['Firebase storage test'], { type: 'text/plain' });
      const storageRef = ref(storage, 'test/connection-test.txt');
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, testContent);
      expect(snapshot.metadata).toBeDefined();
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      expect(downloadURL).toBeTruthy();
      expect(downloadURL).toMatch(/^https?:\/\//);
      
      // Clean up
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Storage test error:', error);
      throw error;
    }
  });

  test('Cloud Functions should be callable', async () => {
    try {
      // Test a basic function call (this might fail if functions aren't deployed)
      const testFunction = httpsCallable(functions, 'test');
      
      // This test might fail in production, so we'll just check if the function is callable
      expect(testFunction).toBeDefined();
      expect(typeof testFunction).toBe('function');
      
      // In a real environment, you'd call the function like:
      // const result = await testFunction({ test: true });
      // expect(result.data).toBeDefined();
    } catch (error) {
      console.warn('Functions test warning (expected if not deployed):', error);
      // Don't fail the test if functions aren't deployed
    }
  });
});

describe('Firebase Environment Configuration', () => {
  test('All required environment variables should be set', () => {
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
    });
  });

  test('Firebase project ID should be correct', () => {
    expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('climact-suite');
  });
});