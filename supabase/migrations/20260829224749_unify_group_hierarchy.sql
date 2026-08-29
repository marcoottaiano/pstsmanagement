begin;

set local lock_timeout = '5s';

create or replace function private.validate_group_owner()
returns trigger
language plpgsql
security definer
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
    raise exception 'The selected group does not belong to the sector.' using errcode = '23503';
  end if;

  if owner_is_archived then
    raise exception 'Application data cannot be assigned to an archived group.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_group_owner()
from public, anon, authenticated;

create or replace function public.resolve_group_scope(selected_node_id uuid)
returns table (group_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive selected_tree as (
    select node.id
    from public.group_nodes as node
    where node.id = selected_node_id
      and not node.is_archived
      and (select private.has_sector_access(node.sector_id))

    union all

    select child.id
    from public.group_nodes as child
    join selected_tree as parent on child.parent_id = parent.id
    where not child.is_archived
  )
  select id
  from selected_tree;
$$;

revoke all on function public.resolve_group_scope(uuid) from public, anon;
grant execute on function public.resolve_group_scope(uuid) to authenticated;

drop trigger if exists group_nodes_log_activity_on_meaningful_update
on public.group_nodes;

create trigger group_nodes_log_activity_on_meaningful_update
after update on public.group_nodes
for each row
when (
  old.name is distinct from new.name
  or old.parent_id is distinct from new.parent_id
  or old.is_archived is distinct from new.is_archived
)
execute function private.log_planning_activity();

alter table public.group_nodes
drop column if exists node_type;

commit;
