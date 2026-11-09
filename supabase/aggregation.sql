-- Run once in Supabase SQL Editor. Returns true server-side aggregation.
create or replace function public.room_counts_by_floor()
returns table(floor integer, room_count bigint)
language sql stable security invoker
set search_path = public
as $$
  select r.floor, count(*)::bigint as room_count
  from public.room r
  where r.floor is not null
  group by r.floor
  order by r.floor;
$$;
grant execute on function public.room_counts_by_floor() to authenticated;
