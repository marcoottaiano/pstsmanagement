begin;

create or replace function private.protect_creation_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.created_at is distinct from old.created_at then
    raise exception 'Creation metadata cannot be changed.' using errcode = '23514';
  end if;

  if new.created_by is distinct from old.created_by
    and not (
      new.created_by is null
      and not exists (
        select 1
        from public.profiles
        where id = old.created_by
      )
    ) then
    raise exception 'Creation metadata cannot be changed.' using errcode = '23514';
  end if;

  return new;
end;
$$;

alter table public.scheduled_work
  alter column created_by drop not null,
  drop constraint scheduled_work_created_by_fkey,
  add constraint scheduled_work_created_by_fkey
    foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.reminders
  alter column created_by drop not null,
  drop constraint reminders_created_by_fkey,
  add constraint reminders_created_by_fkey
    foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.objectives
  alter column created_by drop not null,
  drop constraint objectives_created_by_fkey,
  add constraint objectives_created_by_fkey
    foreign key (created_by) references public.profiles (id) on delete set null;

commit;
