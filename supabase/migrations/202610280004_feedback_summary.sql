-- Whole-cohort aggregates are independent of the latest 50 feedback details.
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
    ) q),'{}'::jsonb),
    'guideIntent',guide_summary
  );
end $$;
