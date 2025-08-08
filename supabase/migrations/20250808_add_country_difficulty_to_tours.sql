-- Add country and difficulty fields to tours

alter table public.tours
  add column if not exists country text,
  add column if not exists difficulty text check (difficulty in ('easy','moderate','challenging','intense'));

create index if not exists idx_tours_country on public.tours(country);
create index if not exists idx_tours_difficulty on public.tours(difficulty);


