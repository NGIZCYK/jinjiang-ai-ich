-- Single-hotel course prototype. All amounts are demonstration CNY cents.
create table public.stay_rooms (
 id text primary key, title_zh text not null, title_en text not null,
 theme boolean not null, max_guests int not null check(max_guests between 1 and 2),
 default_price int not null check(default_price>=0), default_capacity int not null check(default_capacity>=0)
);
insert into stay_rooms values
 ('classic','江南雅居大床房','Jiangnan King',false,2,68000,5),
 ('embroidery','苏绣主题大床房','Embroidery King',true,2,88000,3),
 ('suite','苏绣主题套房','Embroidery Suite',true,2,128000,2);
create table public.stay_plans (
 id text primary key,title_zh text not null,title_en text not null,surcharge int not null check(surcharge>=0),
 experience_id text references experiences(id)
);
insert into stay_plans values ('room_only','纯住宿','Room only',0,null),('heritage','苏绣体验套餐','Embroidery stay',18000,'workshop');
create table public.stay_inventory (
 room_id text references stay_rooms(id), night date, price int not null check(price>=0), capacity int not null check(capacity>=0),
 primary key(room_id,night)
);
create table public.stay_bookings (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id),batch_id text not null references batches(id),
 room_id text not null references stay_rooms(id),plan_id text not null references stay_plans(id),
 check_in date not null,check_out date not null,guests int not null check(guests between 1 and 2),
 status text not null default 'pending' check(status in ('pending','confirmed','checked_in','checked_out','cancelled','declined')),
 quote jsonb not null,reason text not null default '',request_id uuid not null,created_at timestamptz not null default now(),
 unique(user_id,request_id),check(check_out>check_in and check_out<=check_in+14)
);
create index stay_occupancy on stay_bookings(room_id,check_in,check_out,status);
create table public.stay_history (
 id bigint generated always as identity primary key, booking_id uuid not null references stay_bookings(id) on delete cascade,
 actor_id uuid not null references profiles(id),status text not null,reason text not null default '',created_at timestamptz not null default now()
);
create table public.stay_entitlements (
 id uuid primary key default gen_random_uuid(),booking_id uuid not null unique references stay_bookings(id) on delete cascade,
 session_id uuid not null references sessions(id),seats int not null check(seats between 1 and 2),
 status text not null check(status in ('held','redeemed','cancelled')),
 activity_booking_id uuid unique references bookings(id)
);
alter table public.bookings add column stay_entitlement_id uuid unique references stay_entitlements(id);
-- One database mutex serializes capacity-changing transactions in this small single-hotel prototype.
-- Existing activity confirmations acquire it too: room confirmations and independent activities cannot oversell each other.
create table public.stay_capacity_guard(id int primary key check(id=1));
insert into stay_capacity_guard values(1);
create function public.lock_stay_capacity() returns void language plpgsql security definer set search_path=public as $$
begin perform 1 from stay_capacity_guard where id=1 for update; end $$;
create function public.stay_today() returns date language sql stable as $$ select (now() at time zone 'Asia/Shanghai')::date $$;
create function public.stay_time(p_date date,p_hour int) returns timestamptz language sql immutable as $$ select (p_date+p_hour*interval '1 hour') at time zone 'Asia/Shanghai' $$;
create function public.stay_used(p_room text,p_night date) returns int language sql stable security definer set search_path=public as $$
 select count(*)::int from stay_bookings where room_id=p_room and check_in<=p_night and check_out>p_night and status in ('confirmed','checked_in','checked_out')
$$;
create function public.stay_session_free(p_session uuid) returns int language sql stable security definer set search_path=public as $$
 select s.capacity
  -coalesce((select sum(b.party_size) from bookings b where b.session_id=s.id and b.status in ('confirmed','completed')),0)::int
  -coalesce((select sum(e.seats) from stay_entitlements e join stay_bookings h on h.id=e.booking_id
    where e.session_id=s.id and e.status='held' and h.status in ('confirmed','checked_in') and s.starts_at>now()),0)::int
 from sessions s where s.id=p_session
$$;
create function public.quote_stay(p_room text,p_plan text,p_in date,p_out date,p_guests int) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare r stay_rooms;p stay_plans;nights jsonb;total int;free int;cnt int;result jsonb;
begin
 select * into r from stay_rooms where id=p_room; if not found then raise exception 'STAY_ROOM_INVALID'; end if;
 select * into p from stay_plans where id=p_plan; if not found then raise exception 'STAY_PLAN_INVALID'; end if;
 if p_in is null or p_out is null or p_in<=stay_today() or p_in>stay_today()+90 or p_out<=p_in or p_out>p_in+14 then raise exception 'STAY_DATES_INVALID'; end if;
 if p_guests is null or p_guests<1 or p_guests>r.max_guests then raise exception 'STAY_GUESTS_INVALID'; end if;
 select jsonb_agg(jsonb_build_object('night',i.night,'price',i.price) order by i.night),sum(i.price)::int,
 min(i.capacity-stay_used(i.room_id,i.night)),count(*) into nights,total,free,cnt
 from stay_inventory i where i.room_id=p_room and i.night>=p_in and i.night<p_out;
 if cnt<>p_out-p_in then free:=0;total:=null;nights:='[]';end if;
 result:=jsonb_build_object('room_id',p_room,'plan_id',p_plan,'check_in',p_in,'check_out',p_out,'guests',p_guests,
 'room_title_zh',r.title_zh,'room_title_en',r.title_en,'plan_title_zh',p.title_zh,'plan_title_en',p.title_en,
 'nights',coalesce(nights,'[]'),'room_total',total,'surcharge',p.surcharge,'total',total+p.surcharge,
 'available',greatest(coalesce(free,0),0),'experience_id',p.experience_id);
 return result||jsonb_build_object('token',md5((result-'available')::text));
end $$;
create function public.search_stays(p_in date,p_out date,p_guests int) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
 select jsonb_agg(quote_stay(r.id,p.id,p_in,p_out,p_guests) order by r.default_price,p.surcharge) into result from stay_rooms r cross join stay_plans p;
 return coalesce(result,'[]');
end $$;
create function public.submit_stay_request(p_room text,p_plan text,p_in date,p_out date,p_guests int,p_token text,p_request uuid) returns uuid
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
 if exists(select 1 from stay_bookings where user_id=auth.uid() and room_id=p_room and check_in=p_in and check_out=p_out and status in ('pending','confirmed','checked_in')) then raise exception 'STAY_DUPLICATE';end if;
 select batch_id into batch from profiles where id=auth.uid();
 insert into stay_bookings(user_id,batch_id,room_id,plan_id,check_in,check_out,guests,quote,request_id)
 values(auth.uid(),batch,p_room,p_plan,p_in,p_out,p_guests,q,p_request) returning id into b;
 insert into stay_history(booking_id,actor_id,status) values(b,auth.uid(),'pending');return b;
end $$;
create function public.stay_session_options(p_booking uuid) returns table(id uuid,starts_at timestamptz,available int,is_held boolean)
language plpgsql stable security definer set search_path=public as $$
declare b stay_bookings;e stay_entitlements;
begin
 select * into b from stay_bookings where stay_bookings.id=p_booking;
 if not found or (b.user_id<>auth.uid() and not is_ops()) or auth.uid() is null then raise exception 'FORBIDDEN';end if;
 select * into e from stay_entitlements where booking_id=b.id;
 return query select s.id,s.starts_at,stay_session_free(s.id)+case when e.session_id=s.id and e.status='held' then e.seats
   when e.session_id=s.id and e.status='redeemed' and exists(select 1 from bookings a where a.id=e.activity_booking_id and a.status='confirmed') then e.seats else 0 end,e.session_id=s.id
 from sessions s join experiences x on x.id=s.experience_id
 where x.active and s.experience_id=b.quote->>'experience_id' and s.starts_at>now()
 and s.starts_at>=stay_time(b.check_in,14) and s.starts_at+x.minutes*interval '1 minute'<=stay_time(b.check_out,12)
 order by s.starts_at;
end $$;
create function public.transition_stay_booking(p_id uuid,p_status text,p_reason text default '',p_session uuid default null) returns void
language plpgsql security definer set search_path=public as $$
declare b stay_bookings;i stay_inventory;e stay_entitlements;s uuid;free int;count_nights int;
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
    select o.id into s from stay_session_options(b.id) o where o.available>=b.guests and (p_session is null or o.id=p_session) order by o.starts_at limit 1;
    if s is null then raise exception 'STAY_BENEFIT_UNAVAILABLE';end if;
    insert into stay_entitlements(booking_id,session_id,seats,status) values(b.id,s,b.guests,'held');
   end if;
  end if;
 else raise exception 'STAY_TRANSITION_INVALID';end if;
 update stay_bookings set status=p_status,reason=left(trim(coalesce(p_reason,'')),1000) where id=b.id;
 insert into stay_history(booking_id,actor_id,status,reason) values(b.id,auth.uid(),p_status,left(trim(coalesce(p_reason,'')),1000));
end $$;
create function public.redeem_stay_entitlement(p_booking uuid,p_session uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare b stay_bookings;e stay_entitlements;result uuid;old_start timestamptz;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED';end if;
 perform lock_stay_capacity();select * into b from stay_bookings where id=p_booking for update;
 if not found or b.user_id<>auth.uid() then raise exception 'FORBIDDEN';end if;
 if b.status not in ('confirmed','checked_in') then raise exception 'STAY_NOT_CONFIRMED';end if;
 select * into e from stay_entitlements where booking_id=b.id for update;
 if not found or e.status='cancelled' then raise exception 'STAY_BENEFIT_INVALID';end if;
 select starts_at into old_start from sessions where id=e.session_id;
 if old_start<=now() then raise exception 'STAY_BENEFIT_EXPIRED';end if;
 if e.status='redeemed' and not exists(select 1 from bookings where id=e.activity_booking_id and status='confirmed') then raise exception 'STAY_BENEFIT_INVALID';end if;
 if not exists(select 1 from stay_session_options(b.id) o where o.id=p_session and o.available>=e.seats) then raise exception 'STAY_BENEFIT_UNAVAILABLE';end if;
 if exists(select 1 from bookings where user_id=auth.uid() and session_id=p_session and status in ('pending','confirmed','completed') and (e.activity_booking_id is null or id<>e.activity_booking_id)) then raise exception 'DUPLICATE_INTENTION';end if;
 if e.status='redeemed' then
  result:=e.activity_booking_id;
  if e.session_id=p_session then return result;end if;
  update bookings set session_id=p_session,reason='Package experience rescheduled' where id=result;
  insert into booking_history(booking_id,actor_id,status,reason) values(result,auth.uid(),'confirmed','Package experience rescheduled');
 else
  insert into bookings(user_id,session_id,party_size,status,batch_id,request_id,stay_entitlement_id)
   values(b.user_id,p_session,e.seats,'confirmed',b.batch_id,gen_random_uuid(),e.id) returning id into result;
  insert into booking_history(booking_id,actor_id,status,reason) values(result,auth.uid(),'confirmed','Included in accommodation package');
 end if;
 update stay_entitlements set status='redeemed',session_id=p_session,activity_booking_id=result where id=e.id;
 return result;
end $$;
create function public.reschedule_stay_experience(p_booking uuid,p_session uuid) returns uuid
language sql security definer set search_path=public as $$ select redeem_stay_entitlement(p_booking,p_session) $$;
create function public.set_stay_inventory(p_room text,p_night date,p_price int,p_capacity int) returns void
language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not is_ops() then raise exception 'FORBIDDEN';end if;
 if p_night is null or p_night<stay_today() or p_night>stay_today()+104 or p_price is null or p_price<0 or p_price>10000000 or p_capacity is null or p_capacity<0 or p_capacity>1000 then raise exception 'STAY_INVENTORY_INVALID';end if;
 perform lock_stay_capacity();
 if p_capacity<stay_used(p_room,p_night) then raise exception 'STAY_CAPACITY_BELOW_BOOKED';end if;
 insert into stay_inventory values(p_room,p_night,p_price,p_capacity) on conflict(room_id,night) do update set price=excluded.price,capacity=excluded.capacity;
end $$;
-- The original activity RPC stays available with its original signature.
alter function public.transition_booking(uuid,text,text) rename to transition_activity_booking_base;
revoke all on function public.transition_activity_booking_base(uuid,text,text) from public,anon,authenticated;
create function public.transition_booking(p_id uuid,p_status text,p_reason text default '') returns void
language plpgsql security definer set search_path=public as $$
declare b bookings;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED';end if;
 perform lock_stay_capacity();select * into b from bookings where id=p_id for update;
 if not found or (b.user_id<>auth.uid() and not is_ops()) then raise exception 'FORBIDDEN';end if;
 if b.stay_entitlement_id is not null and p_status<>'completed' then raise exception 'STAY_USE_ORDER_ACTION';end if;
 if p_status='confirmed' and b.status<>p_status and stay_session_free(b.session_id)<b.party_size then raise exception 'CAPACITY_EXCEEDED';end if;
 perform transition_activity_booking_base(p_id,p_status,p_reason);
end $$;
create or replace function public.available_sessions() returns table(id uuid,experience_id text,starts_at timestamptz,capacity int,available bigint)
language sql stable security definer set search_path=public as $$
 select s.id,s.experience_id,s.starts_at,s.capacity,stay_session_free(s.id)::bigint from sessions s where s.starts_at>now() order by s.starts_at
$$;
-- Existing batch assignment rules must also recognize accommodation participation.
create function public.stay_preserve_batch() returns trigger language plpgsql security definer set search_path=public as $$
begin if new.batch_id<>old.batch_id and exists(select 1 from stay_bookings where user_id=old.id) then raise exception 'STAY_BATCH_LOCKED';end if;return new;end $$;
create trigger stay_batch_guard before update of batch_id on profiles for each row execute function stay_preserve_batch();
alter table stay_rooms enable row level security;alter table stay_plans enable row level security;alter table stay_inventory enable row level security;
alter table stay_bookings enable row level security;alter table stay_history enable row level security;alter table stay_entitlements enable row level security;alter table stay_capacity_guard enable row level security;
create policy stay_rooms_read on stay_rooms for select using(true);
create policy stay_plans_read on stay_plans for select using(true);
create policy stay_inventory_ops on stay_inventory for select to authenticated using(is_ops());
create policy stay_bookings_read on stay_bookings for select to authenticated using(user_id=auth.uid() or is_ops());
create policy stay_history_read on stay_history for select to authenticated using(exists(select 1 from stay_bookings b where b.id=booking_id and (b.user_id=auth.uid() or is_ops())));
create policy stay_entitlements_read on stay_entitlements for select to authenticated using(exists(select 1 from stay_bookings b where b.id=booking_id and (b.user_id=auth.uid() or is_ops())));
revoke all on stay_rooms,stay_plans,stay_inventory,stay_bookings,stay_history,stay_entitlements,stay_capacity_guard from anon,authenticated;
grant select on stay_rooms,stay_plans to anon,authenticated;
grant select on stay_inventory,stay_bookings,stay_history,stay_entitlements to authenticated;
revoke all on function lock_stay_capacity(),stay_used(text,date),stay_session_free(uuid),stay_preserve_batch() from public,anon,authenticated;
revoke all on function quote_stay(text,text,date,date,int),search_stays(date,date,int),submit_stay_request(text,text,date,date,int,text,uuid),stay_session_options(uuid),transition_stay_booking(uuid,text,text,uuid),redeem_stay_entitlement(uuid,uuid),reschedule_stay_experience(uuid,uuid),set_stay_inventory(text,date,int,int),transition_booking(uuid,text,text) from public,anon,authenticated;
grant execute on function quote_stay(text,text,date,date,int),search_stays(date,date,int) to anon,authenticated;
grant execute on function submit_stay_request(text,text,date,date,int,text,uuid),stay_session_options(uuid),transition_stay_booking(uuid,text,text,uuid),redeem_stay_entitlement(uuid,uuid),reschedule_stay_experience(uuid,uuid),set_stay_inventory(text,date,int,int),transition_booking(uuid,text,text) to authenticated;
