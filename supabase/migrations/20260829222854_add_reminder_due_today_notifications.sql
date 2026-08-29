begin;

alter table public.notifications
drop constraint notifications_kind_check,
add constraint notifications_kind_check check (
  kind in (
    'REMINDER_ASSIGNED',
    'REMINDER_DUE_TODAY',
    'REMINDER_DUE_SOON',
    'REMINDER_OVERDUE'
  )
);

commit;
