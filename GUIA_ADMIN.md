# Guia de Configuração de Admin

Para garantir que o usuário `david@creditoprime.com.br` tenha acesso total como Administrador, siga estes passos simples no Supabase.

## Passo 1: Acessar o Editor SQL do Supabase

1.  Acesse o painel do seu projeto no [Supabase](https://supabase.com/dashboard).
2.  No menu lateral esquerdo, clique no ícone **SQL Editor** (parece um terminal `>_`).
3.  Clique em **"New Query"** (ou "Nova Consulta").

## Passo 2: Executar o Comando de Atualização

Copie e cole o seguinte código SQL na área de edição:

```sql
-- Atualiza o perfil do David para ser Admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'david@creditoprime.com.br';

-- Verifica se a atualização funcionou
SELECT * FROM profiles WHERE email = 'david@creditoprime.com.br';

-- CRIAR TABELAS PARA CHAT E NOTIFICAÇÕES (NOVO)
-- Rode isso para habilitar as novas funcionalidades

create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  process_id text not null,
  sender_id text not null,
  sender_name text not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  title text not null,
  message text not null,
  read boolean default false,
  type text default 'info',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Realtime para messages e notifications
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
```

1.  Clique no botão **"Run"** (ou pressione `Ctrl + Enter`).
2.  Na área de resultados ("Results"), verifique se a coluna `role` agora mostra `admin`.

## Passo 3: Testar no Sistema

1.  Volte para o seu sistema (localhost ou deploy).
2.  Se estiver logado, faça **Logout** (Sair).
3.  Faça **Login** novamente com `david@creditoprime.com.br`.
4.  Você deverá ver o "Painel Administrativo" e ter acesso a todas as funções.

---
**Nota**: Se o comando SQL não retornar nenhum resultado, significa que o usuário ainda não fez o primeiro login ou cadastro. Certifique-se de ter criado a conta/logado pelo menos uma vez antes de rodar o comando.
