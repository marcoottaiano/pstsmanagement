begin;

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('artistic', 'rhythmic')),
  name text not null check (length(trim(name)) > 0)
);

create table public.user_sectors (
  user_id uuid not null references public.profiles (id) on delete cascade,
  sector_id uuid not null references public.sectors (id) on delete cascade,
  primary key (user_id, sector_id)
);

create table public.group_nodes (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete restrict,
  parent_id uuid,
  name text not null check (length(trim(name)) > 0),
  node_type text not null check (node_type in ('CATEGORY', 'GROUP')),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sector_id, id),
  constraint group_nodes_parent_fkey
    foreign key (sector_id, parent_id)
    references public.group_nodes (sector_id, id)
    on delete restrict
);

create table public.scheduled_work (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete restrict,
  group_id uuid not null,
  title text not null check (length(trim(title)) > 0),
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_work_group_fkey
    foreign key (sector_id, group_id)
    references public.group_nodes (sector_id, id)
    on delete restrict,
  constraint scheduled_work_valid_interval_check
    check (end_at is null or end_at >= start_at)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete restrict,
  group_id uuid,
  title text not null check (length(trim(title)) > 0),
  description text,
  due_at timestamptz,
  status text not null default 'OPEN' check (status in ('OPEN', 'COMPLETED')),
  priority text,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminders_group_fkey
    foreign key (sector_id, group_id)
    references public.group_nodes (sector_id, id)
    on delete restrict
);

create table public.reminder_assignees (
  reminder_id uuid not null references public.reminders (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (reminder_id, user_id)
);

create table public.objectives (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors (id) on delete restrict,
  group_id uuid not null,
  title text not null check (length(trim(title)) > 0),
  description text,
  status text not null default 'NOT_STARTED'
    check (status in ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED')),
  target_date date,
  period_start date,
  period_end date,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint objectives_group_fkey
    foreign key (sector_id, group_id)
    references public.group_nodes (sector_id, id)
    on delete restrict,
  constraint objectives_valid_period_check
    check (period_end is null or period_start is null or period_end >= period_start)
);

create index user_sectors_sector_user_idx
  on public.user_sectors (sector_id, user_id);

create index group_nodes_parent_idx
  on public.group_nodes (parent_id);
create index group_nodes_active_tree_idx
  on public.group_nodes (sector_id, parent_id, sort_order)
  where not is_archived;

create index scheduled_work_sector_start_idx
  on public.scheduled_work (sector_id, start_at);
create index scheduled_work_group_start_idx
  on public.scheduled_work (group_id, start_at);
create index scheduled_work_created_by_idx
  on public.scheduled_work (created_by);

create index reminders_sector_due_idx
  on public.reminders (sector_id, due_at)
  where due_at is not null;
create index reminders_group_due_idx
  on public.reminders (group_id, due_at)
  where group_id is not null and due_at is not null;
create index reminders_created_by_idx
  on public.reminders (created_by);

create index reminder_assignees_user_reminder_idx
  on public.reminder_assignees (user_id, reminder_id);

create index objectives_sector_group_idx
  on public.objectives (sector_id, group_id);
create index objectives_created_by_idx
  on public.objectives (created_by);

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.protect_creation_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Creation metadata cannot be changed.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Utente'
    ),
    new.email
  );

  return new;
end;
$$;

create function private.validate_group_node()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_sector_id uuid;
  parent_is_archived boolean;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A group node cannot be its own parent.' using errcode = '23514';
  end if;

  select sector_id, is_archived
    into parent_sector_id, parent_is_archived
  from public.group_nodes
  where id = new.parent_id;

  if not found then
    raise exception 'The selected parent does not exist.' using errcode = '23503';
  end if;

  if parent_sector_id <> new.sector_id then
    raise exception 'Parent and child must belong to the same sector.' using errcode = '23514';
  end if;

  if parent_is_archived then
    raise exception 'An archived node cannot receive new children.' using errcode = '23514';
  end if;

  if exists (
    with recursive ancestors as (
      select id, parent_id
      from public.group_nodes
      where id = new.parent_id

      union all

      select parent.id, parent.parent_id
      from public.group_nodes as parent
      join ancestors on parent.id = ancestors.parent_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'Moving this node would create a hierarchy cycle.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create function private.validate_group_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_type text;
  owner_is_archived boolean;
begin
  if new.group_id is null then
    return new;
  end if;

  select node_type, is_archived
    into owner_type, owner_is_archived
  from public.group_nodes
  where id = new.group_id and sector_id = new.sector_id;

  if not found then
    raise exception 'The selected group does not belong to the sector.' using errcode = '23503';
  end if;

  if owner_type <> 'GROUP' then
    raise exception 'Application data can only belong to GROUP nodes.' using errcode = '23514';
  end if;

  if owner_is_archived then
    raise exception 'Application data cannot be assigned to an archived group.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create function private.validate_reminder_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reminder_sector_id uuid;
begin
  select sector_id into reminder_sector_id
  from public.reminders
  where id = new.reminder_id;

  if not found then
    raise exception 'The selected reminder does not exist.' using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.user_sectors
    where user_id = new.user_id and sector_id = reminder_sector_id
  ) then
    raise exception 'The assignee does not have access to the reminder sector.' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger group_nodes_set_updated_at
before update on public.group_nodes
for each row execute function private.set_updated_at();
create trigger group_nodes_validate_hierarchy
before insert or update of parent_id, sector_id on public.group_nodes
for each row execute function private.validate_group_node();

create trigger scheduled_work_set_updated_at
before update on public.scheduled_work
for each row execute function private.set_updated_at();
create trigger scheduled_work_protect_creation_metadata
before update on public.scheduled_work
for each row execute function private.protect_creation_metadata();
create trigger scheduled_work_validate_group
before insert or update of sector_id, group_id on public.scheduled_work
for each row execute function private.validate_group_owner();

create trigger reminders_set_updated_at
before update on public.reminders
for each row execute function private.set_updated_at();
create trigger reminders_protect_creation_metadata
before update on public.reminders
for each row execute function private.protect_creation_metadata();
create trigger reminders_validate_group
before insert or update of sector_id, group_id on public.reminders
for each row execute function private.validate_group_owner();

create trigger reminder_assignees_validate_sector
before insert or update of reminder_id, user_id on public.reminder_assignees
for each row execute function private.validate_reminder_assignee();

create trigger objectives_set_updated_at
before update on public.objectives
for each row execute function private.set_updated_at();
create trigger objectives_protect_creation_metadata
before update on public.objectives
for each row execute function private.protect_creation_metadata();
create trigger objectives_validate_group
before insert or update of sector_id, group_id on public.objectives
for each row execute function private.validate_group_owner();

create trigger auth_user_created_create_profile
after insert on auth.users
for each row execute function private.handle_new_user();

create function private.has_sector_access(target_sector_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.user_sectors
      where user_id = (select auth.uid())
        and sector_id = target_sector_id
    );
$$;

create function private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) = target_user_id
    or exists (
      select 1
      from public.user_sectors as current_membership
      join public.user_sectors as target_membership
        on target_membership.sector_id = current_membership.sector_id
      where current_membership.user_id = (select auth.uid())
        and target_membership.user_id = target_user_id
    );
$$;

create function private.is_reminder_assignee(target_reminder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.reminder_assignees
    where reminder_id = target_reminder_id
      and user_id = (select auth.uid())
  );
$$;

create function private.can_view_reminder(target_reminder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.reminders
    where id = target_reminder_id
      and (
        (group_id is not null and (select private.has_sector_access(sector_id)))
        or (
          group_id is null
          and (
            created_by = (select auth.uid())
            or (select private.is_reminder_assignee(id))
          )
        )
      )
  );
$$;

create function private.can_modify_reminder(target_reminder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.reminders
    where id = target_reminder_id
      and (
        (group_id is not null and (select private.has_sector_access(sector_id)))
        or (
          group_id is null
          and (
            created_by = (select auth.uid())
            or (select private.is_reminder_assignee(id))
          )
        )
      )
  );
$$;

create function public.resolve_group_scope(selected_node_id uuid)
returns table (group_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive selected_tree as (
    select node.id, node.node_type
    from public.group_nodes as node
    where node.id = selected_node_id
      and not node.is_archived
      and (select private.has_sector_access(node.sector_id))

    union all

    select child.id, child.node_type
    from public.group_nodes as child
    join selected_tree as parent on child.parent_id = parent.id
    where not child.is_archived
  )
  select id
  from selected_tree
  where node_type = 'GROUP';
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.protect_creation_metadata() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.validate_group_node() from public, anon, authenticated;
revoke all on function private.validate_group_owner() from public, anon, authenticated;
revoke all on function private.validate_reminder_assignee() from public, anon, authenticated;

revoke all on function private.has_sector_access(uuid) from public, anon;
revoke all on function private.can_view_profile(uuid) from public, anon;
revoke all on function private.is_reminder_assignee(uuid) from public, anon;
revoke all on function private.can_view_reminder(uuid) from public, anon;
revoke all on function private.can_modify_reminder(uuid) from public, anon;

grant execute on function private.has_sector_access(uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;
grant execute on function private.is_reminder_assignee(uuid) to authenticated;
grant execute on function private.can_view_reminder(uuid) to authenticated;
grant execute on function private.can_modify_reminder(uuid) to authenticated;

revoke all on function public.resolve_group_scope(uuid) from public, anon;
grant execute on function public.resolve_group_scope(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.sectors enable row level security;
alter table public.user_sectors enable row level security;
alter table public.group_nodes enable row level security;
alter table public.scheduled_work enable row level security;
alter table public.reminders enable row level security;
alter table public.reminder_assignees enable row level security;
alter table public.objectives enable row level security;

create policy profiles_select_accessible
on public.profiles for select to authenticated
using ((select private.can_view_profile(id)));

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy sectors_select_accessible
on public.sectors for select to authenticated
using ((select private.has_sector_access(id)));

create policy user_sectors_select_accessible
on public.user_sectors for select to authenticated
using ((select private.has_sector_access(sector_id)));

create policy group_nodes_select_accessible
on public.group_nodes for select to authenticated
using ((select private.has_sector_access(sector_id)));
create policy group_nodes_insert_accessible
on public.group_nodes for insert to authenticated
with check ((select private.has_sector_access(sector_id)));
create policy group_nodes_update_accessible
on public.group_nodes for update to authenticated
using ((select private.has_sector_access(sector_id)))
with check ((select private.has_sector_access(sector_id)));
create policy group_nodes_delete_accessible
on public.group_nodes for delete to authenticated
using ((select private.has_sector_access(sector_id)));

create policy scheduled_work_select_accessible
on public.scheduled_work for select to authenticated
using ((select private.has_sector_access(sector_id)));
create policy scheduled_work_insert_accessible
on public.scheduled_work for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_sector_access(sector_id))
);
create policy scheduled_work_update_accessible
on public.scheduled_work for update to authenticated
using ((select private.has_sector_access(sector_id)))
with check ((select private.has_sector_access(sector_id)));
create policy scheduled_work_delete_accessible
on public.scheduled_work for delete to authenticated
using ((select private.has_sector_access(sector_id)));

create policy reminders_select_visible
on public.reminders for select to authenticated
using ((select private.can_view_reminder(id)));
create policy reminders_insert_accessible
on public.reminders for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_sector_access(sector_id))
);
create policy reminders_update_visible
on public.reminders for update to authenticated
using ((select private.can_modify_reminder(id)))
with check (
  (select private.has_sector_access(sector_id))
  and (
    group_id is not null
    or created_by = (select auth.uid())
    or (select private.is_reminder_assignee(id))
  )
);
create policy reminders_delete_visible
on public.reminders for delete to authenticated
using ((select private.can_modify_reminder(id)));

create policy reminder_assignees_select_visible
on public.reminder_assignees for select to authenticated
using ((select private.can_view_reminder(reminder_id)));
create policy reminder_assignees_insert_visible
on public.reminder_assignees for insert to authenticated
with check ((select private.can_modify_reminder(reminder_id)));
create policy reminder_assignees_delete_visible
on public.reminder_assignees for delete to authenticated
using ((select private.can_modify_reminder(reminder_id)));

create policy objectives_select_accessible
on public.objectives for select to authenticated
using ((select private.has_sector_access(sector_id)));
create policy objectives_insert_accessible
on public.objectives for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_sector_access(sector_id))
);
create policy objectives_update_accessible
on public.objectives for update to authenticated
using ((select private.has_sector_access(sector_id)))
with check ((select private.has_sector_access(sector_id)));
create policy objectives_delete_accessible
on public.objectives for delete to authenticated
using ((select private.has_sector_access(sector_id)));

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.sectors from anon, authenticated;
revoke all on table public.user_sectors from anon, authenticated;
revoke all on table public.group_nodes from anon, authenticated;
revoke all on table public.scheduled_work from anon, authenticated;
revoke all on table public.reminders from anon, authenticated;
revoke all on table public.reminder_assignees from anon, authenticated;
revoke all on table public.objectives from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant select on table public.sectors, public.user_sectors to authenticated;
grant select, insert, update, delete on table public.group_nodes to authenticated;
grant select, insert, update, delete on table public.scheduled_work to authenticated;
grant select, insert, update, delete on table public.reminders to authenticated;
grant select, insert, delete on table public.reminder_assignees to authenticated;
grant select, insert, update, delete on table public.objectives to authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

insert into public.sectors (code, name)
values
  ('artistic', 'Ginnastica Artistica'),
  ('rhythmic', 'Ginnastica Ritmica');

commit;
