begin;
-- Individual journeys have no sponsoring clinic. Existing tenant keys are unchanged.
alter table public.pregnancies alter column clinic_id drop not null;
alter table public.private_memories alter column clinic_id drop not null;
alter table public.consent_records alter column clinic_id drop not null;
alter table public.pregnancies add constraint pregnancies_owner_unique unique(id,user_id);
alter table public.private_memories add constraint memories_pregnancy_owner_fk foreign key(pregnancy_id,user_id) references public.pregnancies(id,user_id) on delete cascade;
create unique index personal_active_pregnancy on public.pregnancies(user_id) where clinic_id is null and status='active';
create unique index personal_consent_version on public.consent_records(user_id,document,version) where clinic_id is null;
create function private.owns_journey(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.pregnancies p where p.id=p_id and p.user_id=(select auth.uid()) and (p.clinic_id is null or private.has_role(p.clinic_id,array['patient']::public.member_role[])));
$$;
revoke all on function private.owns_journey(uuid) from public,anon;
grant execute on function private.owns_journey(uuid) to authenticated;
create policy pregnancies_personal on public.pregnancies for select to authenticated using(clinic_id is null and user_id=(select auth.uid()));
drop policy memories_owner on public.private_memories;
create policy memories_owner on public.private_memories for all to authenticated
 using(user_id=(select auth.uid()) and private.owns_journey(pregnancy_id))
 with check(user_id=(select auth.uid()) and private.owns_journey(pregnancy_id) and exists(select 1 from public.pregnancies p where p.id=pregnancy_id and p.user_id=private_memories.user_id and p.clinic_id is not distinct from private_memories.clinic_id));
create or replace function private.owns_storage_path(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.pregnancies p where coalesce(p.clinic_id::text,'personal')=split_part(p_name,'/',1)
 and p.user_id=(select auth.uid()) and p.user_id::text=split_part(p_name,'/',2) and p.id::text=split_part(p_name,'/',3)
 and array_length(string_to_array(p_name,'/'),1)=4 and split_part(p_name,'/',4)<>'' and private.owns_journey(p.id));
$$;

create table public.access_plans (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[a-z0-9_-]{2,40}$'),
 name text not null check(length(name) between 2 and 100), months integer not null check(months in(1,3,6,9,12)),
 price_cents integer check(price_cents>=0), promotional_cents integer check(promotional_cents>=0), promotional_months integer check(promotional_months between 1 and 12),
 trial_days integer not null default 0 check(trial_days between 0 and 90), active boolean not null default false,
 check((promotional_cents is null)=(promotional_months is null))
);
insert into public.access_plans(code,name,months,price_cents,active) values
 ('monthly','Mensal',1,1990,true),('quarterly','3 meses',3,null,false),('semester','6 meses',6,null,false),('nine_months','9 meses',9,null,false),('annual','Anual',12,null,false);
create table public.partner_codes (
 id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
 code text not null unique check(code ~ '^[A-Z0-9]{8,32}$'), label text not null check(length(label) between 1 and 120),
 campaign text check(length(campaign)<=120), starts_at timestamptz not null default now(), expires_at timestamptz,
 max_uses integer check(max_uses>0), uses integer not null default 0 check(uses>=0), active boolean not null default true,
 access_days integer check(access_days between 1 and 730), created_at timestamptz not null default now(),
 check(expires_at is null or expires_at>starts_at)
);
create index partner_codes_clinic_idx on public.partner_codes(clinic_id);
create table public.subscriptions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(user_id) on delete cascade,
 plan_id uuid references public.access_plans(id), sponsor_id uuid references public.clinics(id),
 status text not null check(status in('trial','active','sponsored','past_due','cancelled','expired')),
 starts_at timestamptz not null default now(), ends_at timestamptz, renews_at timestamptz,
 origin text not null check(length(origin) between 1 and 160), provider_reference text,
 check(ends_at is null or ends_at>starts_at), check((status='sponsored')=(sponsor_id is not null))
);
create index subscriptions_plan_idx on public.subscriptions(plan_id);
create index subscriptions_sponsor_idx on public.subscriptions(sponsor_id);
create table public.subscription_events (
 id bigint generated always as identity primary key, subscription_id uuid not null references public.subscriptions(id) on delete cascade,
 user_id uuid not null references public.profiles(user_id) on delete cascade, status text not null,
 actor_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create index subscription_events_subscription_idx on public.subscription_events(subscription_id,created_at);
create index subscription_events_user_idx on public.subscription_events(user_id);
create index subscription_events_actor_idx on public.subscription_events(actor_id);
create table public.partner_redemptions (
 code_id uuid not null references public.partner_codes(id), user_id uuid not null references public.profiles(user_id) on delete cascade,
 clinic_id uuid not null references public.clinics(id), created_at timestamptz not null default now(), primary key(code_id,user_id)
);
create index redemptions_user_idx on public.partner_redemptions(user_id);
create index redemptions_clinic_idx on public.partner_redemptions(clinic_id);

create table public.feature_flags (
 key text primary key check(key in('community','companion','payments','postpartum','radar','referrals','campaigns','book','whatsapp','experimental')),
 enabled boolean not null default false
);
insert into public.feature_flags(key) values('community'),('companion'),('payments'),('postpartum'),('radar'),('referrals'),('campaigns'),('book'),('whatsapp'),('experimental');
create table public.clinic_feature_flags (
 clinic_id uuid not null references public.clinics(id) on delete cascade, key text not null references public.feature_flags(key),
 enabled boolean not null default false, primary key(clinic_id,key)
);
create index clinic_flags_key_idx on public.clinic_feature_flags(key);
create function private.feature_enabled(p_key text,p_clinic uuid default null) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select f.enabled and coalesce((select c.enabled from public.clinic_feature_flags c where c.key=p_key and c.clinic_id=p_clinic),true) from public.feature_flags f where f.key=p_key),false);
$$;
create function public.feature_enabled(p_key text,p_clinic uuid default null) returns boolean language sql stable security invoker set search_path='' as $$select private.feature_enabled(p_key,p_clinic);$$;
revoke all on function private.feature_enabled(text,uuid),public.feature_enabled(text,uuid) from public,anon;
grant execute on function private.feature_enabled(text,uuid),public.feature_enabled(text,uuid) to authenticated;

create table public.clinic_professionals (
 id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
 name text not null check(length(name) between 2 and 160), specialty text not null check(length(specialty) between 2 and 160),
 registration text check(length(registration)<=80), active boolean not null default true
);
create index professionals_clinic_idx on public.clinic_professionals(clinic_id);
create table public.clinic_campaigns (
 id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
 service_id uuid not null references public.clinic_services(id), title text not null check(length(title) between 2 and 160),
 body text not null check(length(body) between 1 and 2000), starts_on date not null, ends_on date not null,
 week_from integer not null check(week_from between 1 and 40), week_to integer not null check(week_to between 1 and 40),
 cta text not null check(cta ~ '^https://[^[:space:]]+$'), priority integer not null default 0 check(priority between 0 and 10), active boolean not null default false,
 check(ends_on>=starts_on),check(week_to>=week_from)
);
alter table public.clinic_services add constraint services_clinic_unique unique(id,clinic_id);
alter table public.clinic_campaigns add constraint campaign_service_tenant foreign key(service_id,clinic_id) references public.clinic_services(id,clinic_id);
create index campaigns_service_idx on public.clinic_campaigns(service_id,clinic_id);
create index campaigns_clinic_idx on public.clinic_campaigns(clinic_id,starts_on,ends_on);

do $$declare t text;begin
 foreach t in array array['access_plans','partner_codes','subscriptions','subscription_events','partner_redemptions','feature_flags','clinic_feature_flags','clinic_professionals','clinic_campaigns'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end$$;
grant select on public.access_plans to anon;
create policy access_plans_read on public.access_plans for select to anon,authenticated using(active or private.is_superadmin());
-- anon needs the public catalogue without access to privileged helper functions.
drop policy access_plans_read on public.access_plans;
create policy access_plans_public on public.access_plans for select to anon using(active);
create policy access_plans_read on public.access_plans for select to authenticated using(active or private.is_superadmin());
create policy access_plans_manage on public.access_plans for all to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
grant insert,update,delete on public.access_plans to authenticated;
create policy codes_manage on public.partner_codes for all to authenticated using(private.is_admin(clinic_id) or private.is_superadmin()) with check(private.is_admin(clinic_id) or private.is_superadmin());
grant insert,delete on public.partner_codes to authenticated;
grant update(label,campaign,starts_at,expires_at,max_uses,active,access_days) on public.partner_codes to authenticated;
create policy subscriptions_read on public.subscriptions for select to authenticated using(user_id=(select auth.uid()) or private.is_superadmin() or private.is_admin(sponsor_id));
create policy events_read on public.subscription_events for select to authenticated using(user_id=(select auth.uid()) or private.is_superadmin());
create policy redemptions_read on public.partner_redemptions for select to authenticated using(user_id=(select auth.uid()) or private.is_admin(clinic_id) or private.is_superadmin());
create policy flags_read on public.feature_flags for select to authenticated using(true);
create policy flags_manage on public.feature_flags for all to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
grant insert,update,delete on public.feature_flags to authenticated;
create policy clinic_flags_read on public.clinic_feature_flags for select to authenticated using(private.is_member(clinic_id) or private.is_superadmin());
create policy clinic_flags_manage on public.clinic_feature_flags for all to authenticated using(private.is_admin(clinic_id) or private.is_superadmin()) with check(private.is_admin(clinic_id) or private.is_superadmin());
grant insert,update,delete on public.clinic_feature_flags to authenticated;
create policy professionals_read on public.clinic_professionals for select to authenticated using(private.is_member(clinic_id) or private.is_superadmin());
create policy professionals_manage on public.clinic_professionals for all to authenticated using(private.is_admin(clinic_id) or private.is_superadmin()) with check(private.is_admin(clinic_id) or private.is_superadmin());
grant insert,update,delete on public.clinic_professionals to authenticated;
create policy campaigns_read on public.clinic_campaigns for select to authenticated using(private.is_staff(clinic_id) or private.is_superadmin() or (private.is_member(clinic_id) and private.feature_enabled('campaigns',clinic_id) and active and current_date between starts_on and ends_on));
create policy campaigns_manage on public.clinic_campaigns for all to authenticated using(private.is_admin(clinic_id) or private.is_superadmin()) with check(private.is_admin(clinic_id) or private.is_superadmin());
grant insert,update,delete on public.clinic_campaigns to authenticated;

create function private.subscription_audit() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.subscription_events(subscription_id,user_id,status,actor_id) values(new.id,new.user_id,new.status,auth.uid());return new;end;$$;
revoke all on function private.subscription_audit() from public,anon,authenticated;
create trigger subscription_audit after insert or update on public.subscriptions for each row execute function private.subscription_audit();

create function private.redeem_partner(p_code text,p_user uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare c public.partner_codes; begin
 select * into c from public.partner_codes where code=upper(trim(p_code)) for update;
 if c.id is null or not c.active or c.starts_at>now() or c.expires_at<=now() or not exists(select 1 from public.clinics where id=c.clinic_id and status='active') then raise exception 'Código indisponível';end if;
 if exists(select 1 from public.partner_redemptions where code_id=c.id and user_id=p_user) then return c.clinic_id;end if;
 if c.max_uses is not null and c.uses>=c.max_uses then raise exception 'Código esgotado';end if;
 if exists(select 1 from public.clinic_memberships where user_id=p_user and clinic_id=c.clinic_id and role<>'patient') then raise exception 'Conta administrativa';end if;
 insert into public.clinic_memberships(clinic_id,user_id,role) values(c.clinic_id,p_user,'patient') on conflict(clinic_id,user_id) do update set active=true;
 insert into public.partner_redemptions(code_id,user_id,clinic_id) values(c.id,p_user,c.clinic_id);
 update public.partner_codes set uses=uses+1 where id=c.id;
 insert into public.subscriptions(user_id,sponsor_id,status,origin,ends_at) values(p_user,c.clinic_id,'sponsored',coalesce(c.campaign,c.label),case when c.access_days is null then null else now()+c.access_days*interval '1 day' end)
 on conflict(user_id) do update set sponsor_id=excluded.sponsor_id,status=excluded.status,origin=excluded.origin,starts_at=now(),ends_at=excluded.ends_at,renews_at=null;
 return c.clinic_id;end;$$;
-- Only the enrollment trigger and explicitly checked wrapper may call this implementation.
revoke all on function private.redeem_partner(text,uuid) from public,anon,authenticated;
create function private.redeem_my_partner(p_code text) returns uuid language plpgsql security definer set search_path='' as $$
begin if auth.uid() is null then raise exception 'Acesso necessário';end if;return private.redeem_partner(p_code,auth.uid());end;$$;
create function public.redeem_partner(p_code text) returns uuid language sql security invoker set search_path='' as $$select private.redeem_my_partner(p_code);$$;
revoke all on function private.redeem_my_partner(text),public.redeem_partner(text) from public,anon;
grant execute on function private.redeem_my_partner(text),public.redeem_partner(text) to authenticated;
create function private.resolve_partner(p_code text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('name',c.name,'slug',c.slug) from public.partner_codes p join public.clinics c on c.id=p.clinic_id
 where p.code=upper(trim(p_code)) and p.active and p.starts_at<=now() and (p.expires_at is null or p.expires_at>now()) and (p.max_uses is null or p.uses<p.max_uses) and c.status='active';
$$;
create function public.resolve_partner(p_code text) returns jsonb language sql stable security invoker set search_path='' as $$select private.resolve_partner(p_code);$$;
revoke all on function private.resolve_partner(text),public.resolve_partner(text) from public;
grant execute on function private.resolve_partner(text),public.resolve_partner(text) to anon,authenticated;

-- Keep the existing registration behavior; add a separate after-trigger for individual access.
create function private.enroll_individual() returns trigger language plpgsql security definer set search_path='' as $$
declare m jsonb:=new.raw_user_meta_data; c uuid; d date; l date; p public.access_plans; begin
 if m->>'entry_mode' not in('direct','partner') or m->>'entry_mode' is null then return new;end if;
 if nullif(m->>'clinic_slug','') is not null then raise exception 'Entrada incompatível';end if;
 if not (select enabled from private.registration_settings where singleton) then raise exception 'Cadastros ainda não liberados';end if;
 if m->>'terms_version' is distinct from '2026-09-06' or m->>'privacy_version' is distinct from '2026-09-06' or m->>'sensitive_consent' is distinct from 'true' then raise exception 'Consentimentos obrigatórios';end if;
 if (nullif(m->>'due_date','') is null)=(nullif(m->>'last_menstrual_period','') is null) then raise exception 'Informe DPP ou DUM';end if;
 l:=nullif(m->>'last_menstrual_period','')::date;d:=coalesce(nullif(m->>'due_date','')::date,l+280);
 if d<current_date-42 or d>current_date+294 or l>current_date then raise exception 'Data inválida';end if;
 if m->>'entry_mode'='partner' then c:=private.redeem_partner(m->>'partner_code',new.id);
 else
 select * into p from public.access_plans where code=m->>'plan_code' and active;
 if p.id is null then raise exception 'Plano indisponível';end if;
 insert into public.subscriptions(user_id,plan_id,status,origin,ends_at) values(new.id,p.id,case when p.trial_days>0 then 'trial' else 'past_due' end,'direct',case when p.trial_days>0 then now()+p.trial_days*interval '1 day' else null end);
 end if;
 insert into public.pregnancies(clinic_id,user_id,display_name,due_date,last_menstrual_period) values(c,new.id,m->>'full_name',d,l);
 insert into public.consent_records(clinic_id,user_id,document,version) values(c,new.id,'terms','2026-09-06'),(c,new.id,'privacy','2026-09-06'),(c,new.id,'sensitive_data','2026-09-06');
 return new;end;$$;
revoke all on function private.enroll_individual() from public,anon,authenticated;
-- Alphabetically after on_auth_user_created, so the existing profile already exists.
create trigger zz_enroll_individual after insert on auth.users for each row execute function private.enroll_individual();

create function private.create_clinic(p_name text,p_slug text,p_tokens jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare c uuid;begin
 if not private.is_superadmin() then raise exception 'Acesso negado' using errcode='42501';end if;
 insert into public.clinics(name,slug,status) values(p_name,p_slug,'pending') returning id into c;
 insert into public.clinic_themes(clinic_id,tokens) values(c,p_tokens);
 return c;end;$$;
create function public.create_clinic(p_name text,p_slug text,p_tokens jsonb) returns uuid language sql security invoker set search_path='' as $$select private.create_clinic(p_name,p_slug,p_tokens);$$;
revoke all on function private.create_clinic(text,text,jsonb),public.create_clinic(text,text,jsonb) from public,anon;
grant execute on function private.create_clinic(text,text,jsonb),public.create_clinic(text,text,jsonb) to authenticated;

create function private.set_access(p_user uuid,p_status text,p_plan uuid,p_sponsor uuid,p_end timestamptz) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.is_superadmin() then raise exception 'Acesso negado' using errcode='42501';end if;
 if p_status='sponsored' and not exists(select 1 from public.clinic_memberships where user_id=p_user and clinic_id=p_sponsor and active and role='patient') then raise exception 'Vínculo necessário';end if;
 insert into public.subscriptions(user_id,status,plan_id,sponsor_id,ends_at,origin) values(p_user,p_status,p_plan,p_sponsor,p_end,'manual_admin')
 on conflict(user_id) do update set status=excluded.status,plan_id=excluded.plan_id,sponsor_id=excluded.sponsor_id,ends_at=excluded.ends_at,origin=excluded.origin,starts_at=now();end;$$;
create function public.set_access(p_user uuid,p_status text,p_plan uuid default null,p_sponsor uuid default null,p_end timestamptz default null) returns void language sql security invoker set search_path='' as $$select private.set_access(p_user,p_status,p_plan,p_sponsor,p_end);$$;
revoke all on function private.set_access(uuid,text,uuid,uuid,timestamptz),public.set_access(uuid,text,uuid,uuid,timestamptz) from public,anon;
grant execute on function private.set_access(uuid,text,uuid,uuid,timestamptz),public.set_access(uuid,text,uuid,uuid,timestamptz) to authenticated;

create function private.platform_metrics() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not private.is_superadmin() then raise exception 'Acesso negado' using errcode='42501';end if;
 return jsonb_build_object('users',(select count(*) from public.profiles),'pregnancies',(select count(*) from public.pregnancies),'clinics',(select count(*) from public.clinics),'active_clinics',(select count(*) from public.clinics where status='active'),'subscriptions',(select count(*) from public.subscriptions),'sponsored',(select count(*) from public.subscriptions where status='sponsored' and (ends_at is null or ends_at>now())));end;$$;
create function public.platform_metrics() returns jsonb language sql stable security invoker set search_path='' as $$select private.platform_metrics();$$;
revoke all on function private.platform_metrics(),public.platform_metrics() from public,anon;
grant execute on function private.platform_metrics(),public.platform_metrics() to authenticated;

create function private.personal_access() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.subscriptions s where s.user_id=(select auth.uid()) and s.status in('active','trial','sponsored') and (s.ends_at is null or s.ends_at>now()) and (s.sponsor_id is null or exists(select 1 from public.clinics c where c.id=s.sponsor_id and c.status='active')));
$$;
revoke all on function private.personal_access() from public,anon;
grant execute on function private.personal_access() to authenticated;
-- Read, download and deletion remain possible for the owner after expiry.
create policy memories_access on public.private_memories as restrictive for insert to authenticated with check(clinic_id is not null or private.personal_access());
create policy memories_edit_access on public.private_memories as restrictive for update to authenticated using(true) with check(clinic_id is not null or private.personal_access());
create function private.clinic_roster(p_clinic uuid) returns table(id uuid,display_name text,due_date date,status public.journey_status,created_at timestamptz) language plpgsql stable security definer set search_path='' as $$begin
 if not private.is_staff(p_clinic) then raise exception 'Acesso negado' using errcode='42501';end if;
 return query select p.id,p.display_name,p.due_date,p.status,p.created_at from public.pregnancies p where p.clinic_id=p_clinic or (p.clinic_id is null and exists(select 1 from public.subscriptions s where s.user_id=p.user_id and s.sponsor_id=p_clinic and s.status='sponsored' and (s.ends_at is null or s.ends_at>now())));end;$$;
create function public.clinic_roster(p_clinic uuid) returns table(id uuid,display_name text,due_date date,status public.journey_status,created_at timestamptz) language sql stable security invoker set search_path='' as $$select * from private.clinic_roster(p_clinic);$$;
revoke all on function private.clinic_roster(uuid),public.clinic_roster(uuid) from public,anon;
grant execute on function private.clinic_roster(uuid),public.clinic_roster(uuid) to authenticated;
commit;
