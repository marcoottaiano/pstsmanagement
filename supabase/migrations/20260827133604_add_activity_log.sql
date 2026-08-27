create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_name text not null check (length(trim(actor_name)) > 0),
  actor_email text,
  action text not null check (
    action in (
      'CREATED',
      'UPDATED',
      'DELETED',
      'COMPLETED',
      'REOPENED',
      'ARCHIVED',
      'RESTORED',
      'INVITED',
      'ACCESS_UPDATED',
      'USER_DELETED'
    )
  ),
  entity_type text not null check (
    entity_type in ('SCHEDULED_WORK', 'REMINDER', 'OBJECTIVE', 'GROUP', 'USER')
  ),
  entity_id uuid,
  entity_title text not null check (length(trim(entity_title)) > 0),
  sector_id uuid references public.sectors (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index activity_log_created_at_idx
  on public.activity_log (created_at desc);
create index activity_log_actor_created_at_idx
  on public.activity_log (actor_id, created_at desc);
create index activity_log_entity_type_created_at_idx
  on public.activity_log (entity_type, created_at desc);
create index activity_log_sector_created_at_idx
  on public.activity_log (sector_id, created_at desc);

alter table public.activity_log enable row level security;

create policy "Admins can read activity log"
on public.activity_log
for select
to authenticated
using ((select private.is_admin()));

revoke all on table public.activity_log from anon, authenticated;
grant select on table public.activity_log to authenticated;
grant select, insert on table public.activity_log to service_role;

create function private.log_planning_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_row jsonb;
  previous_row jsonb;
  activity_actor_id uuid := (select auth.uid());
  activity_actor_name text := 'Sistema';
  activity_actor_email text;
  activity_action text;
  activity_entity_type text;
  activity_entity_id uuid;
  activity_entity_title text;
  activity_sector_id uuid;
  activity_metadata jsonb := '{}'::jsonb;
begin
  if activity_actor_id is not null then
    select
      coalesce(nullif(trim(profile.display_name), ''), profile.email, 'Utente'),
      profile.email
    into activity_actor_name, activity_actor_email
    from public.profiles as profile
    where profile.id = activity_actor_id;

    activity_actor_name := coalesce(activity_actor_name, activity_actor_email, 'Utente');
  end if;

  if tg_op = 'DELETE' then
    source_row := to_jsonb(old);
  else
    source_row := to_jsonb(new);
  end if;

  if tg_op = 'UPDATE' then
    previous_row := to_jsonb(old);
  end if;

  activity_entity_id := (source_row ->> 'id')::uuid;
  activity_entity_title := coalesce(source_row ->> 'title', source_row ->> 'name');
  activity_sector_id := (source_row ->> 'sector_id')::uuid;

  activity_entity_type := case tg_table_name
    when 'scheduled_work' then 'SCHEDULED_WORK'
    when 'reminders' then 'REMINDER'
    when 'objectives' then 'OBJECTIVE'
    when 'group_nodes' then 'GROUP'
  end;

  activity_action := case tg_op
    when 'INSERT' then 'CREATED'
    when 'DELETE' then 'DELETED'
    else 'UPDATED'
  end;

  if tg_op = 'UPDATE' then
    if tg_table_name in ('reminders', 'objectives')
      and previous_row ->> 'status' is distinct from source_row ->> 'status'
    then
      activity_metadata := jsonb_build_object(
        'previous_status', previous_row ->> 'status',
        'current_status', source_row ->> 'status'
      );

      if source_row ->> 'status' = 'COMPLETED' then
        activity_action := 'COMPLETED';
      elsif previous_row ->> 'status' = 'COMPLETED' then
        activity_action := 'REOPENED';
      end if;
    elsif tg_table_name = 'group_nodes'
      and (previous_row ->> 'is_archived')::boolean is distinct from
        (source_row ->> 'is_archived')::boolean
    then
      activity_action := case (source_row ->> 'is_archived')::boolean
        when true then 'ARCHIVED'
        else 'RESTORED'
      end;
    end if;

    if previous_row ->> 'title' is distinct from source_row ->> 'title'
      or previous_row ->> 'name' is distinct from source_row ->> 'name'
    then
      activity_metadata := activity_metadata || jsonb_strip_nulls(
        jsonb_build_object(
          'previous_title', coalesce(previous_row ->> 'title', previous_row ->> 'name')
        )
      );
    end if;
  end if;

  insert into public.activity_log (
    actor_id,
    actor_name,
    actor_email,
    action,
    entity_type,
    entity_id,
    entity_title,
    sector_id,
    metadata
  )
  values (
    activity_actor_id,
    activity_actor_name,
    activity_actor_email,
    activity_action,
    activity_entity_type,
    activity_entity_id,
    activity_entity_title,
    activity_sector_id,
    activity_metadata
  );

  return null;
end;
$$;

revoke execute on function private.log_planning_activity()
from public, anon, authenticated, service_role;

create trigger scheduled_work_log_activity
after insert or update or delete on public.scheduled_work
for each row execute function private.log_planning_activity();

create trigger reminders_log_activity
after insert or update or delete on public.reminders
for each row execute function private.log_planning_activity();

create trigger objectives_log_activity
after insert or update or delete on public.objectives
for each row execute function private.log_planning_activity();

create trigger group_nodes_log_activity_on_insert_or_delete
after insert or delete on public.group_nodes
for each row execute function private.log_planning_activity();

create trigger group_nodes_log_activity_on_meaningful_update
after update on public.group_nodes
for each row
when (
  old.name is distinct from new.name
  or old.parent_id is distinct from new.parent_id
  or old.node_type is distinct from new.node_type
  or old.is_archived is distinct from new.is_archived
)
execute function private.log_planning_activity();
