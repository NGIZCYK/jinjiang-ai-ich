-- Prepared for local validation only. Do not apply remotely before release approval.
-- Add floral motifs while preserving all legacy card values and access controls.
create or replace function public.save_exploration(p_body jsonb) returns void language plpgsql security definer set search_path=public as $$
declare done boolean; n int;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 if p_body is null or jsonb_typeof(p_body)<>'object' or coalesce(jsonb_typeof(p_body->'levels'),'')<>'array' then raise exception 'INVALID_EXPLORATION'; end if;
 if length(p_body::text)>2000 or not coalesce(p_body->>'motif' in ('','gate','bridge','boats','market','huayun-pink-petal','huayun-white-petal','huayun-stamen','huayun-ground'),false)
 or not coalesce(p_body->>'palette' in ('','jade','ivory','rose','gold','indigo'),false)
 or not coalesce(p_body->>'answer' in ('','relative','universal'),false) then raise exception 'INVALID_EXPLORATION'; end if;
 if exists(select 1 from jsonb_array_elements_text(p_body->'levels') x where x not in ('full','1/4','1/16','1/32')) then raise exception 'INVALID_LEVEL'; end if;
 select count(distinct x) into n from jsonb_array_elements_text(p_body->'levels') x;
 done := p_body->>'motif'<>'' and p_body->>'palette'<>'' and n>=2 and p_body->>'answer'<>'';
 p_body := jsonb_build_object('motif',p_body->>'motif','palette',p_body->>'palette','levels',p_body->'levels','answer',p_body->>'answer');
 insert into explorations values(auth.uid(),p_body,done,now()) on conflict(user_id) do update set body=excluded.body,completed=excluded.completed,updated_at=now();
 perform emit_event(auth.uid(),'exploration_started');
 if done then perform emit_event(auth.uid(),'exploration_completed'); end if;
end $$;
