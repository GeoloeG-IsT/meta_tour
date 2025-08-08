-- Public profile RPC to expose limited columns bypassing RLS via SECURITY DEFINER

create or replace function public.get_public_profile(p_user uuid)
returns table (
  id uuid,
  full_name text,
  role text,
  created_at timestamptz
)
language sql
stable
security definer
as $$
  select u.id, u.full_name, u.role, u.created_at
  from public.users u
  where u.id = p_user;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;


