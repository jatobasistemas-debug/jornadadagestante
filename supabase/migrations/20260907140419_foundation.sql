-- Etapa 1: PostgreSQL + Supabase Auth. No clinical content or later-stage workflows.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.clinic_status as enum ('active','suspended','pending');
create type public.member_role as enum ('patient','clinic_admin','clinic_staff');
create type public.journey_status as enum ('active','paused','completed','closed');

create table public.plans (
 id uuid primary key default gen_random_uuid(), name text not null,
 setup_cents integer not null default 249700 check(setup_cents>=0),
 monthly_cents integer not null default 6200 check(monthly_cents>=0)
);
create table public.clinics (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
 name text not null check(length(name) between 2 and 160),
 status public.clinic_status not null default 'pending',
 cnpj text, plan_id uuid references public.plans(id),
 monthly_cents integer not null default 6200 check(monthly_cents>=0),
 renewal_date date, payment_status text not null default 'pending' check(payment_status in ('paid','pending','suspended')),
 created_at timestamptz not null default now()
);
create table public.clinic_domains (
 hostname text primary key check(hostname = lower(hostname) and hostname !~ '[/ :]' and length(hostname)<=253),
 clinic_id uuid not null references public.clinics(id) on delete cascade,
 verified_at timestamptz -- future routing only; never trust an unverified forwarded host
);
create function private.valid_theme(t jsonb) returns boolean language sql immutable set search_path='' as $$
 select jsonb_typeof(t)='object'
 and t ?& array['primary','primarySoft','secondary','accent','background','surface','text','muted','border','onPrimary','danger','focus']
 and (select count(*)=12 and bool_and(key=any(array['primary','primarySoft','secondary','accent','background','surface','text','muted','border','onPrimary','danger','focus']) and jsonb_typeof(value)='string' and (value#>>'{}') ~ '^#[0-9a-fA-F]{6}$') from jsonb_each(t));
$$;
create table public.clinic_themes (
 clinic_id uuid primary key references public.clinics(id) on delete cascade,
 logo_url text check(logo_url is null or logo_url ~ '^https://[^[:space:]]+$'),
 tokens jsonb not null check(private.valid_theme(tokens)),
 phone text, whatsapp text, address text, instagram text, website text, city text, slogan text,
 updated_at timestamptz not null default now()
);
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(length(full_name) between 1 and 160),
 preferred_name text, created_at timestamptz not null default now()
);
create table public.superadmins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.clinic_memberships (
 clinic_id uuid not null references public.clinics(id) on delete cascade,
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 role public.member_role not null, active boolean not null default true,
 primary key(clinic_id,user_id), created_at timestamptz not null default now()
);
create index memberships_user_idx on public.clinic_memberships(user_id,clinic_id) where active;
create table public.pregnancies (
 id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id),
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 display_name text not null, due_date date not null,
 last_menstrual_period date,
 status public.journey_status not null default 'active',
 created_at timestamptz not null default now(),
 unique(id,clinic_id,user_id),
 foreign key(clinic_id,user_id) references public.clinic_memberships(clinic_id,user_id)
);
create unique index one_active_pregnancy on public.pregnancies(clinic_id,user_id) where status='active';
create index pregnancies_clinic_idx on public.pregnancies(clinic_id,status);
-- Privacy boundary for future stages; no memories UI/API is introduced in Etapa 1.
create table public.private_memories (
 id uuid primary key default gen_random_uuid(), clinic_id uuid not null,
 user_id uuid not null, pregnancy_id uuid not null,
 category text not null check(category in ('photo','diary','ultrasound','letter','moment')),
 body text, storage_path text, created_at timestamptz not null default now(),
 foreign key(pregnancy_id,clinic_id,user_id) references public.pregnancies(id,clinic_id,user_id) on delete cascade
);
create index memories_owner_idx on public.private_memories(user_id,clinic_id);
create table public.consent_records (
 id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id),
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 document text not null check(document in ('terms','privacy','sensitive_data')),
 version text not null, accepted_at timestamptz not null default now(),
 unique(user_id,clinic_id,document,version),
 foreign key(clinic_id,user_id) references public.clinic_memberships(clinic_id,user_id)
);
create table public.modules (
 key text primary key, name text not null
);
create table public.clinic_modules (
 clinic_id uuid not null references public.clinics(id) on delete cascade,
 module_key text not null references public.modules(key), enabled boolean not null default false,
 primary key(clinic_id,module_key)
);
create table public.clinic_services (
 id uuid primary key default gen_random_uuid(), clinic_id uuid not null references public.clinics(id) on delete cascade,
 name text not null, booking_url text check(booking_url is null or booking_url ~ '^(https://|tel:)[^[:space:]]+$'),
 active boolean not null default true, unique(clinic_id,name)
);
create table public.audit_logs (
 id bigint generated always as identity primary key,
 clinic_id uuid references public.clinics(id) on delete set null,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null, entity text not null, entity_id text,
 created_at timestamptz not null default now()
);
create index audit_clinic_idx on public.audit_logs(clinic_id,created_at desc);

create function private.is_superadmin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.superadmins where user_id=(select auth.uid()));
$$;
create function private.has_role(c uuid, roles public.member_role[]) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.clinic_memberships m join public.clinics t on t.id=m.clinic_id
 where m.clinic_id=c and m.user_id=(select auth.uid()) and m.active and t.status='active' and m.role=any(roles));
$$;
create function private.is_member(c uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.has_role(c,array['patient','clinic_admin','clinic_staff']::public.member_role[]);
$$;
create function private.is_staff(c uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.has_role(c,array['clinic_admin','clinic_staff']::public.member_role[]);
$$;
create function private.is_admin(c uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.has_role(c,array['clinic_admin']::public.member_role[]);
$$;

alter table public.plans enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_domains enable row level security;
alter table public.clinic_themes enable row level security;
alter table public.profiles enable row level security;
alter table public.superadmins enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.pregnancies enable row level security;
alter table public.private_memories enable row level security;
alter table public.consent_records enable row level security;
alter table public.modules enable row level security;
alter table public.clinic_modules enable row level security;
alter table public.clinic_services enable row level security;
alter table public.audit_logs enable row level security;

create policy plans_super on public.plans for all to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
create policy clinics_read on public.clinics for select to authenticated using(private.is_staff(id) or private.is_superadmin());
create policy clinics_super on public.clinics for all to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
create policy domains_super on public.clinic_domains for all to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
create policy themes_read on public.clinic_themes for select to authenticated using(private.is_member(clinic_id) or private.is_superadmin());
create policy themes_update on public.clinic_themes for update to authenticated using(private.is_admin(clinic_id) or private.is_superadmin()) with check(private.is_admin(clinic_id) or private.is_superadmin());
create policy themes_create on public.clinic_themes for insert to authenticated with check(private.is_superadmin());
create policy profiles_self on public.profiles for select to authenticated using(user_id=(select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy super_self on public.superadmins for select to authenticated using(user_id=(select auth.uid()));
create policy memberships_read on public.clinic_memberships for select to authenticated using((user_id=(select auth.uid()) and private.is_member(clinic_id)) or private.is_staff(clinic_id) or private.is_superadmin());
-- Membership mutations only through the validated RPC/service bootstrap, never raw client updates.
create policy pregnancies_read on public.pregnancies for select to authenticated using(private.is_staff(clinic_id) or (user_id=(select auth.uid()) and private.has_role(clinic_id,array['patient']::public.member_role[])));
create policy memories_owner on public.private_memories for all to authenticated using(user_id=(select auth.uid()) and private.has_role(clinic_id,array['patient']::public.member_role[])) with check(user_id=(select auth.uid()) and private.has_role(clinic_id,array['patient']::public.member_role[]));
create policy consent_self on public.consent_records for select to authenticated using(user_id=(select auth.uid()));
create policy modules_read on public.modules for select to authenticated using(true);
create policy modules_super on public.modules for all to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
create policy clinic_modules_read on public.clinic_modules for select to authenticated using(private.is_staff(clinic_id) or private.is_superadmin());
create policy clinic_modules_super on public.clinic_modules for all to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
create policy services_read on public.clinic_services for select to authenticated using(private.is_member(clinic_id) or private.is_superadmin());
create policy services_admin on public.clinic_services for all to authenticated using(private.is_admin(clinic_id) or private.is_superadmin()) with check(private.is_admin(clinic_id) or private.is_superadmin());
create policy audit_read on public.audit_logs for select to authenticated using(private.is_admin(clinic_id) or private.is_superadmin());

grant usage on schema public to anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;
grant insert,update,delete on public.plans,public.clinics,public.clinic_domains,public.modules,public.clinic_modules,public.clinic_services,public.private_memories to authenticated;
grant insert on public.clinic_themes to authenticated;
grant update(tokens,logo_url,phone,whatsapp,address,instagram,website,city,slogan) on public.clinic_themes to authenticated;
grant update(full_name,preferred_name) on public.profiles to authenticated;

-- Public branding is a bounded, sanitized projection, not access to tenant/billing tables.
create function public.get_public_clinic(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',c.id,'slug',c.slug,'name',c.name,'logo_url',t.logo_url,'tokens',t.tokens,'phone',t.phone,'whatsapp',t.whatsapp,'address',t.address,'instagram',t.instagram,'website',t.website,'city',t.city,'slogan',t.slogan)
 from public.clinics c join public.clinic_themes t on t.clinic_id=c.id
 where c.slug=p_slug and c.status='active';
$$;

create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare row_data jsonb; cid uuid;
begin
 row_data := case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 cid := case when TG_TABLE_NAME='clinics' then (row_data->>'id')::uuid else (row_data->>'clinic_id')::uuid end;
 if TG_TABLE_NAME='clinics' and TG_OP='DELETE' then cid:=null; end if;
 insert into public.audit_logs(clinic_id,actor_id,action,entity,entity_id) values(cid,auth.uid(),TG_OP,TG_TABLE_NAME,coalesce(row_data->>'id',row_data->>'user_id',row_data->>'clinic_id'));
 if TG_OP='DELETE' then return old; end if;
 return new;
end; $$;
create trigger audit_clinics after insert or update or delete on public.clinics for each row execute function private.audit_change();
create trigger audit_themes after insert or update on public.clinic_themes for each row execute function private.audit_change();
create trigger audit_memberships after insert or update or delete on public.clinic_memberships for each row execute function private.audit_change();
create trigger audit_modules after insert or update or delete on public.clinic_modules for each row execute function private.audit_change();
create function private.touch_theme() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
create trigger touch_theme before update on public.clinic_themes for each row execute function private.touch_theme();

-- Metadata never determines privileged roles. Atomic registration fixes role=patient.
create function private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare m jsonb:=new.raw_user_meta_data; c uuid; d date; l date;
begin
 insert into public.profiles(user_id,full_name) values(new.id,coalesce(nullif(left(trim(m->>'full_name'),160),''),'Usuária'));
 if nullif(m->>'clinic_slug','') is not null then
  select id into c from public.clinics where slug=m->>'clinic_slug' and status='active';
  if c is null then raise exception 'Clínica indisponível'; end if;
  if m->>'terms_version' is distinct from '2026-09-06' or m->>'privacy_version' is distinct from '2026-09-06' or m->>'sensitive_consent' is distinct from 'true' then raise exception 'Consentimentos obrigatórios'; end if;
  if (nullif(m->>'due_date','') is null) = (nullif(m->>'last_menstrual_period','') is null) then raise exception 'Informe DPP ou DUM'; end if;
  l:=nullif(m->>'last_menstrual_period','')::date;
  d:=coalesce(nullif(m->>'due_date','')::date,l+280);
  if d<current_date-42 or d>current_date+294 or (l is not null and l>current_date) then raise exception 'Data inválida'; end if;
  insert into public.clinic_memberships(clinic_id,user_id,role) values(c,new.id,'patient');
  insert into public.pregnancies(clinic_id,user_id,display_name,due_date,last_menstrual_period) values(c,new.id,m->>'full_name',d,l);
  insert into public.consent_records(clinic_id,user_id,document,version) values(c,new.id,'terms','2026-09-06'),(c,new.id,'privacy','2026-09-06'),(c,new.id,'sensitive_data','2026-09-06');
 end if;
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create function public.set_staff_membership(p_clinic_id uuid,p_user_id uuid,p_role public.member_role,p_active boolean default true) returns void language plpgsql security definer set search_path='' as $$
begin
 if not (private.is_superadmin() or private.is_admin(p_clinic_id)) then raise exception 'Acesso negado' using errcode='42501'; end if;
 if p_user_id=auth.uid() then raise exception 'Não altere seu próprio papel'; end if;
 if p_role not in ('clinic_admin','clinic_staff') then raise exception 'Papel inválido'; end if;
 if exists(select 1 from public.clinic_memberships where clinic_id=p_clinic_id and user_id=p_user_id and role='patient') then raise exception 'Vínculo de gestante não pode ser convertido'; end if;
 insert into public.clinic_memberships(clinic_id,user_id,role,active) values(p_clinic_id,p_user_id,p_role,p_active)
 on conflict(clinic_id,user_id) do update set role=excluded.role,active=excluded.active;
end; $$;

revoke execute on all functions in schema public from public,anon,authenticated;
revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function public.get_public_clinic(text) to anon,authenticated;
grant execute on function public.set_staff_membership(uuid,uuid,public.member_role,boolean) to authenticated;
grant execute on function private.is_superadmin(),private.has_role(uuid,public.member_role[]),private.is_member(uuid),private.is_staff(uuid),private.is_admin(uuid),private.valid_theme(jsonb) to authenticated;
-- Supabase service role only for trusted scripts, never used for normal web requests.
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;
commit;

