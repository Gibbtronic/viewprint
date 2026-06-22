-- profiles: lightweight directory of users, used for email-based invites and owner display names
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles read" on profiles for select to authenticated using (true);

-- Keep profiles in sync with auth.users
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Backfill existing users
insert into profiles (id, email, name)
select id, email, raw_user_meta_data->>'name' from auth.users
on conflict (id) do nothing;

-- blueprint_collaborators: grants a user edit access to a blueprint they don't own
create table if not exists blueprint_collaborators (
  id            uuid primary key default gen_random_uuid(),
  blueprint_id  uuid references blueprints(id) on delete cascade not null,
  user_id       uuid references profiles(id) on delete cascade not null,
  created_at    timestamptz not null default now(),
  unique (blueprint_id, user_id)
);

alter table blueprint_collaborators enable row level security;

create policy "collaborators select" on blueprint_collaborators for select using (
  auth.uid() = user_id
  or exists (select 1 from blueprints b where b.id = blueprint_id and b.owner_id = auth.uid())
);

create policy "collaborators insert" on blueprint_collaborators for insert with check (
  exists (select 1 from blueprints b where b.id = blueprint_id and b.owner_id = auth.uid())
);

create policy "collaborators delete" on blueprint_collaborators for delete using (
  auth.uid() = user_id
  or exists (select 1 from blueprints b where b.id = blueprint_id and b.owner_id = auth.uid())
);

-- Extend blueprints access to collaborators (owner keeps full control; collaborators can view/edit, not delete)
drop policy if exists "owner select" on blueprints;
drop policy if exists "owner update" on blueprints;

create policy "owner or collaborator select" on blueprints for select using (
  auth.uid() = owner_id
  or exists (select 1 from blueprint_collaborators c where c.blueprint_id = id and c.user_id = auth.uid())
);

create policy "owner or collaborator update" on blueprints for update using (
  auth.uid() = owner_id
  or exists (select 1 from blueprint_collaborators c where c.blueprint_id = id and c.user_id = auth.uid())
);
