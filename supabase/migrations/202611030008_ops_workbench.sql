-- Operations workbench fixes: an explicit no-show outcome for expired stay requests,
-- a server clock for UI time gates, accommodation status in trial analytics,
-- and idempotent content saves.

-- 1. no_show terminal state -------------------------------------------------
alter table public.stay_bookings drop constraint stay_bookings_status_check;
alter table public.stay_bookings add constraint stay_bookings_status_check
 check(status in ('pending','confirmed','checked_in','checked_out','cancelled','declined','no_show'));

create or replace function public.transition_stay_booking(p_id uuid,p_status text,p_reason text default '',p_session uuid default null) returns void
language plpgsql security definer set search_path=public as $$
declare b stay_bookings;i stay_inventory;e stay_entitlements;s uuid;preferred uuid;count_nights int;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED';end if;
 perform lock_stay_capacity();select * into b from stay_bookings where id=p_id for update;
 if not found or (b.user_id<>auth.uid() and not is_ops()) then raise exception 'FORBIDDEN';end if;
 if p_status=b.status then return;end if;
 if p_status in ('cancelled','no_show') then
  if p_status='cancelled' then
   if b.status not in ('pending','confirmed') or (b.status='confirmed' and now()>=stay_time(b.check_in,14)) then raise exception 'STAY_TRANSITION_INVALID';end if;
  else
   if not is_ops() then raise exception 'FORBIDDEN';end if;
   if b.status<>'confirmed' or now()<stay_time(b.check_out,12) then raise exception 'STAY_TRANSITION_INVALID';end if;
  end if;
  if exists(select 1 from stay_entitlements se join bookings a on a.id=se.activity_booking_id join sessions ss on ss.id=a.session_id
    where se.booking_id=b.id and (a.status='completed' or (a.status='confirmed' and ss.starts_at<=now()))) then raise exception 'STAY_TRANSITION_INVALID';end if;
  select * into e from stay_entitlements where booking_id=b.id;
  if e.activity_booking_id is not null then
   update bookings set status='cancelled',reason=case when p_status='no_show' then 'Accommodation no-show' else 'Accommodation cancelled' end where id=e.activity_booking_id and status='confirmed';
   insert into booking_history(booking_id,actor_id,status,reason) values(e.activity_booking_id,auth.uid(),'cancelled',case when p_status='no_show' then 'Accommodation no-show' else 'Accommodation cancelled' end);
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

-- 2. Server clock for client-side time gates --------------------------------
create function public.stay_clock() returns timestamptz language sql stable set search_path=public as $$ select now() $$;
revoke all on function public.stay_clock() from public,anon,authenticated;
grant execute on function public.stay_clock() to anon,authenticated;

-- 3. Trial analytics includes accommodation status counts --------------------
create or replace function public.trial_analytics(p_batch text) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare result jsonb; guide_summary jsonb;
begin
  if not is_ops() then raise exception 'FORBIDDEN'; end if;
  if p_batch not in ('demo','pilot-01') then raise exception 'INVALID_BATCH'; end if;
  with flags as (
    select p.id,
      coalesce(bool_or(e.kind='exploration_started'),false) a,
      coalesce(bool_or(e.kind='exploration_completed'),false) b,
      coalesce(bool_or(e.kind='recommendation_saved'),false) c,
      coalesce(bool_or(e.kind='intention_submitted'),false) d,
      coalesce(bool_or(e.kind='confirmed'),false) f,
      coalesce(bool_or(e.kind='completed'),false) g,
      coalesce(bool_or(e.kind='feedback'),false) h
    from profiles p left join events e on e.user_id=p.id and e.batch_id=p.batch_id
    where p.batch_id=p_batch and p.role='guest' group by p.id
  )
  select jsonb_build_object(
    'batch',p_batch,
    'counts',jsonb_build_array(
      count(*),count(*) filter(where a),count(*) filter(where a and b),
      count(*) filter(where a and b and c),count(*) filter(where a and b and c and d),
      count(*) filter(where a and b and c and d and f),
      count(*) filter(where a and b and c and d and f and g),
      count(*) filter(where a and b and c and d and f and g and h)
    )
  ) into result from flags;

  select jsonb_build_object(
    'total',count(*),
    'uniqueUsers',count(distinct user_id),
    'topicCounts',coalesce((select jsonb_object_agg(topic,n) from (
      select topic,count(distinct user_id) n from guide_signals g cross join lateral unnest(g.topics) topic
      where g.batch_id=p_batch group by topic
    ) topics),'{}'::jsonb),
    'partyCounts',coalesce((select jsonb_object_agg(party_type,n) from (
      select party_type,count(distinct user_id) n from guide_signals where batch_id=p_batch group by party_type
    ) parties),'{}'::jsonb),
    'sentimentCounts',coalesce((select jsonb_object_agg(sentiment,n) from (
      select sentiment,count(*) n from guide_signals where batch_id=p_batch group by sentiment
    ) sentiments),'{}'::jsonb),
    'averageStayHours',(select avg(stay_hours) from guide_signals where batch_id=p_batch and stay_hours is not null),
    'averageBudget',(select avg(budget) from guide_signals where batch_id=p_batch and budget is not null)
  ) into guide_summary from guide_signals where batch_id=p_batch;

  return result || jsonb_build_object(
    'interests',coalesce((select jsonb_agg(q) from (
      select x.key field,x.value choice,count(*) users from explorations e join profiles p on p.id=e.user_id
      cross join lateral jsonb_each_text(e.body-'levels'-'answer') x
      where p.batch_id=p_batch and p.role='guest' and x.value<>'' group by x.key,x.value
    ) q),'[]'::jsonb),
    'feedbackSummary',(select jsonb_build_object('count',count(*),'averageRating',avg(f.rating)) from feedback f join bookings b on b.id=f.booking_id where b.batch_id=p_batch),
    'feedback',coalesce((select jsonb_agg(q) from (
      select f.rating,f.comment,f.created_at from feedback f join bookings b on b.id=f.booking_id
      where b.batch_id=p_batch order by f.created_at desc limit 50
    ) q),'[]'::jsonb),
    'statusCounts',coalesce((select jsonb_object_agg(status,n) from (
      select status,count(*) n from bookings where batch_id=p_batch group by status
      union all
      select 'stay_'||status,count(*) n from stay_bookings where batch_id=p_batch group by status
    ) q),'{}'::jsonb),
    'guideIntent',guide_summary
  );
end $$;

-- 4. Idempotent content saves ------------------------------------------------
alter table public.reviewed_contents add column request_id uuid;
create unique index reviewed_contents_once on public.reviewed_contents(user_id,request_id) where request_id is not null;

drop function public.save_reviewed_content(text,text,text,text,text);
create function public.save_reviewed_content(p_type text,p_title text,p_content text,p_language text,p_notes text,p_request uuid default null) returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 if not is_ops() then raise exception 'FORBIDDEN'; end if;
 if length(p_content)>30000 or length(trim(p_content))=0 then raise exception 'INVALID_CONTENT'; end if;
 if p_request is not null then
  select id into result from reviewed_contents where user_id=auth.uid() and request_id=p_request;
  if found then return result; end if;
 end if;
 insert into reviewed_contents(user_id,type,title,content,language,review_status,audit_notes,reviewer_id,request_id)
 values(auth.uid(),p_type,left(p_title,300),p_content,p_language,'approved',p_notes,auth.uid(),p_request) returning id into result;
 return result;
end $$;
revoke all on function public.save_reviewed_content(text,text,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.save_reviewed_content(text,text,text,text,text,uuid) to authenticated;
