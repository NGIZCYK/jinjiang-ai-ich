-- Batch-scoped guide intent and controlled study enrollment.
-- Chat text is never stored: only validated, structured fields are retained.

create table public.guide_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  batch_id text not null references public.batches,
  request_id uuid not null,
  language text not null check (language in ('zh','en')),
  topics text[] not null default '{}'::text[] check (topics <@ array['craft','experience','culture']::text[]),
  stay_hours numeric check (stay_hours is null or (stay_hours > 0 and stay_hours <= 168)),
  budget numeric check (budget is null or (budget > 0 and budget <= 100000)),
  party_type text not null check (party_type in ('solo','family','business','unspecified')),
  sentiment text not null check (sentiment in ('positive','neutral','negative')),
  created_at timestamptz not null default now(),
  unique(user_id, request_id)
);
create index guide_signals_batch_created on public.guide_signals(batch_id, created_at);
alter table public.guide_signals enable row level security;
create policy guide_signals_own_read on public.guide_signals for select to authenticated using(user_id=auth.uid());

-- Public registration always creates a rehearsal account. Formal study membership
-- is assigned later by an operator, before the participant starts any activity.
create or replace function public.create_profile() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,name,batch_id)
  values(new.id,left(coalesce(new.raw_user_meta_data->>'name','Guest'),80),'demo');
  return new;
end $$;

create function public.save_guide_signal(
  p_request uuid,
  p_language text,
  p_topics text[],
  p_stay_hours numeric,
  p_budget numeric,
  p_party_type text,
  p_sentiment text
) returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid; participant_batch text;
begin
  if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED'; end if;
  if p_request is null
    or p_language not in ('zh','en')
    or p_topics is null
    or cardinality(p_topics)>3
    or exists(select 1 from unnest(p_topics) topic where topic not in ('craft','experience','culture'))
    or cardinality(p_topics)<>(select count(distinct topic) from unnest(p_topics) topic)
    or (cardinality(p_topics)=0 and p_stay_hours is null and p_budget is null and p_party_type='unspecified')
    or (p_stay_hours is not null and (p_stay_hours<=0 or p_stay_hours>168))
    or (p_budget is not null and (p_budget<=0 or p_budget>100000))
    or p_party_type not in ('solo','family','business','unspecified')
    or p_sentiment not in ('positive','neutral','negative')
  then raise exception 'INVALID_GUIDE_SIGNAL'; end if;

  select batch_id into participant_batch from profiles where id=auth.uid() and role='guest';
  if not found then raise exception 'GUEST_REQUIRED'; end if;

  insert into guide_signals(user_id,batch_id,request_id,language,topics,stay_hours,budget,party_type,sentiment)
  values(auth.uid(),participant_batch,p_request,p_language,p_topics,p_stay_hours,p_budget,p_party_type,p_sentiment)
  on conflict(user_id,request_id) do nothing
  returning id into result;
  if result is null then
    select id into result from guide_signals where user_id=auth.uid() and request_id=p_request;
  end if;
  return result;
end $$;

create function public.assign_guest_batch(p_user uuid,p_batch text) returns void
language plpgsql security definer set search_path=public as $$
declare current_batch text;
begin
  if not is_ops() then raise exception 'FORBIDDEN'; end if;
  if p_batch not in ('demo','pilot-01') then raise exception 'INVALID_BATCH'; end if;
  select batch_id into current_batch from profiles where id=p_user and role='guest' for update;
  if not found then raise exception 'GUEST_NOT_FOUND'; end if;
  if current_batch=p_batch then return; end if;
  if exists(select 1 from events where user_id=p_user)
    or exists(select 1 from explorations where user_id=p_user)
    or exists(select 1 from preferences where user_id=p_user)
    or exists(select 1 from recommendations where user_id=p_user)
    or exists(select 1 from bookings where user_id=p_user)
    or exists(select 1 from guide_signals where user_id=p_user)
  then raise exception 'PARTICIPANT_HAS_ACTIVITY'; end if;
  update profiles set batch_id=p_batch where id=p_user;
end $$;

create function public.participant_roster()
returns table(id uuid,name text,batch_id text,created_at timestamptz,has_activity boolean)
language plpgsql stable security definer set search_path=public as $$
begin
  if not is_ops() then raise exception 'FORBIDDEN'; end if;
  return query
  select p.id,p.name,p.batch_id,p.created_at,
    exists(select 1 from events e where e.user_id=p.id)
    or exists(select 1 from explorations e where e.user_id=p.id)
    or exists(select 1 from preferences x where x.user_id=p.id)
    or exists(select 1 from recommendations r where r.user_id=p.id)
    or exists(select 1 from bookings b where b.user_id=p.id)
    or exists(select 1 from guide_signals g where g.user_id=p.id) as has_activity
  from profiles p where p.role='guest' order by p.created_at desc;
end $$;

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
    'feedback',coalesce((select jsonb_agg(q) from (
      select f.rating,f.comment,f.created_at from feedback f join bookings b on b.id=f.booking_id
      where b.batch_id=p_batch order by f.created_at desc limit 50
    ) q),'[]'::jsonb),
    'statusCounts',coalesce((select jsonb_object_agg(status,n) from (
      select status,count(*) n from bookings where batch_id=p_batch group by status
    ) q),'{}'::jsonb),
    'guideIntent',guide_summary
  );
end $$;

revoke all on public.guide_signals from anon,authenticated;
grant select on public.guide_signals to authenticated;
revoke execute on function public.save_guide_signal(uuid,text,text[],numeric,numeric,text,text),
  public.assign_guest_batch(uuid,text),public.participant_roster() from public,anon,authenticated;
grant execute on function public.save_guide_signal(uuid,text,text[],numeric,numeric,text,text),
  public.assign_guest_batch(uuid,text),public.participant_roster() to authenticated;
