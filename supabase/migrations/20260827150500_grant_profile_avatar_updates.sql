begin;

grant
update (avatar_style, avatar_seed, avatar_background) on table public.profiles to authenticated;

commit;