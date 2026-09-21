-- Run on an isolated course project to add the next 14 days of DEMONSTRATION slots.
-- Re-runs are safe; existing capacities and bookings are not overwritten.
insert into public.sessions(experience_id,starts_at,capacity)
select e.id, ((current_timestamp at time zone 'Asia/Shanghai')::date + d + time '14:00') at time zone 'Asia/Shanghai',8
from public.experiences e cross join generate_series(1,14) d on conflict(experience_id,starts_at) do nothing;
