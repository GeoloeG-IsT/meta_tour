-- Make uniqueness apply only to non-cancelled bookings so that cancelled rows don't block new bookings

-- Drop the original unique constraint if it exists as a table constraint
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'bookings'
      and constraint_type = 'UNIQUE'
  ) then
    -- Attempt to drop by name if known; otherwise ignore
    -- This may need an exact constraint name in some setups
    begin
      alter table public.bookings drop constraint if exists bookings_tour_id_participant_id_key;
    exception when others then
      -- ignore
    end;
  end if;
end $$;

-- Create a partial unique index enforcing uniqueness only for non-cancelled bookings
create unique index if not exists uniq_bookings_active on public.bookings (tour_id, participant_id)
where status <> 'cancelled';


