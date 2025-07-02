import admin from 'firebase-admin';

// Verificação de build seguro
const isBuild = process.env.NODE_ENV === 'production' && !process.env.FIREBASE_PROJECT_ID;

let firebaseApp: admin.app.App | null = null;

// Inicialização simplificada do Firebase Admin
if (!admin.apps.length && !isBuild) {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    try {
      // Processar chave privada
      let privateKey = FIREBASE_PRIVATE_KEY;
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        databaseURL: `https://${FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
        storageBucket: `${FIREBASE_PROJECT_ID}.appspot.com`,
      });
      
      console.log('✅ Firebase Admin inicializado (simple)');
    } catch (error: any) {
      console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
      firebaseApp = null;
    }
  } else {
    console.warn('⚠️ Credenciais Firebase Admin não encontradas');
  }
}

// Exports seguros com fallbacks
export const auth = firebaseApp ? admin.auth(firebaseApp) : admin.auth();
export const db = firebaseApp ? admin.firestore(firebaseApp) : admin.firestore();
export const storage = firebaseApp ? admin.storage(firebaseApp) : admin.storage();

export default admin;