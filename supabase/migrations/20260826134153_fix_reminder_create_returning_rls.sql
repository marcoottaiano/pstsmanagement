begin;

create or replace function public.create_reminder_with_assignees(
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
    priority,
    status
  )
  values (
    created_reminder_id,
    p_sector_id,
    p_group_id,
    p_title,
    p_description,
    p_due_at,
    p_due_all_day,
    p_priority,
    p_status
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

commit;
