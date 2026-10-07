-- Database-only QA, NOT a browser/Auth login or model test.
-- Run via db query --linked --project-ref jhosvgldwgndpudwentv.
-- All QA identities and business records are created inside a rolled-back transaction.
begin;
set local statement_timeout = '60s';
do $qa$
declare
  guest_a uuid := gen_random_uuid(); guest_b uuid := gen_random_uuid();
  operator_id uuid := gen_random_uuid(); session_id uuid := gen_random_uuid();
  request_id uuid := gen_random_uuid(); signal_request uuid := gen_random_uuid();
  recommendation_id uuid; qa_booking uuid; content_id uuid; signal_id uuid;
  baseline jsonb; observed jsonb; denied boolean; n integer;
begin
  insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values
    (guest_a,guest_a::text||'@qa.invalid','{"name":"QA database guest A"}',now(),now()),
    (guest_b,guest_b::text||'@qa.invalid','{"name":"QA database guest B"}',now(),now()),
    (operator_id,operator_id::text||'@qa.invalid','{"name":"QA database operator"}',now(),now());
  update public.profiles set role='ops' where id=operator_id;
  insert into public.sessions(id,experience_id,starts_at,capacity)
    values(session_id,'workshop',now()+interval '2 days',8);

  perform set_config('request.jwt.claim.sub',operator_id::text,true);
  set local role authenticated;
  baseline := public.trial_analytics('pilot-01');
  perform public.assign_guest_batch(guest_a,'pilot-01');
  reset role;

  perform set_config('request.jwt.claim.sub',guest_a::text,true);
  set local role authenticated;
  if auth.uid()<>guest_a then raise exception 'QA_IDENTITY_MISMATCH'; end if;
  perform public.start_exploration();
  perform public.save_exploration('{"motif":"gate","palette":"jade","levels":["1/4","1/16"],"answer":"relative"}');
  recommendation_id := public.save_recommendation('workshop',
    '{"minutes":90,"budget":150,"party":"solo","interest":"craft"}',request_id);
  if recommendation_id <> public.save_recommendation('workshop',
    '{"minutes":90,"budget":150,"party":"solo","interest":"craft"}',request_id)
  then raise exception 'QA_RECOMMENDATION_NOT_IDEMPOTENT'; end if;
  qa_booking := public.submit_intention(session_id,1,request_id,recommendation_id);
  if qa_booking<>public.submit_intention(session_id,1,request_id,recommendation_id)
  then raise exception 'QA_INTENTION_NOT_IDEMPOTENT'; end if;
  signal_id := public.save_guide_signal(signal_request,'zh',array['craft'],2,150,'solo','positive');
  if signal_id<>public.save_guide_signal(signal_request,'zh',array['craft'],2,150,'solo','positive')
  then raise exception 'QA_SIGNAL_NOT_IDEMPOTENT'; end if;
  perform public.claim_ai_request();
  denied := false;
  begin perform public.trial_analytics('pilot-01');
  exception when others then
    if sqlerrm<>'FORBIDDEN' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'QA_GUEST_ANALYTICS_ALLOWED'; end if;
  denied := false;
  begin perform public.save_reviewed_content('copy','QA','QA text','zh','QA review');
  exception when others then
    if sqlerrm<>'FORBIDDEN' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'QA_GUEST_REVIEW_ALLOWED'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub',guest_b::text,true);
  set local role authenticated;
  if exists(select 1 from public.profiles where id=guest_a)
    or exists(select 1 from public.explorations where user_id=guest_a)
    or exists(select 1 from public.recommendations where user_id=guest_a)
    or exists(select 1 from public.bookings where id=qa_booking)
    or exists(select 1 from public.guide_signals where user_id=guest_a)
  then raise exception 'QA_CROSS_GUEST_DATA_VISIBLE'; end if;
  denied := false;
  begin perform public.transition_booking(qa_booking,'cancelled','QA forbidden attempt');
  exception when others then
    if sqlerrm<>'FORBIDDEN' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'QA_CROSS_GUEST_MUTATION_ALLOWED'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub',operator_id::text,true);
  set local role authenticated;
  denied := false;
  begin perform public.assign_guest_batch(guest_a,'demo');
  exception when others then
    if sqlerrm<>'PARTICIPANT_HAS_ACTIVITY' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'QA_ACTIVE_COHORT_MOVABLE'; end if;
  perform public.transition_booking(qa_booking,'confirmed','QA confirmation');
  perform public.transition_booking(qa_booking,'confirmed','QA retry');
  perform public.transition_booking(qa_booking,'completed','QA simulation completed');
  content_id := public.save_reviewed_content('copy','QA reviewed content','QA text','zh','QA manual review');
  if not exists(select 1 from public.reviewed_contents where id=content_id and review_status='approved')
  then raise exception 'QA_REVIEW_NOT_SAVED'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub',guest_a::text,true);
  set local role authenticated;
  if not exists(select 1 from public.bookings where id=qa_booking and status='completed')
  then raise exception 'QA_GUEST_STATUS_NOT_SYNCED'; end if;
  perform public.submit_feedback(qa_booking,5,'QA feedback; not real operating evidence');
  perform public.submit_feedback(qa_booking,5,'QA duplicate feedback');
  select count(*) into n from public.feedback where feedback.booking_id=qa_booking;
  reset role;
  if n<>1 then raise exception 'QA_FEEDBACK_NOT_IDEMPOTENT'; end if;
  select count(*) into n from public.booking_history where booking_history.booking_id=qa_booking;
  if n<>3 then raise exception 'QA_TRANSITION_HISTORY_NOT_IDEMPOTENT'; end if;

  perform set_config('request.jwt.claim.sub',operator_id::text,true);
  set local role authenticated;
  observed := public.trial_analytics('pilot-01');
  for n in 0..7 loop
    if (observed->'counts'->>n)::integer<>(baseline->'counts'->>n)::integer+1
    then raise exception 'QA_FUNNEL_COUNTS_INVALID'; end if;
  end loop;
  reset role;

  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  denied := false;
  begin perform public.trial_analytics('demo');
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'QA_ANON_RPC_ALLOWED'; end if;
  reset role;
end $qa$;
rollback;
select true as database_qa_passed,
  'RPC, RLS, isolation, cohort, intention, status, feedback, analytics, Studio, idempotency' as coverage,
  'All QA data rolled back; not an Auth login, browser, or model test' as limitation;
