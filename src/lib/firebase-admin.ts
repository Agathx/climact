import admin from 'firebase-admin';

// 🔧 Configuração para build seguro
const isBuild = process.env.NODE_ENV === 'production' && !process.env.FIREBASE_PROJECT_ID;
const isProduction = process.env.NODE_ENV === 'production';

let firebaseApp: admin.app.App | null = null;

// 🔥 Função para processar chave privada corretamente
function formatPrivateKey(privateKey: string): string {
  if (!privateKey) {
    throw new Error('Chave privada não fornecida');
  }

  // Remove aspas duplas e simples no início e fim
  let key = privateKey.trim().replace(/^["']/, '').replace(/["']$/, '');
  
  // Trata diferentes tipos de encoding
  try {
    // Se a chave está em base64, decodifica
    if (!key.includes('-----BEGIN') && key.length > 100) {
      key = Buffer.from(key, 'base64').toString('utf8');
    }
  } catch (decodingError: any) {
    // Se falhar na decodificação, continua com o valor original
    console.warn('⚠️ Falha na decodificação base64 da chave privada:', decodingError.message);
  }
  
  // Substitui \\n por quebras de linha reais
  key = key.replace(/\\n/g, '\n');
  
  // Remove espaços extras e garante formato correto
  key = key.replace(/\s+/g, ' ').trim();
  
  // Se a chave não tem quebras de linha, adiciona
  if (!key.includes('\n') && key.includes(' ')) {
    key = key
      .replace('-----BEGIN PRIVATE KEY----- ', '-----BEGIN PRIVATE KEY-----\n')
      .replace(' -----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
      .replace(/(.{64})/g, '$1\n');
  }
  
  // Limpeza final
  key = key
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  // Validação do formato
  if (!key.includes('-----BEGIN PRIVATE KEY-----') || !key.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Formato de chave privada inválido - deve conter BEGIN e END markers');
  }
  
  return key;
}

// 🔧 Validação de configuração para produção
function validateProductionConfig(projectId: string, clientEmail: string): void {
  if (isProduction) {
    if (projectId.includes('demo') || projectId.includes('test')) {
      throw new Error('❌ Configuração de produção usando projeto demo/test');
    }
    
    if (!clientEmail.includes(projectId)) {
      console.warn('⚠️ Client email pode não corresponder ao projeto');
    }
    
    console.log('✅ Configuração Firebase Admin validada para produção');
  }
}

// 🔥 Inicialização Firebase Admin
if (!admin.apps.length && !isBuild) {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    const errorMsg = '🚧 Firebase Admin: Credenciais não encontradas no arquivo .env';
    
    if (isProduction) {
      throw new Error(`${errorMsg} - OBRIGATÓRIO EM PRODUÇÃO`);
    } else {
      console.warn(errorMsg);
      console.warn('⚠️ Modo desenvolvimento sem Firebase - usando mocks');
    }
  } else {
    try {
      // Validar configuração para produção
      validateProductionConfig(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL);
      
      console.log('🔧 Formatando chave privada...');
      const formattedPrivateKey = formatPrivateKey(FIREBASE_PRIVATE_KEY);
      console.log('✅ Chave privada formatada com sucesso');
      
      const credentials = {
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: formattedPrivateKey,
      };
      
      console.log('🔧 Criando credenciais do Firebase Admin...');
      const credential = admin.credential.cert(credentials);
      
      firebaseApp = admin.initializeApp({
        credential,
        // Configurações específicas para produção
        databaseURL: `https://${FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
        storageBucket: `${FIREBASE_PROJECT_ID}.appspot.com`,
      });
      
      console.log(`✅ Firebase Admin inicializado com sucesso (${isProduction ? 'PRODUÇÃO' : 'desenvolvimento'})`);
      console.log(`📋 Projeto: ${FIREBASE_PROJECT_ID}`);
      console.log(`🔒 Configuração de produção ativa: ${isProduction ? 'SIM' : 'NÃO'}`);
      
      // Teste de conectividade
      try {
        console.log('🔧 Testando conectividade do Firebase...');
        await admin.auth().listUsers(1);
        console.log('✅ Conectividade Firebase testada com sucesso');
      } catch (connectivityError: any) {
        console.error('⚠️ Erro de conectividade Firebase:', connectivityError.message);
        if (isProduction) {
          throw new Error(`Falha na conectividade Firebase: ${connectivityError.message}`);
        }
      }
      
      // Marcar como configuração válida para produção
      if (FIREBASE_PROJECT_ID.includes('climact') && !FIREBASE_PROJECT_ID.includes('test')) {
        console.log('✅ Configuração Firebase Admin para produção validada');
      }
    } catch (error: any) {
      const errorMsg = `❌ Firebase admin initialization error: ${error.message}`;
      
      if (isProduction) {
        throw new Error(`${errorMsg} - FALHA CRÍTICA EM PRODUÇÃO`);
      } else {
        console.error(errorMsg);
        console.warn('⚠️ Continuando em modo desenvolvimento sem Firebase');
      }
      
      // Log adicional para debug de chave privada
      if (error.message.includes('DECODER')) {
        console.error('🔑 Erro de decodificação da chave privada. Verifique o formato no .env');
      }
    }
  }
}

// ✅ Exports seguros com fallbacks para build
export const auth = firebaseApp ? admin.auth(firebaseApp) : admin.auth();
export const db = firebaseApp ? admin.firestore(firebaseApp) : admin.firestore();
export const storage = firebaseApp ? admin.storage(firebaseApp) : admin.storage();

// 🔧 Helper para verificar se Firebase está disponível
export const isFirebaseAvailable = () => firebaseApp !== null && admin.apps.length > 0;

// 🔧 Helper para obter instância segura do Firestore
export async function getFirestoreInstance() {
  if (!firebaseApp) {
    throw new Error('Firebase não está inicializado');
  }
  return admin.firestore(firebaseApp);
}

// 🔧 Helper para validar conexão Firebase
export async function validateFirebaseConnection(): Promise<boolean> {
  try {
    if (!firebaseApp) {
      return false;
    }
    
    // Testar conexão com Firestore
    const firestore = admin.firestore(firebaseApp);
    await firestore.collection('_health').limit(1).get();
    return true;
  } catch (error) {
    console.error('❌ Falha na validação de conexão Firebase:', error);
    return false;
  }
}

// 🔧 Helper para debug de conexão
export function debugFirebaseConnection() {
  console.log('🔍 Firebase Debug:');
  console.log('- Apps length:', admin.apps.length);
  console.log('- FirebaseApp:', firebaseApp ? 'OK' : 'NULL');
  console.log('- Available:', isFirebaseAvailable());
  console.log('- Production mode:', isProduction);
  console.log('- Project ID:', process.env.FIREBASE_PROJECT_ID);
}
