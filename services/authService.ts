import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';

export const authService = {

  loginWithPassword: async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) return { user: null, error: 'Email ou senha incorretos.' };
      if (!authData.user) return { user: null, error: 'Usuário não encontrado.' };

      // Tenta buscar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // HARDCODE DE SEGURANÇA: Se for o David, força ADMIN
      let role: UserRole = 'client';
      if (authData.user.email?.toLowerCase() === 'david@creditoprime.com.br') {
        role = 'admin';
      } else if (profile && profile.role) {
        role = profile.role as UserRole;
      }

      // Nome Fallback
      const name = profile?.name || authData.user.email || 'Usuário';

      const user: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        name: name,
        role: role,
        avatar_url: profile?.avatar_url
      };

      return { user, error: null };
    } catch (e: any) {
      return { user: null, error: e.message };
    }
  },

  register: async (email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      // 1. Cria usuário na Auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });

      if (authError) return { user: null, error: authError.message };
      if (!authData.user) return { user: null, error: 'Erro ao criar usuário.' };

      // 2. Cria perfil na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          name: name,
          role: 'client' // O Trigger do banco vai mudar para 'attendant' se o email estiver autorizado
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        name: name,
        role: 'client'
      };

      return { user, error: null };

    } catch (e: any) {
      return { user: null, error: e.message };
    }
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // HARDCODE DE SEGURANÇA: Se for o David, força ADMIN
    let role: UserRole = 'client';
    if (session.user.email?.toLowerCase() === 'david@creditoprime.com.br') {
      role = 'admin';
    } else if (profile && profile.role) {
      role = profile.role as UserRole;
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: profile?.name || session.user.email || 'Usuário',
      role: role,
    };
  }
};