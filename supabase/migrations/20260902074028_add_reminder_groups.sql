begin;

set local lock_timeout = '5s';

create table public.reminder_groups (
  reminder_id uuid not null
    references public.reminders (id) on delete cascade,
  group_id uuid not null
    references public.group_nodes (id) on delete restrict,
  primary key (reminder_id, group_id)
);

create index reminder_groups_group_reminder_idx
  on public.reminder_groups (group_id, reminder_id);

insert into public.reminder_groups (reminder_id, group_id)
select id, group_id
from public.reminders
where group_id is not null;

create function private.validate_reminder_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reminder_sector_id uuid;
  group_sector_id uuid;
  group_is_archived boolean;
begin
  select sector_id
    into reminder_sector_id
  from public.reminders
  where id = new.reminder_id;

  if not found then
    raise exception 'The selected reminder does not exist.' using errcode = '23503';
  end if;

  select sector_id, is_archived
    into group_sector_id, group_is_archived
  from public.group_nodes
  where id = new.group_id;

  if not found or group_sector_id <> reminder_sector_id then
    raise exception 'The selected group does not belong to the reminder sector.'
      using errcode = '23503';
  end if;

  if group_is_archived then
    raise exception 'A reminder cannot be assigned to an archived group.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_reminder_group()
from public, anon, authenticated;

create trigger reminder_groups_validate_owner
before insert or update of reminder_id, group_id
on public.reminder_groups
for each row execute function private.validate_reminder_group();

alter table public.reminder_groups enable row level security;

create policy reminder_groups_select_visible
on public.reminder_groups for select to authenticated
using ((select private.can_view_reminder(reminder_id)));

create policy reminder_groups_insert_visible
on public.reminder_groups for insert to authenticated
with check ((select private.can_modify_reminder(reminder_id)));

create policy reminder_groups_delete_visible
on public.reminder_groups for delete to authenticated
using ((select private.can_modify_reminder(reminder_id)));

revoke all on table public.reminder_groups from anon, authenticated;
grant select, insert, delete on table public.reminder_groups to authenticated;

drop function public.create_reminder_with_assignees(
  uuid, uuid, text, text, timestamptz, boolean, text, uuid[]
);
drop function public.update_reminder_with_assignees(
  uuid, uuid, uuid, text, text, timestamptz, boolean, text, uuid[]
);

drop trigger reminders_validate_node on public.reminders;
drop function private.validate_reminder_node();
drop index public.reminders_group_due_idx;
drop index public.reminders_sector_group_idx;
alter table public.reminders
  drop constraint reminders_group_fkey,
  drop column group_id;

create function public.create_reminder_with_assignees(
  p_sector_id uuid,
  p_group_ids uuid[],
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
    title,
    description,
    due_at,
    due_all_day,
    priority
  )
  values (
    created_reminder_id,
    p_sector_id,
    p_title,
    p_description,
    p_due_at,
    p_due_all_day,
    p_priority
  );

  insert into public.reminder_groups (reminder_id, group_id)
  select created_reminder_id, group_id
  from (
    select distinct requested_group.group_id
    from unnest(coalesce(p_group_ids, '{}'::uuid[])) as requested_group(group_id)
  ) as distinct_groups
  where group_id is not null;

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
  p_group_ids uuid[],
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

  insert into public.reminder_groups (reminder_id, group_id)
  select updated_reminder_id, group_id
  from (
    select distinct requested_group.group_id
    from unnest(coalesce(p_group_ids, '{}'::uuid[])) as requested_group(group_id)
  ) as distinct_groups
  where group_id is not null
    and not exists (
      select 1
      from public.reminder_groups as existing_group
      where existing_group.reminder_id = updated_reminder_id
        and existing_group.group_id = distinct_groups.group_id
    );

  delete from public.reminder_groups
  where reminder_id = updated_reminder_id
    and not (group_id = any(coalesce(p_group_ids, '{}'::uuid[])));

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
  uuid, uuid[], text, text, timestamptz, boolean, text, uuid[]
) from public, anon, authenticated;
revoke all on function public.update_reminder_with_assignees(
  uuid, uuid, uuid[], text, text, timestamptz, boolean, text, uuid[]
) from public, anon, authenticated;

grant execute on function public.create_reminder_with_assignees(
  uuid, uuid[], text, text, timestamptz, boolean, text, uuid[]
) to authenticated;
grant execute on function public.update_reminder_with_assignees(
  uuid, uuid, uuid[], text, text, timestamptz, boolean, text, uuid[]
) to authenticated;

commit;
