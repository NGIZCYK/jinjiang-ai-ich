-- Explicit local demo setup only. Never run automatically against an existing research deployment.
-- Repeatable: adds missing future inventory and workshops without changing existing rows or orders.
insert into public.stay_inventory(room_id,night,price,capacity)
select r.id,public.stay_today()+d,r.default_price,r.default_capacity
from public.stay_rooms r cross join generate_series(1,104) d on conflict do nothing;
insert into public.sessions(experience_id,starts_at,capacity)
select 'workshop',public.stay_time(public.stay_today()+d,16),8 from generate_series(1,104) d
on conflict(experience_id,starts_at) do nothing;
