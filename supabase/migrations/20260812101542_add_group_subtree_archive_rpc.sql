create function public.set_group_subtree_archive_state(
  selected_node_id uuid,
  archived boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.group_nodes
    where id = selected_node_id
  ) then
    raise exception 'The selected group node does not exist.' using errcode = 'P0002';
  end if;

  with recursive subtree as (
    select id, sector_id
    from public.group_nodes
    where id = selected_node_id

    union all

    select child.id, child.sector_id
    from public.group_nodes as child
    join subtree on child.parent_id = subtree.id
    where child.sector_id = subtree.sector_id
  )
  update public.group_nodes as node
  set is_archived = archived
  from subtree
  where node.id = subtree.id;
end;
$$;

revoke all on function public.set_group_subtree_archive_state(uuid, boolean)
  from public, anon;
grant execute on function public.set_group_subtree_archive_state(uuid, boolean)
  to authenticated;
