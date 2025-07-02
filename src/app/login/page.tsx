
'use client';

import { authenticate, signInWithGoogle } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

function LoginButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button className="w-full" type="submit" aria-disabled={isSubmitting} disabled={isSubmitting}>
      {isSubmitting ? 'Entrando...' : 'Entrar'}
    </Button>
  );
}

function GoogleButton({isSubmitting, onClick}: {isSubmitting: boolean, onClick: () => void}) {
    return (
        <Button variant="outline" className="w-full" onClick={onClick} disabled={isSubmitting}>
           <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
           {isSubmitting ? 'Entrando com Google...' : 'Entrar com Google'}
        </Button>
    );
}

export default function LoginPage() {
  const { toast } = useToast();
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(clientAuth, provider);
      const idToken = await result.user.getIdToken();
      
      const formData = new FormData();
      formData.append('idToken', idToken);
      const actionResult = await signInWithGoogle(formData);

      if (actionResult?.error) {
        toast({
          variant: "destructive",
          title: "Erro no Login com Google",
          description: actionResult.error,
        });
      }
      // On success, the server action will redirect.
    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      let description = 'Ocorreu um erro inesperado. Por favor, tente novamente.';

      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Google Sign-in popup closed by user.");
        // Do not show a toast for this user action.
      } else if (error.code) {
        description = `Ocorreu um erro no login com Google. Código: ${error.code}`;
      } else if (error.message) {
        description = error.message;
      } else {
         toast({
            variant: "destructive",
            title: "Erro no Login com Google",
            description,
        });
      }
    } finally {
        setIsGoogleSubmitting(false);
    }
  };
  
  const handleEmailPasswordSignIn = async (formData: FormData) => {
    setIsEmailSubmitting(true);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        toast({ variant: "destructive", title: "Erro no Login", description: "Email e senha são obrigatórios." });
        setIsEmailSubmitting(false);
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
        const idToken = await userCredential.user.getIdToken();
        
        const actionFormData = new FormData();
        actionFormData.append('idToken', idToken);
        
        const result = await authenticate(undefined, actionFormData);
        
        if (result) {
            toast({ variant: "destructive", title: "Erro no Login", description: result });
        }
        // Redirect is handled by the server action on success
    } catch (error: any) {
        console.error("Email/Password Sign In Error:", error);
        let friendlyMessage = "Ocorreu um erro durante o login.";
        
        if (error.code) {
            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    friendlyMessage = "Credenciais inválidas. Verifique seu e-mail e senha.";
                    break;
                case 'auth/user-disabled':
                    friendlyMessage = "Esta conta de usuário foi desativada.";
                    break;
                case 'auth/network-request-failed':
                    friendlyMessage = "Erro de rede. Verifique sua conexão com a internet e tente novamente.";
                    break;
                default:
                    friendlyMessage = `Ocorreu um erro inesperado. Código: ${error.code}`;
                    break;
            }
        } else if (error.message) {
            friendlyMessage = error.message;
        }

         toast({
            variant: "destructive",
            title: "Erro no Login",
            description: friendlyMessage,
        });
    } finally {
        setIsEmailSubmitting(false);
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>
            Bem-vindo de volta! Acesse sua conta para continuar contribuindo.
          </CardDescription>
        </CardHeader>
        <form action={handleEmailPasswordSignIn}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="nome@exemplo.com"
                required
                aria-label="Email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" name="password" required aria-label="Senha"/>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <LoginButton isSubmitting={isEmailSubmitting} />
          </CardFooter>
        </form>
         <CardFooter>
            <GoogleButton isSubmitting={isGoogleSubmitting || isEmailSubmitting} onClick={handleGoogleSignIn} />
        </CardFooter>
        <CardFooter className="flex-col gap-4 items-start">
            <div className="text-center text-sm text-muted-foreground w-full">
              Não tem uma conta?{' '}
              <Link href="/signup" className="underline text-primary">
                Cadastrar
              </Link>
            </div>
        </CardFooter>
      </Card>
    </main>
  );
}
    
