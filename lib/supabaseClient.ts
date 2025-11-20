import { createClient } from '@supabase/supabase-js';

// Tenta buscar as variáveis de ambiente de diferentes formas (Vite, Create React App, etc)
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('ATENÇÃO: Variáveis de ambiente do Supabase não encontradas. O sistema pode não funcionar corretamente localmente.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);