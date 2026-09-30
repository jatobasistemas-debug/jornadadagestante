begin;
create table public.communication_preferences(user_id uuid primary key references public.profiles(user_id) on delete cascade,weekly_email boolean not null default false,version text not null default '2026-09-20',updated_at timestamptz not null default now());
create table public.communication_consent_history(id bigint generated always as identity primary key,user_id uuid not null references public.profiles(user_id) on delete cascade,weekly_email boolean not null,version text not null,recorded_at timestamptz not null default now());
create index communications_consent_user on public.communication_consent_history(user_id,recorded_at);
create table public.email_deliveries(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(user_id) on delete cascade,pregnancy_id uuid references public.pregnancies(id) on delete cascade,kind text not null check(kind in('welcome','weekly','security')),period date not null default current_date,week integer check(week between 1 and 42),status text not null default 'pending' check(status in('pending','sending','sent','failed','cancelled')),attempts integer not null default 0 check(attempts between 0 and 5),available_at timestamptz not null default now(),claimed_at timestamptz,sent_at timestamptz,provider_id text,error_code text,unique(user_id,kind,period));
create index email_delivery_queue on public.email_deliveries(status,available_at);
create index email_pregnancy on public.email_deliveries(pregnancy_id);
create table public.referral_codes(user_id uuid primary key references public.profiles(user_id) on delete cascade,code text not null unique check(code ~ '^[a-f0-9]{24}$'),created_at timestamptz not null default now());
create table public.referral_conversions(id uuid primary key default gen_random_uuid(),referrer_id uuid not null references public.profiles(user_id) on delete cascade,user_id uuid not null unique references public.profiles(user_id) on delete cascade,status text not null check(status in('registered','active')),created_at timestamptz not null default now(),check(user_id<>referrer_id));
create index referrals_referrer on public.referral_conversions(referrer_id);
do $$declare t text;begin foreach t in array array['communication_preferences','communication_consent_history','email_deliveries','referral_codes','referral_conversions'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);execute format('grant all on public.%I to service_role',t);end loop;end$$;
create policy preferences_owner on public.communication_preferences for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and version='2026-09-20');
grant insert,update on public.communication_preferences to authenticated;
create policy communication_history_owner on public.communication_consent_history for select to authenticated using(user_id=(select auth.uid()));
create policy delivery_owner on public.email_deliveries for select to authenticated using(user_id=(select auth.uid()) or private.is_superadmin());
create policy referral_owner on public.referral_codes for select to authenticated using(user_id=(select auth.uid()));
create policy referral_create on public.referral_codes for insert to authenticated with check(user_id=(select auth.uid()) and private.feature_enabled('referrals'));
grant insert on public.referral_codes to authenticated;
create policy referral_conversion_read on public.referral_conversions for select to authenticated using(referrer_id=(select auth.uid()) or user_id=(select auth.uid()) or private.is_superadmin());
create function private.communication_audit() returns trigger language plpgsql security definer set search_path='' as $$begin new.updated_at:=now();insert into public.communication_consent_history(user_id,weekly_email,version) values(new.user_id,new.weekly_email,new.version);return new;end;$$;
revoke all on function private.communication_audit() from public,anon,authenticated;
create trigger communication_audit before insert or update on public.communication_preferences for each row execute function private.communication_audit();
create function private.record_referral() returns trigger language plpgsql security definer set search_path='' as $$declare owner_id uuid;begin
 if private.feature_enabled('referrals') and length(new.raw_user_meta_data->>'referral_code')=24 then
 select user_id into owner_id from public.referral_codes where code=new.raw_user_meta_data->>'referral_code';
 if owner_id is not null and owner_id<>new.id then insert into public.referral_conversions(referrer_id,user_id,status) values(owner_id,new.id,'registered');end if;
 end if;return new;end;$$;
revoke all on function private.record_referral() from public,anon,authenticated;
create trigger zzz_record_referral after insert on auth.users for each row execute function private.record_referral();
create function public.schedule_weekly() returns integer language plpgsql security invoker set search_path='' as $$declare n integer;begin
 insert into public.email_deliveries(user_id,pregnancy_id,kind,period,week)
 select distinct on(p.user_id) p.user_id,p.id,'weekly',current_date,least(42,greatest(1,floor((280-(p.due_date-current_date))/7.0)::integer))
 from public.pregnancies p join public.communication_preferences c on c.user_id=p.user_id
 where c.weekly_email and p.status='active' and (p.clinic_id is null or exists(select 1 from public.clinics where id=p.clinic_id and status='active'))
 order by p.user_id,p.created_at desc on conflict(user_id,kind,period) do nothing;
 get diagnostics n=row_count;return n;end;$$;
create function public.claim_emails() returns setof public.email_deliveries language sql security invoker set search_path='' as $$
 update public.email_deliveries set status='sending',claimed_at=now(),attempts=attempts+1 where id in(
 select id from public.email_deliveries where (status in('pending','failed') or (status='sending' and claimed_at<now()-interval '15 minutes')) and attempts<5 and available_at<=now()
 order by available_at limit 30 for update skip locked) returning *;
$$;
revoke all on function public.schedule_weekly(),public.claim_emails() from public,anon,authenticated;
grant execute on function public.schedule_weekly(),public.claim_emails() to service_role;
grant usage,select on all sequences in schema public to service_role;
create function private.companion_enrollment() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.raw_user_meta_data->>'entry_mode'='companion' then
 if not private.feature_enabled('companion') or not(select enabled from private.registration_settings where singleton) then raise exception 'Cadastro indisponível';end if;
 if new.raw_user_meta_data->>'terms_version' is distinct from '2026-09-06' or new.raw_user_meta_data->>'privacy_version' is distinct from '2026-09-06' then raise exception 'Consentimentos obrigatórios';end if;
 insert into public.consent_records(user_id,document,version) values(new.id,'terms','2026-09-06'),(new.id,'privacy','2026-09-06');
 end if;return new;end;$$;
revoke all on function private.companion_enrollment() from public,anon,authenticated;
create trigger zzz_companion_enrollment after insert on auth.users for each row execute function private.companion_enrollment();
create function private.auth_product_notification() returns trigger language plpgsql security definer set search_path='' as $$declare kind_value text;begin
 if to_jsonb(old)->>'email_confirmed_at' is null and to_jsonb(new)->>'email_confirmed_at' is not null then kind_value:='welcome';
 elsif nullif(to_jsonb(old)->>'encrypted_password','') is not null and to_jsonb(new)->>'encrypted_password' is distinct from to_jsonb(old)->>'encrypted_password' then kind_value:='security';end if;
 if kind_value is not null then insert into public.email_deliveries(user_id,kind) values(new.id,kind_value) on conflict(user_id,kind,period) do nothing;end if;
 return new;end;$$;
revoke all on function private.auth_product_notification() from public,anon,authenticated;
create trigger auth_product_notification after update on auth.users for each row execute function private.auth_product_notification();
commit;
