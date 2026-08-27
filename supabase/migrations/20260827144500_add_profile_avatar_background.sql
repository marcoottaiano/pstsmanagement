begin;

alter table public.profiles
add column avatar_background text not null default 'f1f3f5' check (
  avatar_background in (
    'f8d7da',
    'ffe8cc',
    'fff3bf',
    'd3f9d8',
    'c3fae8',
    'd0ebff',
    'dbe4ff',
    'e5dbff',
    'fde2e4',
    'f1f3f5'
  )
);

commit;