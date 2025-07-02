import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types/user';

export interface UserInfo extends UserProfile {}

export function useSession() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserInfo);
        } else {
          // Criar documento do usuário automaticamente se não existir
          console.log(`Criando documento Firestore para usuário ${firebaseUser.uid}`);
          
          const newUserData: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Usuário',
            email: firebaseUser.email ?? '',
            role: 'cidadao', // Papel padrão
            status: 'active',
            photoURL: firebaseUser.photoURL ?? null,
            points: 0,
            badges: [],
            level: 1,
            notifications: {
              email: true,
              push: true,
              sms: false
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          try {
            await setDoc(userDocRef, newUserData);
            setUser(newUserData);
            console.log('Documento do usuário criado com sucesso');
          } catch (error) {
            console.error('Erro ao criar documento do usuário:', error);
            setUser(null);
          }
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
