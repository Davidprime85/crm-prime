-- 1. Limpeza (Evita erros se já existir)
drop policy if exists "Admins can manage attendant emails" on public.attendant_emails;
drop policy if exists "Public can read attendant emails" on public.attendant_emails;

create table if not exists public.attendant_emails (
  email text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita RLS
alter table public.attendant_emails enable row level security;

-- 2. Criação da Política de Segurança (Apenas Admin vê)
create policy "Admins can manage attendant emails" on public.attendant_emails for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 3. Função para interceptar o cadastro e dar o cargo automaticamente
create or replace function public.handle_new_attendant_role()
returns trigger as $$
begin
  -- Verifica se o email do novo perfil está na lista de autorizados
  if exists (select 1 from public.attendant_emails where email = new.email) then
    new.role := 'attendant'; -- Força o cargo de atendente
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 4. Gatilho (Trigger) que roda ANTES de salvar o perfil
drop trigger if exists check_attendant_role_on_insert on public.profiles;
create trigger check_attendant_role_on_insert
before insert on public.profiles
for each row execute procedure public.handle_new_attendant_role();
