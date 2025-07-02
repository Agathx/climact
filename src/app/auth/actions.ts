
'use server';
import { auth, db } from '@/lib/firebase-admin-simple';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

const SignupSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  role: z.enum(['citizen', 'volunteer', 'ong'], { errorMap: () => ({ message: "Selecione um tipo de perfil." }) }),
});

type State = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    role?: string[];
  };
  message?: string | null;
};

export async function signup(prevState: State, formData: FormData) {
  // Verificar se Firebase está configurado
  if (!auth || !db) {
    console.error('❌ Firebase não está inicializado para signup');
    return {
      message: 'Erro de configuração do servidor. Tente novamente mais tarde.',
    };
  }

  const validatedFields = SignupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Erro de validação. Por favor, verifique os campos.',
    };
  }

  const { name, email, password, role } = validatedFields.data;

  try {
    const userCredential = await auth.createUser({ email, password, displayName: name });
    
    const listUsersResult = await auth.listUsers(2);
    const isFirstUser = listUsersResult.users.length <= 1;
    const finalRole = isFirstUser ? 'admin' : role;
    const userStatus = finalRole === 'citizen' || finalRole === 'admin' ? 'active' : 'pending_approval';

    await auth.setCustomUserClaims(userCredential.uid, { role: finalRole, status: userStatus });

    await db.collection('users').doc(userCredential.uid).set({
        uid: userCredential.uid,
        name: name,
        email: email,
        role: finalRole,
        status: userStatus,
        createdAt: FieldValue.serverTimestamp(),
        photoURL: userCredential.photoURL ?? null,
    });

  } catch (error: any) {
     if (error.code === 'auth/email-already-exists') {
      return { message: 'Este e-mail já está em uso.' };
    }
    return {
      message: error.message ?? 'Ocorreu um erro durante o cadastro.',
    };
  }

  redirect('/login?signup=success');
}


export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  // 🔧 Verificar se Firebase está disponível
  if (!auth) {
    console.error('❌ Firebase auth não está inicializado');
    return "Erro de configuração do servidor. Tente novamente mais tarde.";
  }

  try {
    const idToken = formData.get('idToken') as string;

    if (!idToken) {
        return "Token de autenticação não encontrado. Por favor, tente novamente.";
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    (await cookies()).set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });

  } catch (e: any) {
    console.error("Authentication server error:", e);
    // Provide a more generic but safe error message to the client
    return "Ocorreu um erro no servidor durante a autenticação. Tente novamente mais tarde.";
  }
   redirect('/dashboard');
}


export async function signInWithGoogle(formData: FormData): Promise<{ error: string } | void> {
  // 🔧 Verificar se Firebase está disponível
  if (!auth || !db) {
    console.error('❌ Firebase não está inicializado para Google Sign-In');
    return { error: "Erro de configuração do servidor. Tente novamente mais tarde." };
  }

  try {
    const idToken = formData.get('idToken') as string;
    if (!idToken) {
      throw new Error("ID token not provided for Google Sign-In");
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const decodedToken = await auth.verifyIdToken(idToken);
    
    const userRef = db.collection('users').doc(decodedToken.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        const listUsersResult = await auth.listUsers(2);
        const isFirstUser = listUsersResult.users.length <= 1;
        
        let existingUser;
        try {
            existingUser = await auth.getUser(decodedToken.uid);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // This means the user was created on client, but something went wrong before this server action was called
                // Let's create it properly now
                existingUser = await auth.createUser({
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    displayName: decodedToken.name,
                    photoURL: decodedToken.picture
                });
            } else {
                throw error; // Re-throw other errors
            }
        }

        const finalRole = isFirstUser ? 'admin' : 'citizen';

        await auth.setCustomUserClaims(existingUser.uid, { role: finalRole, status: 'active' });
        await userRef.set({
            uid: existingUser.uid,
            name: existingUser.displayName ?? existingUser.email,
            email: existingUser.email,
            role: finalRole,
            status: 'active',
            createdAt: FieldValue.serverTimestamp(),
            photoURL: existingUser.photoURL ?? null,
        });
    }
    
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    (await cookies()).set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });

  } catch (e: any) {
    console.error("Error in signInWithGoogle server action: ", e);
    return { error: `Erro no servidor ao autenticar com Google: ${e.message ?? 'Erro desconhecido.'}` };
  }
  redirect('/dashboard');
}

export async function handleSignOut() {
    (await cookies()).delete('__session');
    redirect('/login');
}
