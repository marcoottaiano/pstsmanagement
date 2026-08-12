create function public.reorder_group_node(
  selected_node_id uuid,
  move_direction text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selected_node record;
  adjacent_node record;
begin
  if move_direction not in ('up', 'down') then
    raise exception 'The requested direction is invalid.' using errcode = '22023';
  end if;

  select id, sector_id, parent_id, name, sort_order
    into selected_node
  from public.group_nodes
  where id = selected_node_id
    and not is_archived;

  if not found then
    raise exception 'The selected active group node does not exist.' using errcode = 'P0002';
  end if;

  if move_direction = 'up' then
    select id, sort_order
      into adjacent_node
    from public.group_nodes
    where sector_id = selected_node.sector_id
      and parent_id is not distinct from selected_node.parent_id
      and not is_archived
      and (sort_order, name, id) < (selected_node.sort_order, selected_node.name, selected_node.id)
    order by sort_order desc, name desc, id desc
    limit 1;
  else
    select id, sort_order
      into adjacent_node
    from public.group_nodes
    where sector_id = selected_node.sector_id
      and parent_id is not distinct from selected_node.parent_id
      and not is_archived
      and (sort_order, name, id) > (selected_node.sort_order, selected_node.name, selected_node.id)
    order by sort_order, name, id
    limit 1;
  end if;

  if not found then
    raise exception 'The selected node is already at the requested position.' using errcode = '22023';
  end if;

  update public.group_nodes
  set sort_order = case id
    when selected_node.id then adjacent_node.sort_order
    when adjacent_node.id then selected_node.sort_order
  end
  where id in (selected_node.id, adjacent_node.id);
end;
$$;

revoke all on function public.reorder_group_node(uuid, text) from public, anon;
grant execute on function public.reorder_group_node(uuid, text) to authenticated;
