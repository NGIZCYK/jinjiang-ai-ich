-- Course prototype. Run once with Supabase migrations, never with a browser key.
create table public.batches (id text primary key, title text not null, is_demo boolean not null);
insert into public.batches values ('demo','演示 / Demo',true),('pilot-01','第一轮用户测试 / Study 01',false);
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 name text not null, role text not null default 'guest' check (role in ('guest','ops')),
 batch_id text not null references public.batches default 'demo', created_at timestamptz not null default now()
);
create function public.create_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,name,batch_id) values(new.id,left(coalesce(new.raw_user_meta_data->>'name','Guest'),80),
 case when new.raw_user_meta_data->>'batch_id'='pilot-01' then 'pilot-01' else 'demo' end);
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
create function public.is_ops() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=auth.uid() and role='ops');
$$;
create table public.experiences (
 id text primary key, title_zh text not null, title_en text not null, minutes int not null check(minutes>0),
 price numeric not null check(price>=0), interests text[] not null, parties text[] not null, active boolean not null default true
);
insert into public.experiences values
 ('scroll','长卷自助导览','Scroll discovery',15,0,array['culture'],array['solo','family','business'],true),
 ('materials','丝线材料探索','Silk & colour exploration',30,30,array['craft'],array['solo','family','business'],true),
 ('workshop','苏绣入门工坊','Embroidery introduction',90,128,array['experience','craft'],array['solo','family'],true);
create table public.sessions (
 id uuid primary key default gen_random_uuid(), experience_id text not null references experiences,
 starts_at timestamptz not null, capacity int not null check(capacity>0), unique(experience_id,starts_at)
);
create table public.explorations (
 user_id uuid primary key references profiles on delete cascade, body jsonb not null,
 completed boolean not null, updated_at timestamptz not null default now()
);
create table public.preferences (
 user_id uuid primary key references profiles on delete cascade, needs jsonb not null, updated_at timestamptz not null default now()
);
create table public.recommendations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade,
 experience_id text not null references experiences, needs jsonb not null, request_id uuid not null,
 created_at timestamptz not null default now(), unique(user_id,request_id)
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade,
 session_id uuid not null references sessions, party_size int not null check(party_size between 1 and 8),
 status text not null default 'pending' check(status in ('pending','confirmed','completed','cancelled','declined')),
 reason text not null default '', batch_id text not null references batches,
 recommendation_id uuid references recommendations, request_id uuid not null,
 created_at timestamptz not null default now(), unique(user_id,request_id)
);
create unique index one_active_booking on bookings(user_id,session_id) where status in ('pending','confirmed','completed');
create index bookings_session on bookings(session_id);
create table public.booking_history (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references bookings on delete cascade,
 actor_id uuid not null references profiles, status text not null, reason text not null default '', created_at timestamptz not null default now()
);
create table public.feedback (
 booking_id uuid primary key references bookings on delete cascade, user_id uuid not null references profiles on delete cascade,
 rating int not null check(rating between 1 and 5), comment text not null check(length(comment)<=1000), created_at timestamptz not null default now()
);
create table public.events (
 user_id uuid not null references profiles on delete cascade, batch_id text not null references batches,
 kind text not null check(kind in ('exploration_started','exploration_completed','recommendation_saved','intention_submitted','confirmed','completed','feedback')),
 created_at timestamptz not null default now(), primary key(user_id,batch_id,kind)
);
create table public.reviewed_contents (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles,
 type text not null check(type in ('itinerary','copy')), title text not null, content text not null,
 language text not null check(language in ('zh','en')), review_status text not null check(review_status='approved'),
 audit_notes text not null check(length(trim(audit_notes))>0), reviewer_id uuid not null references profiles,
 created_at timestamptz not null default now()
);

-- All mutations go through validating RPCs. No client may edit roles, events or capacity.
alter table batches enable row level security;
alter table profiles enable row level security;
alter table experiences enable row level security;
alter table sessions enable row level security;
alter table explorations enable row level security;
alter table preferences enable row level security;
alter table recommendations enable row level security;
alter table bookings enable row level security;
alter table booking_history enable row level security;
alter table feedback enable row level security;
alter table events enable row level security;
alter table reviewed_contents enable row level security;
create policy batches_read on batches for select to anon,authenticated using(true);
create policy catalog_read on experiences for select to anon,authenticated using(active or is_ops());
create policy sessions_read on sessions for select to authenticated using(true);
create policy profile_read on profiles for select to authenticated using(id=auth.uid() or is_ops());
create policy exploration_read on explorations for select to authenticated using(user_id=auth.uid());
create policy preference_read on preferences for select to authenticated using(user_id=auth.uid());
create policy recommendation_read on recommendations for select to authenticated using(user_id=auth.uid());
create policy booking_read on bookings for select to authenticated using(user_id=auth.uid() or is_ops());
create policy history_read on booking_history for select to authenticated using(exists(select 1 from bookings b where b.id=booking_id and (b.user_id=auth.uid() or is_ops())));
create policy feedback_read on feedback for select to authenticated using(user_id=auth.uid() or is_ops());
create policy contents_read on reviewed_contents for select to authenticated using(is_ops());

create function public.emit_event(p_user uuid,p_kind text) returns void language sql security definer set search_path=public as $$
 insert into events(user_id,batch_id,kind) select id,batch_id,p_kind from profiles where id=p_user and role='guest' on conflict do nothing;
$$;
create function public.start_exploration() returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 perform emit_event(auth.uid(),'exploration_started');
end $$;
create function public.save_exploration(p_body jsonb) returns void language plpgsql security definer set search_path=public as $$
declare done boolean; n int;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 if p_body is null or jsonb_typeof(p_body)<>'object' or coalesce(jsonb_typeof(p_body->'levels'),'')<>'array' then raise exception 'INVALID_EXPLORATION'; end if;
 if length(p_body::text)>2000 or not coalesce(p_body->>'motif' in ('','gate','bridge','boats','market'),false)
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
create function public.save_recommendation(p_experience text,p_needs jsonb,p_request uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare e experiences; result uuid; m numeric; b numeric;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 perform 1 from profiles where id=auth.uid() for update;
 select id into result from recommendations where user_id=auth.uid() and request_id=p_request;
 if found then return result; end if;
 m := (p_needs->>'minutes')::numeric; b := (p_needs->>'budget')::numeric;
 if m is null or b is null or m<0 or m>1440 or b<0 or b>100000 or
 not coalesce(p_needs->>'party' in ('solo','family','business'),false) or not coalesce(p_needs->>'interest' in ('culture','craft','experience'),false) then raise exception 'INVALID_NEEDS'; end if;
 select * into e from experiences where id=p_experience and active;
 if not found or e.minutes>m or e.price>b or not(p_needs->>'party'=any(e.parties)) then raise exception 'NO_MATCH'; end if;
 insert into preferences values(auth.uid(),p_needs,now()) on conflict(user_id) do update set needs=excluded.needs,updated_at=now();
 insert into recommendations(user_id,experience_id,needs,request_id) values(auth.uid(),p_experience,p_needs,p_request) returning id into result;
 perform emit_event(auth.uid(),'recommendation_saved'); return result;
end $$;
create function public.available_sessions() returns table(id uuid,experience_id text,starts_at timestamptz,capacity int,available bigint)
language sql stable security definer set search_path=public as $$
 select s.id,s.experience_id,s.starts_at,s.capacity,s.capacity-coalesce(sum(b.party_size) filter(where b.status in ('confirmed','completed')),0)
 from sessions s left join bookings b on b.session_id=s.id where s.starts_at>now() group by s.id order by s.starts_at;
$$;
create function public.submit_intention(p_session uuid,p_size int,p_request uuid,p_recommendation uuid default null) returns uuid
language plpgsql security definer set search_path=public as $$
declare s sessions; result uuid; batch text;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 select id into result from bookings where user_id=auth.uid() and request_id=p_request;
 if found then return result; end if;
 if p_size is null or p_size<1 or p_size>8 then raise exception 'INVALID_PARTY_SIZE'; end if;
 select * into s from sessions where id=p_session for update;
 if not found then raise exception 'SESSION_UNAVAILABLE'; end if;
 select id into result from bookings where user_id=auth.uid() and request_id=p_request;
 if found then return result; end if;
 if s.starts_at<=now() then raise exception 'SESSION_UNAVAILABLE'; end if;
 if not exists(select 1 from experiences where id=s.experience_id and active) then raise exception 'SESSION_UNAVAILABLE'; end if;
 if p_size>s.capacity then raise exception 'CAPACITY_EXCEEDED'; end if;
 if exists(select 1 from bookings where user_id=auth.uid() and session_id=s.id and status in ('pending','confirmed','completed')) then raise exception 'DUPLICATE_INTENTION'; end if;
 if p_recommendation is not null and not exists(select 1 from recommendations where id=p_recommendation and user_id=auth.uid() and experience_id=s.experience_id) then raise exception 'INVALID_RECOMMENDATION'; end if;
 select batch_id into batch from profiles where id=auth.uid();
 insert into bookings(user_id,session_id,party_size,batch_id,request_id,recommendation_id) values(auth.uid(),s.id,p_size,batch,p_request,p_recommendation) returning id into result;
 insert into booking_history(booking_id,actor_id,status) values(result,auth.uid(),'pending');
 perform emit_event(auth.uid(),'intention_submitted'); return result;
end $$;
create function public.transition_booking(p_id uuid,p_status text,p_reason text default '') returns void
language plpgsql security definer set search_path=public as $$
declare b bookings; s sessions; used int;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 -- Lock the session first for EVERY transition: concurrent confirmations serialize on capacity.
 select s0.* into s from sessions s0 join bookings b0 on b0.session_id=s0.id where b0.id=p_id for update of s0;
 select * into b from bookings where id=p_id for update;
 if not found or (b.user_id<>auth.uid() and not is_ops()) then raise exception 'FORBIDDEN'; end if;
 if p_status=b.status then return; end if;
 if p_status='cancelled' then
   if b.user_id<>auth.uid() or b.status not in ('pending','confirmed') or (b.status='confirmed' and s.starts_at<=now()) then raise exception 'INVALID_TRANSITION'; end if;
 elsif p_status in ('confirmed','declined','completed') then
   if not is_ops() then raise exception 'FORBIDDEN'; end if;
   if p_status in ('confirmed','declined') and b.status<>'pending' then raise exception 'INVALID_TRANSITION'; end if;
   if p_status='completed' and b.status<>'confirmed' then raise exception 'INVALID_TRANSITION'; end if;
   if p_status='declined' and length(trim(coalesce(p_reason,'')))=0 then raise exception 'REASON_REQUIRED'; end if;
   if p_status='confirmed' then
     if s.starts_at<=now() then raise exception 'SESSION_UNAVAILABLE'; end if;
     select coalesce(sum(party_size),0) into used from bookings where session_id=s.id and status in ('confirmed','completed');
     if used+b.party_size>s.capacity then raise exception 'CAPACITY_EXCEEDED'; end if;
   end if;
 else raise exception 'INVALID_TRANSITION'; end if;
 update bookings set status=p_status,reason=left(coalesce(p_reason,''),1000) where id=p_id;
 insert into booking_history(booking_id,actor_id,status,reason) values(p_id,auth.uid(),p_status,left(coalesce(p_reason,''),1000));
 if p_status in ('confirmed','completed') then perform emit_event(b.user_id,p_status); end if;
end $$;
create function public.submit_feedback(p_booking uuid,p_rating int,p_comment text) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from bookings where id=p_booking and user_id=auth.uid() and status='completed') then raise exception 'COMPLETED_BOOKING_REQUIRED'; end if;
 insert into feedback values(p_booking,auth.uid(),p_rating,trim(p_comment),now()) on conflict(booking_id) do nothing;
 perform emit_event(auth.uid(),'feedback');
end $$;
create function public.save_reviewed_content(p_type text,p_title text,p_content text,p_language text,p_notes text) returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 if not is_ops() then raise exception 'FORBIDDEN'; end if;
 if length(p_content)>30000 or length(trim(p_content))=0 then raise exception 'INVALID_CONTENT'; end if;
 insert into reviewed_contents(user_id,type,title,content,language,review_status,audit_notes,reviewer_id)
 values(auth.uid(),p_type,left(p_title,300),p_content,p_language,'approved',p_notes,auth.uid()) returning id into result;
 return result;
end $$;
create function public.trial_analytics(p_batch text) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
 if not is_ops() then raise exception 'FORBIDDEN'; end if;
 with flags as (
 select p.id,
 coalesce(bool_or(e.kind='exploration_started'),false) a,coalesce(bool_or(e.kind='exploration_completed'),false) b,
 coalesce(bool_or(e.kind='recommendation_saved'),false) c,coalesce(bool_or(e.kind='intention_submitted'),false) d,
 coalesce(bool_or(e.kind='confirmed'),false) f,coalesce(bool_or(e.kind='completed'),false) g,coalesce(bool_or(e.kind='feedback'),false) h
 from profiles p left join events e on e.user_id=p.id and e.batch_id=p.batch_id where p.batch_id=p_batch and p.role='guest' group by p.id
 ) select jsonb_build_object('batch',p_batch,'counts',jsonb_build_array(count(*),count(*) filter(where a),count(*) filter(where a and b),count(*) filter(where a and b and c),count(*) filter(where a and b and c and d),count(*) filter(where a and b and c and d and f),count(*) filter(where a and b and c and d and f and g),count(*) filter(where a and b and c and d and f and g and h))) into result from flags;
 return result || jsonb_build_object(
 'interests',coalesce((select jsonb_agg(q) from (select x.key field,x.value choice,count(*) users from explorations e join profiles p on p.id=e.user_id cross join lateral jsonb_each_text(e.body-'levels'-'answer') x where p.batch_id=p_batch and p.role='guest' and x.value<>'' group by x.key,x.value) q),'[]'::jsonb),
 'feedback',coalesce((select jsonb_agg(q) from (select f.rating,f.comment,f.created_at from feedback f join bookings b on b.id=f.booking_id where b.batch_id=p_batch order by f.created_at desc limit 50) q),'[]'::jsonb),
 'statusCounts',coalesce((select jsonb_object_agg(status,n) from (select status,count(*) n from bookings where batch_id=p_batch group by status) q),'{}'::jsonb));
end $$;

revoke all on batches,profiles,experiences,sessions,explorations,preferences,recommendations,bookings,booking_history,feedback,events,reviewed_contents from anon,authenticated;
grant select on batches,experiences to anon,authenticated;
grant select on profiles,sessions,explorations,preferences,recommendations,bookings,booking_history,feedback,reviewed_contents to authenticated;
revoke execute on function create_profile(),is_ops(),emit_event(uuid,text),start_exploration(),save_exploration(jsonb),save_recommendation(text,jsonb,uuid),available_sessions(),submit_intention(uuid,int,uuid,uuid),transition_booking(uuid,text,text),submit_feedback(uuid,int,text),save_reviewed_content(text,text,text,text,text),trial_analytics(text) from public,anon,authenticated;
grant execute on function is_ops() to anon,authenticated;
grant execute on function start_exploration(),save_exploration(jsonb),save_recommendation(text,jsonb,uuid),available_sessions(),submit_intention(uuid,int,uuid,uuid),transition_booking(uuid,text,text),submit_feedback(uuid,int,text),save_reviewed_content(text,text,text,text,text),trial_analytics(text) to authenticated;
