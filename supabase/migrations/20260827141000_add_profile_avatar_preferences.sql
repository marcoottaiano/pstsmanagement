begin;

alter table public.profiles
add column avatar_style text not null default 'adventurer' check (
  avatar_style in (
    'adventurer',
    'botttsNeutral',
    'funEmoji',
    'initials',
    'pixelArt',
    'thumbs'
  )
),
add column avatar_seed text not null default '' check (length (trim(avatar_seed)) <= 80);

update public.profiles
set
  avatar_seed = display_name
where
  avatar_seed = '';

commit;