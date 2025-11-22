-- ⚠️ CUIDADO: Isso apaga todas as mensagens antigas para corrigir o erro
DROP TABLE IF EXISTS public.messages;
-- Recriar a tabela do zero com a estrutura correta
CREATE TABLE public.messages (
    id uuid default gen_random_uuid() primary key,
    process_id text not null,
    -- Garante que aceita "PROC-1234"
    sender_id text not null,
    sender_name text not null,
    role text not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Habilitar segurança
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- Criar políticas de acesso
CREATE POLICY "Enable read access for all users" ON public.messages FOR
SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.messages FOR
INSERT WITH CHECK (true);
-- Configurar Realtime
BEGIN;
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.messages;