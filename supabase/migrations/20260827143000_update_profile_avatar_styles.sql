begin;

alter table public.profiles
drop constraint if exists profiles_avatar_style_check;

update public.profiles
set
  avatar_style = 'adventurerNeutral'
where
  avatar_style not in ('adventurerNeutral', 'funEmoji', 'botttsNeutral');

alter table public.profiles add constraint profiles_avatar_style_check check (
  avatar_style in ('adventurerNeutral', 'funEmoji', 'botttsNeutral')
);

alter table public.profiles
alter column avatar_style
set default 'adventurerNeutral';

commit;