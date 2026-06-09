drop function if exists public.create_church_for_current_user(text);
drop function if exists public.join_church_for_current_user(text, text);

create or replace function public.create_church_for_current_user(requested_church_name text)
returns table (
  membership_id uuid,
  church_id uuid,
  church_name text,
  church_slug text,
  role text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  created_church public.churches%rowtype;
  created_membership public.church_memberships%rowtype;
  base_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(requested_church_name), '') is null then
    raise exception 'Church name is required';
  end if;

  base_slug := lower(regexp_replace(trim(requested_church_name), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  if base_slug = '' then
    base_slug := 'church';
  end if;

  insert into public.churches (name, slug)
  values (
    trim(requested_church_name),
    base_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  )
  returning * into created_church;

  insert into public.church_memberships (church_id, user_id, role, status)
  values (created_church.id, auth.uid(), 'owner', 'active')
  returning * into created_membership;

  return query
  select
    created_membership.id,
    created_church.id,
    created_church.name,
    created_church.slug,
    created_membership.role,
    created_membership.status;
end;
$$;

create or replace function public.join_church_for_current_user(requested_join_code text, requested_role text default 'viewer')
returns table (
  membership_id uuid,
  church_id uuid,
  church_name text,
  church_slug text,
  role text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_church public.churches%rowtype;
  created_membership public.church_memberships%rowtype;
  safe_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  safe_role := coalesce(nullif(requested_role, ''), 'viewer');

  if safe_role not in ('leader', 'volunteer', 'viewer') then
    raise exception 'Invalid requested role';
  end if;

  select * into target_church
  from public.churches
  where join_code = upper(trim(requested_join_code))
  limit 1;

  if target_church.id is null then
    raise exception 'Church join code was not found';
  end if;

  insert into public.church_memberships (church_id, user_id, role, status)
  values (target_church.id, auth.uid(), safe_role, 'invited')
  on conflict (church_id, user_id)
  do update set
    role = case
      when public.church_memberships.status = 'active' then public.church_memberships.role
      else excluded.role
    end,
    status = case
      when public.church_memberships.status = 'active' then 'active'
      else 'invited'
    end,
    updated_at = now()
  returning * into created_membership;

  return query
  select
    created_membership.id,
    target_church.id,
    target_church.name,
    target_church.slug,
    created_membership.role,
    created_membership.status;
end;
$$;

create or replace function public.list_church_team(target_church_id uuid)
returns table (
  membership_id uuid,
  user_id uuid,
  email text,
  role text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select
    memberships.id as membership_id,
    memberships.user_id,
    coalesce(users.email::text, 'Unknown user') as email,
    memberships.role,
    memberships.status,
    memberships.created_at,
    memberships.updated_at
  from public.church_memberships memberships
  left join auth.users users on users.id = memberships.user_id
  where memberships.church_id = target_church_id
    and public.has_church_role(target_church_id, array['owner', 'admin'])
  order by
    case memberships.status
      when 'invited' then 0
      when 'active' then 1
      else 2
    end,
    memberships.created_at asc;
$$;

create or replace function public.update_church_team_member(
  target_membership_id uuid,
  requested_role text,
  requested_status text
)
returns table (
  membership_id uuid,
  user_id uuid,
  email text,
  role text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_membership public.church_memberships%rowtype;
  active_owner_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if requested_role not in ('owner', 'admin', 'leader', 'volunteer', 'viewer') then
    raise exception 'Invalid role';
  end if;

  if requested_status not in ('active', 'invited', 'disabled') then
    raise exception 'Invalid status';
  end if;

  select * into target_membership
  from public.church_memberships
  where id = target_membership_id;

  if target_membership.id is null then
    raise exception 'Team member not found';
  end if;

  if not public.has_church_role(target_membership.church_id, array['owner', 'admin']) then
    raise exception 'Owner or admin access required';
  end if;

  if target_membership.user_id = auth.uid() and target_membership.role = 'owner' and (requested_role <> 'owner' or requested_status <> 'active') then
    select count(*) into active_owner_count
    from public.church_memberships
    where church_id = target_membership.church_id
      and role = 'owner'
      and status = 'active';

    if active_owner_count <= 1 then
      raise exception 'A church must keep at least one active owner';
    end if;
  end if;

  update public.church_memberships
  set role = requested_role,
      status = requested_status,
      updated_at = now()
  where id = target_membership_id;

  return query
  select *
  from public.list_church_team(target_membership.church_id)
  where list_church_team.membership_id = target_membership_id;
end;
$$;

create or replace function public.disable_church_team_member(target_membership_id uuid)
returns table (
  membership_id uuid,
  user_id uuid,
  email text,
  role text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_membership public.church_memberships%rowtype;
begin
  select * into target_membership
  from public.church_memberships
  where id = target_membership_id;

  if target_membership.id is null then
    raise exception 'Team member not found';
  end if;

  return query
  select *
  from public.update_church_team_member(target_membership_id, target_membership.role, 'disabled');
end;
$$;

revoke all on function public.create_church_for_current_user(text) from public;
revoke all on function public.join_church_for_current_user(text, text) from public;
revoke all on function public.list_church_team(uuid) from public;
revoke all on function public.update_church_team_member(uuid, text, text) from public;
revoke all on function public.disable_church_team_member(uuid) from public;

grant execute on function public.create_church_for_current_user(text) to authenticated;
grant execute on function public.join_church_for_current_user(text, text) to authenticated;
grant execute on function public.list_church_team(uuid) to authenticated;
grant execute on function public.update_church_team_member(uuid, text, text) to authenticated;
grant execute on function public.disable_church_team_member(uuid) to authenticated;
