-- Backfill defaults for new columns and set column defaults for future writes
-- PRODUCTION PRACTICE:
-- - Keep columns nullable first, add defaults
-- - Backfill existing rows
-- - Optionally enforce NOT NULL later if required

begin;

-- Set sensible defaults for future inserts
alter table public.tours
  alter column difficulty set default 'moderate',
  alter column country set default 'Unknown';

-- Backfill existing rows only where NULL
update public.tours
set difficulty = 'moderate'
where difficulty is null;

update public.tours
set country = 'Unknown'
where country is null or trim(country) = '';

commit;


