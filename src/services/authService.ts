import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from './profileService';

export interface AuthUser extends User {
  customClaims?: {
    role?: string;
    isApproved?: boolean;
    permissions?: string[];
  };
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  termsAccepted: boolean;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Cadastrar novo usuário
 */
export const signUp = async (data: SignUpData): Promise<UserCredential> => {
  try {
    if (!data.termsAccepted) {
      throw new Error('É necessário aceitar os termos de uso e política de privacidade');
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );

    // Atualizar nome do usuário
    if (userCredential.user && data.displayName) {
      await updateProfile(userCredential.user, {
        displayName: data.displayName
      });
    }

    return userCredential;
  } catch (error: any) {
    console.error('Erro no cadastro:', error);
    
    // Traduzir erros do Firebase
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Este email já está em uso',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
      'auth/invalid-email': 'Email inválido',
      'auth/operation-not-allowed': 'Operação não permitida',
    };
    
    throw new Error(errorMessages[error.code] || error.message || 'Erro ao criar conta');
  }
};

/**
 * Fazer login
 */
export const signIn = async (data: SignInData): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );

    return userCredential;
  } catch (error: any) {
    console.error('Erro no login:', error);
    
    // Traduzir erros do Firebase
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuário desabilitado',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    };
    
    throw new Error(errorMessages[error.code] || error.message || 'Erro ao fazer login');
  }
};

/**
 * Fazer logout
 */
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Erro no logout:', error);
    throw new Error('Erro ao fazer logout');
  }
};

/**
 * Observar mudanças no estado de autenticação
 */
export const onAuthChange = (callback: (user: AuthUser | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Obter custom claims
        const idTokenResult = await user.getIdTokenResult();
        const customClaims = idTokenResult.claims as any;
        
        const authUser: AuthUser = {
          ...user,
          customClaims: {
            role: customClaims.role || 'cidadao',
            isApproved: customClaims.isApproved || false,
            permissions: customClaims.permissions || [],
          }
        };
        
        callback(authUser);
      } catch (error) {
        console.error('Erro ao obter custom claims:', error);
        callback(user as AuthUser);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Obter usuário atual com custom claims
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthChange((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

/**
 * Verificar se usuário tem permissão específica
 */
export const hasPermission = (user: AuthUser | null, permission: string): boolean => {
  if (!user || !user.customClaims) return false;
  
  const { permissions, role } = user.customClaims;
  
  // Admin tem todas as permissões
  if (role === 'admin') return true;
  
  // Verificar permissão específica
  return permissions?.includes(permission) || false;
};

/**
 * Verificar se usuário tem role específico
 */
export const hasRole = (user: AuthUser | null, role: string): boolean => {
  if (!user || !user.customClaims) return false;
  return user.customClaims.role === role;
};

/**
 * Verificar se usuário está aprovado
 */
export const isApproved = (user: AuthUser | null): boolean => {
  if (!user || !user.customClaims) return false;
  return user.customClaims.isApproved === true;
};

/**
 * Atualizar token para obter custom claims mais recentes
 */
export const refreshUserToken = async (): Promise<void> => {
  if (auth.currentUser) {
    await auth.currentUser.getIdToken(true);
  }
};
