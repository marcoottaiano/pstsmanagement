begin;

alter table public.objectives
add column completed_at timestamptz,
add column completed_late boolean not null default false;

alter table public.reminders
add column completed_at timestamptz,
add column completed_late boolean not null default false;

update public.objectives
set status = 'IN_PROGRESS'
where status = 'POSTPONED';

update public.objectives
set
  completed_at = updated_at,
  completed_late = period_end is not null
    and (updated_at at time zone 'Europe/Rome')::date > period_end
where status = 'COMPLETED';

update public.reminders
set
  completed_at = updated_at,
  completed_late = due_at is not null
    and case
      when due_all_day then
        (updated_at at time zone 'Europe/Rome')::date
          > (due_at at time zone 'Europe/Rome')::date
      else updated_at > due_at
    end
where status = 'COMPLETED';

alter table public.objectives
drop constraint objectives_status_check,
add constraint objectives_status_check
  check (status in ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
add constraint objectives_completion_metadata_check
  check (
    (status = 'COMPLETED' and completed_at is not null)
    or
    (status <> 'COMPLETED' and completed_at is null and not completed_late)
  );

alter table public.reminders
add constraint reminders_completion_metadata_check
  check (
    (status = 'COMPLETED' and completed_at is not null)
    or
    (status <> 'COMPLETED' and completed_at is null and not completed_late)
  );

create function private.sync_objective_completion_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'COMPLETED' then
    if tg_op = 'INSERT' then
      new.completed_at := now();
      new.completed_late := new.period_end is not null
        and (now() at time zone 'Europe/Rome')::date > new.period_end;
    elsif old.status is distinct from 'COMPLETED' then
      new.completed_at := now();
      new.completed_late := new.period_end is not null
        and (now() at time zone 'Europe/Rome')::date > new.period_end;
    else
      new.completed_at := old.completed_at;
      new.completed_late := old.completed_late;
    end if;
  else
    new.completed_at := null;
    new.completed_late := false;
  end if;

  return new;
end;
$$;

create function private.sync_reminder_completion_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'COMPLETED' then
    if tg_op = 'INSERT' then
      new.completed_at := now();
      new.completed_late := new.due_at is not null
        and case
          when new.due_all_day then
            (now() at time zone 'Europe/Rome')::date
              > (new.due_at at time zone 'Europe/Rome')::date
          else now() > new.due_at
        end;
    elsif old.status is distinct from 'COMPLETED' then
      new.completed_at := now();
      new.completed_late := new.due_at is not null
        and case
          when new.due_all_day then
            (now() at time zone 'Europe/Rome')::date
              > (new.due_at at time zone 'Europe/Rome')::date
          else now() > new.due_at
        end;
    else
      new.completed_at := old.completed_at;
      new.completed_late := old.completed_late;
    end if;
  else
    new.completed_at := null;
    new.completed_late := false;
  end if;

  return new;
end;
$$;

create trigger objectives_sync_completion_metadata
before insert or update on public.objectives
for each row execute function private.sync_objective_completion_metadata();

create trigger reminders_sync_completion_metadata
before insert or update on public.reminders
for each row execute function private.sync_reminder_completion_metadata();

revoke all on function private.sync_objective_completion_metadata()
from public, anon, authenticated;
revoke all on function private.sync_reminder_completion_metadata()
from public, anon, authenticated;

commit;
