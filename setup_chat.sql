-- Create messages table
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    process_id text not null,
    -- Linking to process ID (which might be int or uuid, stored as text here for flexibility)
    sender_id text not null,
    sender_name text not null,
    role text not null,
    -- 'client', 'admin', 'attendant', 'system'
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.messages enable row level security;
-- Policies (Broad access for now to ensure functionality, can be tightened later)
create policy "Enable read access for all users" on public.messages for
select using (true);
create policy "Enable insert access for all users" on public.messages for
insert with check (true);
-- Realtime
begin;
drop publication if exists supabase_realtime;
create publication supabase_realtime;
commit;
alter publication supabase_realtime
add table public.messages;