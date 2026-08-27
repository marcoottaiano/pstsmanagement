begin;

drop policy profiles_select_accessible on public.profiles;
drop policy profiles_select_admin on public.profiles;

create policy profiles_select_accessible
on public.profiles for select to authenticated
using (
  (select private.is_admin())
  or (select private.can_view_profile(id))
);

drop policy sectors_select_accessible on public.sectors;
drop policy sectors_select_admin on public.sectors;

create policy sectors_select_accessible
on public.sectors for select to authenticated
using (
  (select private.is_admin())
  or (select private.has_sector_access(id))
);

commit;
