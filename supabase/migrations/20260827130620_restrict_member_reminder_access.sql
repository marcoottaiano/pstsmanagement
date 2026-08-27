create or replace function private.can_view_reminder(target_reminder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_admin())
    or exists (
      select 1
      from public.reminders
      where id = target_reminder_id
        and (select private.has_sector_access(sector_id))
        and (
          created_by = (select auth.uid())
          or (select private.is_reminder_assignee(id))
        )
    );
$$;

create or replace function private.can_modify_reminder(target_reminder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_admin())
    or exists (
      select 1
      from public.reminders
      where id = target_reminder_id
        and (select private.has_sector_access(sector_id))
        and (
          created_by = (select auth.uid())
          or (select private.is_reminder_assignee(id))
        )
    );
$$;

drop policy reminders_insert_accessible on public.reminders;
create policy reminders_insert_accessible
on public.reminders for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (select private.is_admin())
    or (select private.has_sector_access(sector_id))
  )
);

drop policy reminders_update_visible on public.reminders;
create policy reminders_update_visible
on public.reminders for update to authenticated
using ((select private.can_modify_reminder(id)))
with check (
  (select private.is_admin())
  or (
    (select private.has_sector_access(sector_id))
    and (
      created_by = (select auth.uid())
      or (select private.is_reminder_assignee(id))
    )
  )
);
