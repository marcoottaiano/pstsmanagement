create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  sector_id uuid not null references public.sectors(id) on delete cascade,
  kind text not null check (
    kind in ('REMINDER_ASSIGNED', 'REMINDER_DUE_SOON', 'REMINDER_OVERDUE')
  ),
  title text not null check (char_length(title) between 1 and 120),
  message text not null check (char_length(message) between 1 and 300),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_recipient_reminder_kind_key
    unique (recipient_id, reminder_id, kind)
);

create index notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

create index notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "Users can read their notifications"
  on public.notifications
  for select
  to authenticated
  using ((select auth.uid()) = recipient_id);

create policy "Users can mark their notifications as read"
  on public.notifications
  for update
  to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

revoke all on table public.notifications from anon, authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;
