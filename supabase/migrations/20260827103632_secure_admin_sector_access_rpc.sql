begin;

alter function public.set_user_sector_access(uuid, uuid[]) security invoker;

grant execute on function private.is_admin() to authenticated;

create policy user_sectors_insert_admin
on public.user_sectors for insert to authenticated
with check ((select private.is_admin()));

create policy user_sectors_delete_admin
on public.user_sectors for delete to authenticated
using ((select private.is_admin()));

grant insert, delete on table public.user_sectors to authenticated;

commit;
