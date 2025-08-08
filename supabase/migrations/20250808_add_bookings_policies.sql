-- Ensure RLS is enabled and add ownership-based policies for bookings

alter table public.bookings enable row level security;

-- Allow authenticated users to delete their own bookings
drop policy if exists "participants can delete own bookings" on public.bookings;
create policy "participants can delete own bookings"
on public.bookings
for delete
to authenticated
using (auth.uid() = participant_id);

-- Allow authenticated users to update their own bookings (e.g., to cancel)
drop policy if exists "participants can update own bookings" on public.bookings;
create policy "participants can update own bookings"
on public.bookings
for update
to authenticated
using (auth.uid() = participant_id)
with check (auth.uid() = participant_id);


