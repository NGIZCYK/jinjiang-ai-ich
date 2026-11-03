-- Accommodation participation locks cohort assignment just like exploration and activity records.
create or replace function public.stay_preserve_batch() returns trigger language plpgsql security definer set search_path=public as $$
begin if new.batch_id<>old.batch_id and exists(select 1 from stay_bookings where user_id=old.id) then raise exception 'PARTICIPANT_HAS_ACTIVITY';end if;return new;end $$;
create or replace function public.participant_roster()
returns table(id uuid,name text,batch_id text,created_at timestamptz,has_activity boolean)
language plpgsql stable security definer set search_path=public as $$
begin
 if not is_ops() then raise exception 'FORBIDDEN';end if;
 return query select p.id,p.name,p.batch_id,p.created_at,
 exists(select 1 from events e where e.user_id=p.id)
 or exists(select 1 from explorations e where e.user_id=p.id)
 or exists(select 1 from preferences x where x.user_id=p.id)
 or exists(select 1 from recommendations r where r.user_id=p.id)
 or exists(select 1 from bookings b where b.user_id=p.id)
 or exists(select 1 from guide_signals g where g.user_id=p.id)
 or exists(select 1 from stay_bookings h where h.user_id=p.id)
 from profiles p where p.role='guest' order by p.created_at desc;
end $$;
