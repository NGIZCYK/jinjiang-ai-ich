-- Read-only schema inspection after migration. Run with --project-ref jhosvgldwgndpudwentv.
-- Returns schema metadata only; does not read participant or Auth records.
select jsonb_build_object(
  'migrations', (select jsonb_agg(version order by version)
    from supabase_migrations.schema_migrations),
  'rpc', (select jsonb_agg(jsonb_build_object(
    'signature', expected.signature,
    'exists', proc.oid is not null,
    'authenticatedCanExecute', coalesce(has_function_privilege('authenticated', proc.oid, 'EXECUTE'), false),
    'anonCanExecute', coalesce(has_function_privilege('anon', proc.oid, 'EXECUTE'), false),
    'securityDefiner', proc.prosecdef,
    'definition', case when proc.oid is not null then pg_get_functiondef(proc.oid) end
  ) order by expected.signature)
  from (values
    ('public.start_exploration()'),
    ('public.save_exploration(jsonb)'),
    ('public.save_recommendation(text,jsonb,uuid)'),
    ('public.available_sessions()'),
    ('public.submit_intention(uuid,integer,uuid,uuid)'),
    ('public.transition_booking(uuid,text,text)'),
    ('public.submit_feedback(uuid,integer,text)'),
    ('public.save_reviewed_content(text,text,text,text,text)'),
    ('public.trial_analytics(text)'),
    ('public.save_guide_signal(uuid,text,text[],numeric,numeric,text,text)'),
    ('public.assign_guest_batch(uuid,text)'),
    ('public.participant_roster()'),
    ('public.claim_ai_request()')
  ) expected(signature)
  left join pg_proc proc on proc.oid = to_regprocedure(expected.signature)),
  'tables', (select jsonb_agg(jsonb_build_object(
    'table', expected.name, 'exists', relation.oid is not null,
    'rowLevelSecurity', relation.relrowsecurity
  ) order by expected.name)
  from (values ('profiles'), ('explorations'), ('preferences'), ('recommendations'),
    ('bookings'), ('booking_history'), ('feedback'), ('events'), ('reviewed_contents'),
    ('guide_signals'), ('ai_usage')) expected(name)
  left join pg_class relation on relation.oid = to_regclass('public.' || expected.name))
) as inspection;
