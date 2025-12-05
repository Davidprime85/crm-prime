import { auth, db } from './firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { User, UserRole } from '../types';

export const authService = {

  loginWithPassword: async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) return { user: null, error: 'Usuário não encontrado.' };

      // Busca perfil do usuário no Firestore
      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);

      let role: UserRole = 'client';
      let name = firebaseUser.email || 'Usuário';
      let avatar_url: string | undefined;

      // HARDCODE DE SEGURANÇA: Se for o David, força ADMIN
      if (firebaseUser.email?.toLowerCase() === 'david@creditoprime.com.br') {
        role = 'admin';
      } else if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        role = profileData.role as UserRole || 'client';
        name = profileData.name || name;
        avatar_url = profileData.avatar_url;
      }

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: name,
        role: role,
        avatar_url: avatar_url
      };

      return { user, error: null };
    } catch (e: any) {
      console.error('Erro no login:', e);
      if (e.code === 'auth/invalid-credential') {
        return { user: null, error: 'Email ou senha incorretos.' };
      }
      if (e.code === 'auth/user-not-found') {
        return { user: null, error: 'Usuário não encontrado.' };
      }
      if (e.code === 'auth/wrong-password') {
        return { user: null, error: 'Senha incorreta.' };
      }
      return { user: null, error: 'Erro ao fazer login. Tente novamente.' };
    }
  },

  register: async (email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      // 1. Cria usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) return { user: null, error: 'Erro ao criar usuário.' };

      // 2. Cria perfil no Firestore
      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      await setDoc(profileRef, {
        id: firebaseUser.uid,
        email: email,
        name: name,
        role: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: name,
        role: 'client'
      };

      return { user, error: null };

    } catch (e: any) {
      console.error('Erro no registro:', e);
      if (e.code === 'auth/email-already-in-use') {
        return { user: null, error: 'Este email já está cadastrado.' };
      }
      if (e.code === 'auth/weak-password') {
        return { user: null, error: 'A senha deve ter pelo menos 6 caracteres.' };
      }
      if (e.code === 'auth/invalid-email') {
        return { user: null, error: 'Email inválido.' };
      }
      return { user: null, error: e.message || 'Erro ao criar conta.' };
    }
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  getCurrentUser: async (): Promise<User | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
      // Busca perfil do Firestore
      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);

      let role: UserRole = 'client';
      let name = firebaseUser.email || 'Usuário';

      // HARDCODE DE SEGURANÇA: Se for o David, força ADMIN
      if (firebaseUser.email?.toLowerCase() === 'david@creditoprime.com.br') {
        role = 'admin';
      } else if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        role = profileData.role as UserRole || 'client';
        name = profileData.name || name;
      }

      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: name,
        role: role,
      };
    } catch (e) {
      console.error('Erro ao buscar usuário atual:', e);
      return null;
    }
  }
};