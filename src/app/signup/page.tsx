
'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signup, signInWithGoogle } from '@/app/auth/actions';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

function SignupButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" aria-disabled={pending} disabled={pending}>
      {pending ? 'Criando conta...' : 'Criar Conta'}
    </Button>
  );
}

function GoogleButton({isSubmitting, onClick}: {isSubmitting: boolean, onClick: () => void}) {
    return (
        <Button variant="outline" className="w-full" onClick={onClick} formNoValidate disabled={isSubmitting}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
            {isSubmitting ? 'Cadastrando com Google...' : 'Cadastrar com Google'}
        </Button>
    );
}

export default function SignupPage() {
  const [formState, setFormState] = useState<{ message: string; errors: Record<string, string[]> }>({ 
    message: '', 
    errors: {} 
  });
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    const result = await signup({ message: '', errors: {} }, formData);
    setFormState({
      message: result.message || '',
      errors: result.errors || {}
    });
  };

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
          title: "Erro no Cadastro com Google",
          description: actionResult.error,
        });
      }
       // On success, the server action will redirect.
    } catch (error: any) {
      console.error("Google Sign Up Error:", error);
      let description = 'Ocorreu um erro inesperado durante o cadastro com Google. Tente novamente.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Google Sign-up popup closed by user.");
        // Do not show a toast for this user action
      } else if (error.code) {
         description = `Ocorreu um erro no cadastro com Google. Código: ${error.code}.`;
      } else if (error.message) {
         description = error.message;
      } else {
        toast({
            variant: "destructive",
            title: "Erro no Cadastro com Google",
            description,
        });
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Cadastrar</CardTitle>
          <CardDescription>
            Crie sua conta e junte-se à comunidade ClimACT. Sua participação faz a diferença.
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" name="name" placeholder="Seu Nome" required aria-label="Nome" />
               {formState.errors?.name && <p className="text-sm text-destructive">{formState.errors.name[0]}</p>}
            </div>
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
               {formState.errors?.email && <p className="text-sm text-destructive">{formState.errors.email[0]}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required aria-label="Senha"/>
               {formState.errors?.password && <p className="text-sm text-destructive">{formState.errors.password[0]}</p>}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="role">Tipo de Perfil</Label>
                 <Select name="role" defaultValue="citizen" required>
                    <SelectTrigger id="role" aria-label="Selecione o tipo de perfil">
                        <SelectValue placeholder="Selecione seu perfil" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="citizen">Cidadão</SelectItem>
                        <SelectItem value="volunteer">Voluntário</SelectItem>
                        <SelectItem value="ong">ONG / Organização</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Perfis de Voluntário e ONG necessitam de aprovação.</p>
                {formState.errors?.role && <p className="text-sm text-destructive">{formState.errors.role[0]}</p>}
            </div>
             {formState.message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro no Cadastro</AlertTitle>
                <AlertDescription>{formState.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <SignupButton />
          </CardFooter>
        </form>
        <CardFooter>
            <GoogleButton isSubmitting={isGoogleSubmitting} onClick={handleGoogleSignIn} />
        </CardFooter>
         <CardFooter className="flex-col gap-4 items-start">
            <div className="text-center text-sm text-muted-foreground w-full">
              Já tem uma conta?{' '}
              <Link href="/login" className="underline text-primary">
                Entrar
              </Link>
            </div>
        </CardFooter>
      </Card>
    </main>
  );
}
    
