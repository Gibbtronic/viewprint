-- blueprints table
create table if not exists blueprints (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users(id) on delete cascade not null,
  title       text not null default 'Untitled blueprint',
  markdown    text not null default '',
  status      text not null default 'Draft' check (status in ('Published', 'Draft')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security: users can only see / modify their own blueprints
alter table blueprints enable row level security;

create policy "owner select" on blueprints for select using (auth.uid() = owner_id);
create policy "owner insert" on blueprints for insert with check (auth.uid() = owner_id);
create policy "owner update" on blueprints for update using (auth.uid() = owner_id);
create policy "owner delete" on blueprints for delete using (auth.uid() = owner_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger blueprints_updated_at
  before update on blueprints
  for each row execute procedure set_updated_at();
