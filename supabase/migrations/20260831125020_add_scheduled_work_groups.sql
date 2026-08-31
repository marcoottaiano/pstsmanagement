begin;

set local lock_timeout = '5s';

create table public.scheduled_work_groups (
  scheduled_work_id uuid not null
    references public.scheduled_work (id) on delete cascade,
  group_id uuid not null
    references public.group_nodes (id) on delete restrict,
  primary key (scheduled_work_id, group_id)
);

create index scheduled_work_groups_group_work_idx
  on public.scheduled_work_groups (group_id, scheduled_work_id);

insert into public.scheduled_work_groups (scheduled_work_id, group_id)
select id, group_id
from public.scheduled_work;

create function private.validate_scheduled_work_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_sector_id uuid;
  group_sector_id uuid;
  group_is_archived boolean;
begin
  select sector_id
    into work_sector_id
  from public.scheduled_work
  where id = new.scheduled_work_id;

  if not found then
    raise exception 'The selected scheduled work does not exist.' using errcode = '23503';
  end if;

  select sector_id, is_archived
    into group_sector_id, group_is_archived
  from public.group_nodes
  where id = new.group_id;

  if not found or group_sector_id <> work_sector_id then
    raise exception 'The selected group does not belong to the scheduled work sector.'
      using errcode = '23503';
  end if;

  if group_is_archived then
    raise exception 'Scheduled work cannot be assigned to an archived group.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_scheduled_work_group()
from public, anon, authenticated;

create trigger scheduled_work_groups_validate_owner
before insert or update of scheduled_work_id, group_id
on public.scheduled_work_groups
for each row execute function private.validate_scheduled_work_group();

create function private.ensure_scheduled_work_has_groups()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_work_id uuid;
begin
  if tg_table_name = 'scheduled_work' then
    target_work_id := new.id;
  elsif tg_op = 'DELETE' then
    target_work_id := old.scheduled_work_id;
  else
    target_work_id := new.scheduled_work_id;
  end if;

  if exists (
    select 1
    from public.scheduled_work
    where id = target_work_id
  ) and not exists (
    select 1
    from public.scheduled_work_groups
    where scheduled_work_id = target_work_id
  ) then
    raise exception 'Scheduled work must belong to at least one group.' using errcode = '23514';
  end if;

  return null;
end;
$$;

revoke all on function private.ensure_scheduled_work_has_groups()
from public, anon, authenticated;

create constraint trigger scheduled_work_requires_groups
after insert on public.scheduled_work
deferrable initially deferred
for each row execute function private.ensure_scheduled_work_has_groups();

create constraint trigger scheduled_work_groups_preserve_assignment
after delete or update on public.scheduled_work_groups
deferrable initially deferred
for each row execute function private.ensure_scheduled_work_has_groups();

alter table public.scheduled_work_groups enable row level security;

create policy scheduled_work_groups_select_accessible
on public.scheduled_work_groups for select to authenticated
using (
  exists (
    select 1
    from public.scheduled_work as work
    where work.id = scheduled_work_id
      and (select private.has_sector_access(work.sector_id))
  )
);

create policy scheduled_work_groups_insert_accessible
on public.scheduled_work_groups for insert to authenticated
with check (
  exists (
    select 1
    from public.scheduled_work as work
    where work.id = scheduled_work_id
      and (select private.has_sector_access(work.sector_id))
  )
);

create policy scheduled_work_groups_delete_accessible
on public.scheduled_work_groups for delete to authenticated
using (
  exists (
    select 1
    from public.scheduled_work as work
    where work.id = scheduled_work_id
      and (select private.has_sector_access(work.sector_id))
  )
);

revoke all on table public.scheduled_work_groups from anon, authenticated;
grant select, insert, delete on table public.scheduled_work_groups to authenticated;

drop trigger scheduled_work_validate_group on public.scheduled_work;
drop index public.scheduled_work_group_start_idx;
drop index public.scheduled_work_sector_group_idx;
alter table public.scheduled_work
  drop constraint scheduled_work_group_fkey,
  drop column group_id;

create function public.create_scheduled_work_with_groups(
  p_sector_id uuid,
  p_group_ids uuid[],
  p_title text,
  p_description text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_all_day boolean
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  created_work_id uuid := gen_random_uuid();
begin
  if not exists (
    select 1
    from unnest(coalesce(p_group_ids, '{}'::uuid[])) as requested_group(group_id)
    where group_id is not null
  ) then
    raise exception 'Scheduled work must belong to at least one group.' using errcode = '23514';
  end if;

  insert into public.scheduled_work (
    id,
    sector_id,
    title,
    description,
    start_at,
    end_at,
    all_day
  )
  values (
    created_work_id,
    p_sector_id,
    p_title,
    p_description,
    p_start_at,
    p_end_at,
    p_all_day
  );

  insert into public.scheduled_work_groups (scheduled_work_id, group_id)
  select created_work_id, group_id
  from (
    select distinct requested_group.group_id
    from unnest(coalesce(p_group_ids, '{}'::uuid[])) as requested_group(group_id)
  ) as distinct_groups
  where group_id is not null;

  return created_work_id;
end;
$$;

create function public.update_scheduled_work_with_groups(
  p_scheduled_work_id uuid,
  p_sector_id uuid,
  p_group_ids uuid[],
  p_title text,
  p_description text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_all_day boolean
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  updated_work_id uuid;
begin
  if not exists (
    select 1
    from unnest(coalesce(p_group_ids, '{}'::uuid[])) as requested_group(group_id)
    where group_id is not null
  ) then
    raise exception 'Scheduled work must belong to at least one group.' using errcode = '23514';
  end if;

  update public.scheduled_work
  set
    title = p_title,
    description = p_description,
    start_at = p_start_at,
    end_at = p_end_at,
    all_day = p_all_day
  where id = p_scheduled_work_id
    and sector_id = p_sector_id
  returning id into updated_work_id;

  if updated_work_id is null then
    raise exception 'The scheduled work is not available or is not authorized.' using errcode = 'P0002';
  end if;

  insert into public.scheduled_work_groups (scheduled_work_id, group_id)
  select updated_work_id, group_id
  from (
    select distinct requested_group.group_id
    from unnest(coalesce(p_group_ids, '{}'::uuid[])) as requested_group(group_id)
  ) as distinct_groups
  where group_id is not null
    and not exists (
      select 1
      from public.scheduled_work_groups as existing_group
      where existing_group.scheduled_work_id = updated_work_id
        and existing_group.group_id = distinct_groups.group_id
    );

  delete from public.scheduled_work_groups
  where scheduled_work_id = updated_work_id
    and not (group_id = any(coalesce(p_group_ids, '{}'::uuid[])));

  return updated_work_id;
end;
$$;

revoke all on function public.create_scheduled_work_with_groups(
  uuid, uuid[], text, text, timestamptz, timestamptz, boolean
) from public, anon, authenticated;
revoke all on function public.update_scheduled_work_with_groups(
  uuid, uuid, uuid[], text, text, timestamptz, timestamptz, boolean
) from public, anon, authenticated;

grant execute on function public.create_scheduled_work_with_groups(
  uuid, uuid[], text, text, timestamptz, timestamptz, boolean
) to authenticated;
grant execute on function public.update_scheduled_work_with_groups(
  uuid, uuid, uuid[], text, text, timestamptz, timestamptz, boolean
) to authenticated;

commit;
