alter table public.churches
  add column if not exists organization_type text not null default 'youth_program',
  add column if not exists member_label text not null default 'People',
  add column if not exists program_label text not null default 'Programs',
  add column if not exists group_label text not null default 'Groups',
  add column if not exists attendance_label text not null default 'Attendance',
  add column if not exists primary_focus text not null default 'Youth Programs';

create or replace function public.update_organization_settings(
  target_church_id uuid,
  requested_name text,
  requested_organization_type text,
  requested_member_label text,
  requested_program_label text,
  requested_group_label text,
  requested_attendance_label text,
  requested_primary_focus text
)
returns table (
  id uuid,
  name text,
  slug text,
  join_code text,
  organization_type text,
  member_label text,
  program_label text,
  group_label text,
  attendance_label text,
  primary_focus text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_church_role(target_church_id, array['owner', 'admin']) then
    raise exception 'Owner or admin access required';
  end if;

  if nullif(trim(requested_name), '') is null then
    raise exception 'Organization name is required';
  end if;

  update public.churches
  set name = trim(requested_name),
      organization_type = coalesce(nullif(trim(requested_organization_type), ''), 'other'),
      member_label = coalesce(nullif(trim(requested_member_label), ''), 'People'),
      program_label = coalesce(nullif(trim(requested_program_label), ''), 'Programs'),
      group_label = coalesce(nullif(trim(requested_group_label), ''), 'Groups'),
      attendance_label = coalesce(nullif(trim(requested_attendance_label), ''), 'Attendance'),
      primary_focus = coalesce(nullif(trim(requested_primary_focus), ''), 'Programs'),
      updated_at = now()
  where churches.id = target_church_id;

  return query
  select
    churches.id,
    churches.name,
    churches.slug,
    churches.join_code,
    churches.organization_type,
    churches.member_label,
    churches.program_label,
    churches.group_label,
    churches.attendance_label,
    churches.primary_focus
  from public.churches
  where churches.id = target_church_id;
end;
$$;

revoke all on function public.update_organization_settings(uuid, text, text, text, text, text, text, text) from public;
grant execute on function public.update_organization_settings(uuid, text, text, text, text, text, text, text) to authenticated;
