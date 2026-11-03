-- Date-range picker support: a public nightly rate calendar, pre-booking workshop
-- availability, and an optional guest-preferred workshop session stored with the request.
-- The preference is advisory: a session is only held at accommodation confirmation.

create function public.stay_rate_calendar(p_room text default null)
returns table(night date,price int,available int)
language sql stable security definer set search_path=public as $$
 select i.night,min(i.price)::int,sum(greatest(i.capacity-stay_used(i.room_id,i.night),0))::int
 from stay_inventory i
 where i.night>stay_today() and i.night<=stay_today()+90
   and (p_room is null or i.room_id=p_room)
 group by i.night
 order by i.night
$$;
revoke all on function public.stay_rate_calendar(text) from public,anon,authenticated;
grant execute on function public.stay_rate_calendar(text) to anon,authenticated;

create function public.stay_session_preview(p_plan text,p_in date,p_out date)
returns table(id uuid,starts_at timestamptz,available int)
language plpgsql stable security definer set search_path=public as $$
declare p stay_plans;
begin
 select * into p from stay_plans where stay_plans.id=p_plan;
 if not found or p.experience_id is null then return;end if;
 if p_in is null or p_out is null or p_in<=stay_today() or p_out<=p_in or p_out>p_in+14 then return;end if;
 return query select s.id,s.starts_at,greatest(stay_session_free(s.id),0)::int
 from sessions s join experiences x on x.id=s.experience_id
 where x.active and s.experience_id=p.experience_id and s.starts_at>now()
  and s.starts_at>=stay_time(p_in,14)
  and s.starts_at+x.minutes*interval '1 minute'<=stay_time(p_out,12)
 order by s.starts_at;
end $$;
revoke all on function public.stay_session_preview(text,date,date) from public,anon,authenticated;
grant execute on function public.stay_session_preview(text,date,date) to anon,authenticated;

alter table public.stay_bookings add column requested_session uuid references sessions(id);

drop function public.submit_stay_request(text,text,date,date,int,text,uuid);
create function public.submit_stay_request(p_room text,p_plan text,p_in date,p_out date,p_guests int,p_token text,p_request uuid,p_session uuid default null) returns uuid
language plpgsql security definer set search_path=public as $$
declare q jsonb;b uuid;batch text;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED';end if;
 if not exists(select 1 from profiles where id=auth.uid() and role='guest') then raise exception 'GUEST_REQUIRED';end if;
 if p_request is null then raise exception 'STAY_REQUEST_INVALID';end if;
 perform lock_stay_capacity();
 select id into b from stay_bookings where user_id=auth.uid() and request_id=p_request;if found then return b;end if;
 q:=quote_stay(p_room,p_plan,p_in,p_out,p_guests);
 if p_token is null or q->>'token'<>p_token then raise exception 'STAY_PRICE_CHANGED';end if;
 if (q->>'available')::int<1 then raise exception 'STAY_SOLD_OUT';end if;
 if p_session is not null then
  if q->>'experience_id' is null or not exists(
   select 1 from sessions s join experiences x on x.id=s.experience_id
   where s.id=p_session and x.active and s.experience_id=q->>'experience_id'
    and s.starts_at>=stay_time(p_in,14) and s.starts_at+x.minutes*interval '1 minute'<=stay_time(p_out,12)
  ) then raise exception 'STAY_BENEFIT_UNAVAILABLE';end if;
 end if;
 if exists(select 1 from stay_bookings where user_id=auth.uid() and room_id=p_room and check_in=p_in and check_out=p_out and status in ('pending','confirmed','checked_in')) then raise exception 'STAY_DUPLICATE';end if;
 select batch_id into batch from profiles where id=auth.uid();
 insert into stay_bookings(user_id,batch_id,room_id,plan_id,check_in,check_out,guests,quote,request_id,requested_session)
 values(auth.uid(),batch,p_room,p_plan,p_in,p_out,p_guests,q,p_request,p_session) returning id into b;
 insert into stay_history(booking_id,actor_id,status) values(b,auth.uid(),'pending');return b;
end $$;
revoke all on function public.submit_stay_request(text,text,date,date,int,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.submit_stay_request(text,text,date,date,int,text,uuid,uuid) to authenticated;

create or replace function public.transition_stay_booking(p_id uuid,p_status text,p_reason text default '',p_session uuid default null) returns void
language plpgsql security definer set search_path=public as $$
declare b stay_bookings;i stay_inventory;e stay_entitlements;s uuid;preferred uuid;count_nights int;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED';end if;
 perform lock_stay_capacity();select * into b from stay_bookings where id=p_id for update;
 if not found or (b.user_id<>auth.uid() and not is_ops()) then raise exception 'FORBIDDEN';end if;
 if p_status=b.status then return;end if;
 if p_status='cancelled' then
  if b.status not in ('pending','confirmed') or (b.status='confirmed' and now()>=stay_time(b.check_in,14)) then raise exception 'STAY_TRANSITION_INVALID';end if;
  if exists(select 1 from stay_entitlements se join bookings a on a.id=se.activity_booking_id join sessions ss on ss.id=a.session_id
    where se.booking_id=b.id and (a.status='completed' or (a.status='confirmed' and ss.starts_at<=now()))) then raise exception 'STAY_TRANSITION_INVALID';end if;
  select * into e from stay_entitlements where booking_id=b.id;
  if e.activity_booking_id is not null then
   update bookings set status='cancelled',reason='Accommodation cancelled' where id=e.activity_booking_id and status='confirmed';
   insert into booking_history(booking_id,actor_id,status,reason) values(e.activity_booking_id,auth.uid(),'cancelled','Accommodation cancelled');
  end if;
  update stay_entitlements set status='cancelled' where booking_id=b.id;
 elsif p_status in ('confirmed','declined','checked_in','checked_out') then
  if not is_ops() then raise exception 'FORBIDDEN';end if;
  if p_status in ('confirmed','declined') and b.status<>'pending' then raise exception 'STAY_TRANSITION_INVALID';end if;
  if p_status='declined' and length(trim(coalesce(p_reason,'')))=0 then raise exception 'REASON_REQUIRED';end if;
  if p_status='checked_in' and (b.status<>'confirmed' or now()<stay_time(b.check_in,14) or now()>=stay_time(b.check_out,12)) then raise exception 'STAY_TRANSITION_INVALID';end if;
  if p_status='checked_out' and (b.status<>'checked_in' or now()<stay_time(b.check_out,12)) then raise exception 'STAY_TRANSITION_INVALID';end if;
  if p_status='confirmed' then
   if now()>=stay_time(b.check_in,14) then raise exception 'STAY_TRANSITION_INVALID';end if;
   count_nights:=0;
   for i in select * from stay_inventory where room_id=b.room_id and night>=b.check_in and night<b.check_out order by night for update loop
    count_nights:=count_nights+1;if i.capacity-stay_used(i.room_id,i.night)<1 then raise exception 'STAY_SOLD_OUT';end if;
   end loop;
   if count_nights<>b.check_out-b.check_in then raise exception 'STAY_SOLD_OUT';end if;
   if b.quote->>'experience_id' is not null then
    preferred:=coalesce(p_session,b.requested_session);
    select o.id into s from stay_session_options(b.id) o where o.available>=b.guests and (preferred is null or o.id=preferred) order by o.starts_at limit 1;
    if s is null and p_session is null and b.requested_session is not null then
     select o.id into s from stay_session_options(b.id) o where o.available>=b.guests order by o.starts_at limit 1;
    end if;
    if s is null then raise exception 'STAY_BENEFIT_UNAVAILABLE';end if;
    insert into stay_entitlements(booking_id,session_id,seats,status) values(b.id,s,b.guests,'held');
   end if;
  end if;
 else raise exception 'STAY_TRANSITION_INVALID';end if;
 update stay_bookings set status=p_status,reason=left(trim(coalesce(p_reason,'')),1000) where id=b.id;
 insert into stay_history(booking_id,actor_id,status,reason) values(b.id,auth.uid(),p_status,left(trim(coalesce(p_reason,'')),1000));
end $$;
