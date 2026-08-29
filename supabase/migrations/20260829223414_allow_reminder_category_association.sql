begin;

drop trigger reminders_validate_group on public.reminders;

create function private.validate_reminder_node()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_is_archived boolean;
begin
  if new.group_id is null then
    return new;
  end if;

  select is_archived
    into owner_is_archived
  from public.group_nodes
  where id = new.group_id
    and sector_id = new.sector_id;

  if not found then
    raise exception 'The selected structure node does not belong to the sector.'
      using errcode = '23503';
  end if;

  if owner_is_archived then
    raise exception 'A reminder cannot be assigned to an archived structure node.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger reminders_validate_node
before insert or update of sector_id, group_id on public.reminders
for each row execute function private.validate_reminder_node();

revoke all on function private.validate_reminder_node()
from public, anon, authenticated;

drop function public.create_reminder_with_assignees(
  uuid, uuid, text, text, timestamptz, boolean, text, text, uuid[]
);

drop function public.update_reminder_with_assignees(
  uuid, uuid, uuid, text, text, timestamptz, boolean, text, text, uuid[]
);

create function public.create_reminder_with_assignees(
  p_sector_id uuid,
  p_group_id uuid,
  p_title text,
  p_description text,
  p_due_at timestamptz,
  p_due_all_day boolean,
  p_priority text,
  p_assignee_ids uuid[]
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  created_reminder_id uuid := gen_random_uuid();
begin
  insert into public.reminders (
    id,
    sector_id,
    group_id,
    title,
    description,
    due_at,
    due_all_day,
    priority
  )
  values (
    created_reminder_id,
    p_sector_id,
    p_group_id,
    p_title,
    p_description,
    p_due_at,
    p_due_all_day,
    p_priority
  );

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
    priority = p_priority
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
  uuid, uuid, text, text, timestamptz, boolean, text, uuid[]
) from public, anon, authenticated;
revoke all on function public.update_reminder_with_assignees(
  uuid, uuid, uuid, text, text, timestamptz, boolean, text, uuid[]
) from public, anon, authenticated;

grant execute on function public.create_reminder_with_assignees(
  uuid, uuid, text, text, timestamptz, boolean, text, uuid[]
) to authenticated;
grant execute on function public.update_reminder_with_assignees(
  uuid, uuid, uuid, text, text, timestamptz, boolean, text, uuid[]
) to authenticated;

commit;
