create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.church_memberships (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'leader' check (role in ('owner', 'admin', 'leader', 'volunteer', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, user_id)
);

alter table public.profiles add column if not exists default_church_id uuid references public.churches(id) on delete set null;
alter table public.youths add column if not exists church_id uuid references public.churches(id) on delete cascade;
alter table public.programs add column if not exists church_id uuid references public.churches(id) on delete cascade;
alter table public.attendance_records add column if not exists church_id uuid references public.churches(id) on delete cascade;

insert into public.churches (name, slug)
select 'Ivula Demo Church', 'ivula-demo-church'
where not exists (select 1 from public.churches where slug = 'ivula-demo-church');

update public.youths
set church_id = (select id from public.churches where slug = 'ivula-demo-church')
where church_id is null;

update public.programs
set church_id = (select id from public.churches where slug = 'ivula-demo-church')
where church_id is null;

update public.attendance_records
set church_id = coalesce(
  (select church_id from public.youths where youths.id = attendance_records.youth_id),
  (select id from public.churches where slug = 'ivula-demo-church')
)
where church_id is null;

alter table public.youths alter column church_id set not null;
alter table public.programs alter column church_id set not null;
alter table public.attendance_records alter column church_id set not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists churches_set_updated_at on public.churches;
create trigger churches_set_updated_at before update on public.churches for each row execute function public.set_updated_at();

drop trigger if exists church_memberships_set_updated_at on public.church_memberships;
create trigger church_memberships_set_updated_at before update on public.church_memberships for each row execute function public.set_updated_at();

create or replace function public.is_church_member(target_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.church_memberships
    where church_id = target_church_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.current_church_role(target_church_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.church_memberships
  where church_id = target_church_id
    and user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

create or replace function public.can_manage_church(target_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_church_role(target_church_id) in ('owner', 'admin');
$$;

create or replace function public.can_edit_church_records(target_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_church_role(target_church_id) in ('owner', 'admin', 'leader');
$$;

create or replace function public.can_record_church_attendance(target_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_church_role(target_church_id) in ('owner', 'admin', 'leader', 'volunteer');
$$;

create or replace function public.church_has_members(target_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.church_memberships
    where church_id = target_church_id
      and status = 'active'
  );
$$;

alter table public.churches enable row level security;
alter table public.church_memberships enable row level security;

drop policy if exists "Members can read their churches" on public.churches;
create policy "Members can read their churches"
on public.churches for select
to authenticated
using (public.is_church_member(id));

drop policy if exists "Authenticated users can create churches" on public.churches;
create policy "Authenticated users can create churches"
on public.churches for insert
to authenticated
with check (true);

drop policy if exists "Managers can update churches" on public.churches;
create policy "Managers can update churches"
on public.churches for update
to authenticated
using (public.can_manage_church(id))
with check (public.can_manage_church(id));

drop policy if exists "Owners can delete churches" on public.churches;
create policy "Owners can delete churches"
on public.churches for delete
to authenticated
using (public.current_church_role(id) = 'owner');

drop policy if exists "Members can read church memberships" on public.church_memberships;
create policy "Members can read church memberships"
on public.church_memberships for select
to authenticated
using (user_id = (select auth.uid()) or public.can_manage_church(church_id));

drop policy if exists "Users can create first owner membership" on public.church_memberships;
create policy "Users can create first owner membership"
on public.church_memberships for insert
to authenticated
with check (
  (
    user_id = (select auth.uid())
    and role = 'owner'
    and status = 'active'
    and not public.church_has_members(church_id)
  )
  or public.can_manage_church(church_id)
);

drop policy if exists "Managers can update memberships" on public.church_memberships;
create policy "Managers can update memberships"
on public.church_memberships for update
to authenticated
using (public.can_manage_church(church_id))
with check (public.can_manage_church(church_id));

drop policy if exists "Managers can delete memberships" on public.church_memberships;
create policy "Managers can delete memberships"
on public.church_memberships for delete
to authenticated
using (public.can_manage_church(church_id));

drop policy if exists "Authenticated users can read youths" on public.youths;
create policy "Church members can read youths"
on public.youths for select
to authenticated
using (public.is_church_member(church_id));

drop policy if exists "Authenticated users can insert youths" on public.youths;
create policy "Church editors can insert youths"
on public.youths for insert
to authenticated
with check (public.can_edit_church_records(church_id));

drop policy if exists "Authenticated users can update youths" on public.youths;
create policy "Church editors can update youths"
on public.youths for update
to authenticated
using (public.can_edit_church_records(church_id))
with check (public.can_edit_church_records(church_id));

drop policy if exists "Authenticated users can delete youths" on public.youths;
create policy "Church managers can delete youths"
on public.youths for delete
to authenticated
using (public.can_manage_church(church_id));

drop policy if exists "Authenticated users can read programs" on public.programs;
create policy "Church members can read programs"
on public.programs for select
to authenticated
using (public.is_church_member(church_id));

drop policy if exists "Authenticated users can insert programs" on public.programs;
create policy "Church editors can insert programs"
on public.programs for insert
to authenticated
with check (public.can_edit_church_records(church_id));

drop policy if exists "Authenticated users can update programs" on public.programs;
create policy "Church editors can update programs"
on public.programs for update
to authenticated
using (public.can_edit_church_records(church_id))
with check (public.can_edit_church_records(church_id));

drop policy if exists "Authenticated users can delete programs" on public.programs;
create policy "Church managers can delete programs"
on public.programs for delete
to authenticated
using (public.can_manage_church(church_id));

drop policy if exists "Authenticated users can read attendance" on public.attendance_records;
create policy "Church members can read attendance"
on public.attendance_records for select
to authenticated
using (public.is_church_member(church_id));

drop policy if exists "Authenticated users can insert attendance" on public.attendance_records;
create policy "Church attendance recorders can insert attendance"
on public.attendance_records for insert
to authenticated
with check (public.can_record_church_attendance(church_id));

drop policy if exists "Authenticated users can update attendance" on public.attendance_records;
create policy "Church editors can update attendance"
on public.attendance_records for update
to authenticated
using (public.can_edit_church_records(church_id))
with check (public.can_edit_church_records(church_id));

drop policy if exists "Authenticated users can delete attendance" on public.attendance_records;
create policy "Church managers can delete attendance"
on public.attendance_records for delete
to authenticated
using (public.can_manage_church(church_id));

create index if not exists church_memberships_user_id_idx on public.church_memberships(user_id);
create index if not exists church_memberships_church_id_idx on public.church_memberships(church_id);
create index if not exists youths_church_id_idx on public.youths(church_id);
create index if not exists programs_church_id_idx on public.programs(church_id);
create index if not exists attendance_records_church_id_idx on public.attendance_records(church_id);

grant select, insert, update, delete on table public.churches to authenticated;
grant select, insert, update, delete on table public.church_memberships to authenticated;
