begin;

create policy profiles_select_admin
on public.profiles for select to authenticated
using ((select private.is_admin()));

create policy sectors_select_admin
on public.sectors for select to authenticated
using ((select private.is_admin()));

commit;
