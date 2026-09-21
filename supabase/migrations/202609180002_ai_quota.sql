create table public.ai_usage(user_id uuid not null references public.profiles on delete cascade, hour timestamptz not null, requests int not null, primary key(user_id,hour));
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon,authenticated;
create function public.claim_ai_request() returns void language plpgsql security definer set search_path=public as $$
declare n int;
begin
 if auth.uid() is null then raise exception 'SIGN_IN_REQUIRED'; end if;
 insert into ai_usage values(auth.uid(),date_trunc('hour',now()),1)
 on conflict(user_id,hour) do update set requests=ai_usage.requests+1 returning requests into n;
 if n>60 then raise exception 'RATE_LIMIT'; end if;
end $$;
revoke execute on function public.claim_ai_request() from public,anon;
grant execute on function public.claim_ai_request() to authenticated;
