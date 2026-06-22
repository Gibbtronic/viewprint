-- 002 introduced a circular RLS dependency: the blueprints policy checks
-- blueprint_collaborators, and blueprint_collaborators' policy checks back into
-- blueprints. Postgres detects this and raises "infinite recursion detected in
-- policy for relation" for every query against either table.
--
-- Fix: use security definer helper functions to check ownership/collaboration.
-- These run with the privileges of the function owner and bypass RLS on the
-- table they query, breaking the cycle.

create or replace function is_blueprint_owner(p_blueprint_id uuid, p_user_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from blueprints b
    where b.id = p_blueprint_id and b.owner_id = p_user_id
  );
$$;

create or replace function is_blueprint_collaborator(p_blueprint_id uuid, p_user_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from blueprint_collaborators c
    where c.blueprint_id = p_blueprint_id and c.user_id = p_user_id
  );
$$;

grant execute on function is_blueprint_owner(uuid, uuid) to authenticated;
grant execute on function is_blueprint_collaborator(uuid, uuid) to authenticated;

drop policy if exists "owner or collaborator select" on blueprints;
drop policy if exists "owner or collaborator update" on blueprints;
drop policy if exists "collaborators select" on blueprint_collaborators;
drop policy if exists "collaborators insert" on blueprint_collaborators;
drop policy if exists "collaborators delete" on blueprint_collaborators;

create policy "owner or collaborator select" on blueprints for select using (
  auth.uid() = owner_id or is_blueprint_collaborator(id, auth.uid())
);

create policy "owner or collaborator update" on blueprints for update using (
  auth.uid() = owner_id or is_blueprint_collaborator(id, auth.uid())
);

create policy "collaborators select" on blueprint_collaborators for select using (
  auth.uid() = user_id or is_blueprint_owner(blueprint_id, auth.uid())
);

create policy "collaborators insert" on blueprint_collaborators for insert with check (
  is_blueprint_owner(blueprint_id, auth.uid())
);

create policy "collaborators delete" on blueprint_collaborators for delete using (
  auth.uid() = user_id or is_blueprint_owner(blueprint_id, auth.uid())
);
