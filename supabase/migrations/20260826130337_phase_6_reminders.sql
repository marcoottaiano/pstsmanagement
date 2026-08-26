begin;

alter table public.reminders
add column due_all_day boolean not null default true;

update public.reminders
set priority = 'NORMAL'
where priority is null
   or priority not in ('LOW', 'NORMAL', 'HIGH');

alter table public.reminders
alter column priority set default 'NORMAL',
alter column priority set not null;

alter table public.reminders
add constraint reminders_priority_check
check (priority in ('LOW', 'NORMAL', 'HIGH'));

create function public.create_reminder_with_assignees(
  p_sector_id uuid,
  p_group_id uuid,
  p_title text,
  p_description text,
  p_due_at timestamptz,
  p_due_all_day boolean,
  p_priority text,
  p_status text,
  p_assignee_ids uuid[]
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  created_reminder_id uuid;
begin
  insert into public.reminders (
    sector_id,
    group_id,
    title,
    description,
    due_at,
    due_all_day,
    priority,
    status
  )
  values (
    p_sector_id,
    p_group_id,
    p_title,
    p_description,
    p_due_at,
    p_due_all_day,
    p_priority,
    p_status
  )
  returning id into created_reminder_id;

  insert into public.reminder_assignees (reminder_id, user_id)
  select created_reminder_id, assignee_id
  from (
    select distinct unnest(coalesce(p_assignee_ids, '{}'::uuid[])) as assignee_id
  ) as requested_assignees
  where assignee_id is not null;

  return created_reminder_id;
end;
$$;

create function public.update_reminder_with_assignees(
  p_reminder_id uuid,
  p_sector_id uuid,
  p_group_id uuid,
  p_title text,
  p_description text,
  p_due_at timestamptz,
  p_due_all_day boolean,
  p_priority text,
  p_status text,
  p_assignee_ids uuid[]
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  updated_reminder_id uuid;
begin
  update public.reminders
  set
    group_id = p_group_id,
    title = p_title,
    description = p_description,
    due_at = p_due_at,
    due_all_day = p_due_all_day,
    priority = p_priority,
    status = p_status
  where id = p_reminder_id
    and sector_id = p_sector_id
  returning id into updated_reminder_id;

  if updated_reminder_id is null then
    raise exception 'The reminder is not available or is not authorized.' using errcode = 'P0002';
  end if;

  insert into public.reminder_assignees (reminder_id, user_id)
  select updated_reminder_id, assignee_id
  from (
    select distinct unnest(coalesce(p_assignee_ids, '{}'::uuid[])) as assignee_id
  ) as requested_assignees
  where assignee_id is not null
  on conflict (reminder_id, user_id) do nothing;

  delete from public.reminder_assignees
  where reminder_id = updated_reminder_id
    and not (user_id = any(coalesce(p_assignee_ids, '{}'::uuid[])));

  return updated_reminder_id;
end;
$$;

revoke all on function public.create_reminder_with_assignees(
  uuid, uuid, text, text, timestamptz, boolean, text, text, uuid[]
) from public, anon, authenticated;
revoke all on function public.update_reminder_with_assignees(
  uuid, uuid, uuid, text, text, timestamptz, boolean, text, text, uuid[]
) from public, anon, authenticated;

grant execute on function public.create_reminder_with_assignees(
  uuid, uuid, text, text, timestamptz, boolean, text, text, uuid[]
) to authenticated;
grant execute on function public.update_reminder_with_assignees(
  uuid, uuid, uuid, text, text, timestamptz, boolean, text, text, uuid[]
) to authenticated;

commit;
