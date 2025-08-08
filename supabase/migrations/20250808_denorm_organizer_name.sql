-- Denormalize organizer_name onto tours for public display

alter table public.tours
  add column if not exists organizer_name text;

-- Backfill organizer_name from users
update public.tours t
set organizer_name = u.full_name
from public.users u
where u.id = t.organizer_id
  and (t.organizer_name is null or t.organizer_name = '');

-- Keep organizer_name in sync on insert/update
create or replace function public.tg_sync_tour_organizer_name()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.organizer_id is not null then
    select full_name into new.organizer_name from public.users where id = new.organizer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_tour_organizer_name on public.tours;
create trigger sync_tour_organizer_name
before insert or update of organizer_id
on public.tours
for each row execute function public.tg_sync_tour_organizer_name();


