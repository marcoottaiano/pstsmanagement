create index scheduled_work_sector_group_idx
  on public.scheduled_work (sector_id, group_id);

create index reminders_sector_group_idx
  on public.reminders (sector_id, group_id);
