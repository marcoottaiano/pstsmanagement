begin;

alter table public.profiles
  add column role text not null default 'MEMBER'
  constraint profiles_role_check check (role in ('ADMIN', 'MEMBER'));

update public.profiles
set role = 'ADMIN'
where lower(email) in (
  'camillares@gmail.com',
  'ilaria.magistrelli@libero.it',
  'marco.ottaiano00@gmail.com'
);

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'ADMIN'
    );
$$;

create function public.set_user_sector_access(
  target_user_id uuid,
  target_sector_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_sector_count integer;
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'The selected user does not exist.' using errcode = '23503';
  end if;

  select count(distinct sector_id)
    into requested_sector_count
  from unnest(target_sector_ids) as requested(sector_id)
  where sector_id is not null;

  if requested_sector_count = 0
    or requested_sector_count <> cardinality(target_sector_ids)
    or requested_sector_count <> (
      select count(*)
      from public.sectors
      where id = any(target_sector_ids)
    ) then
    raise exception 'At least one valid, unique sector is required.' using errcode = '23514';
  end if;

  delete from public.user_sectors
  where user_id = target_user_id;

  insert into public.user_sectors (user_id, sector_id)
  select target_user_id, requested.sector_id
  from unnest(target_sector_ids) as requested(sector_id);
end;
$$;

revoke all on function private.is_admin() from public, anon, authenticated;

revoke all on function public.set_user_sector_access(uuid, uuid[]) from public, anon;
grant execute on function public.set_user_sector_access(uuid, uuid[]) to authenticated;

commit;
