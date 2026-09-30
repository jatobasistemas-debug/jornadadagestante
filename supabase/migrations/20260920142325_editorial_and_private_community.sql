begin;
create table public.editorial_content (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in('week','postpartum','radar','companion')),
 week integer check(week between 1 and 40), day integer check(day between 0 and 90),
 title text not null check(length(title) between 1 and 180), phrase text not null default '' check(length(phrase)<=500),
 baby text not null default '' check(length(baby)<=10000), mother text not null default '' check(length(mother)<=10000),
 curiosity text not null default '' check(length(curiosity)<=4000), care text not null default '' check(length(care)<=4000),
 alert text not null default '' check(length(alert)<=4000), question text not null default '' check(length(question)<=1000),
 body text not null default '' check(length(body)<=30000), source_name text not null default '', source_url text check(source_url ~ '^https://[^[:space:]]+$'),
 tags text[] not null default '{}', related_services text[] not null default '{}',
 image_url text check(image_url ~ '^https://[^[:space:]]+$'), image_caption text not null default '',
 status text not null default 'draft' check(status in('draft','published','archived')), review_status text not null default 'pending' check(review_status in('pending','approved')),
 reviewer text, reviewed_at timestamptz, published_at timestamptz, updated_at timestamptz not null default now(),
 check(kind<>'week' or week is not null),check(kind<>'postpartum' or day is not null),
 check(status<>'published' or (review_status='approved' and reviewer is not null and length(trim(reviewer))>1 and reviewed_at is not null and source_url is not null))
);
create unique index editorial_week on public.editorial_content(week) where kind='week';
create unique index editorial_postpartum on public.editorial_content(day) where kind='postpartum';
create index editorial_publication on public.editorial_content(kind,status,published_at desc);
create index editorial_search on public.editorial_content using gin(to_tsvector('portuguese',title||' '||body||' '||baby||' '||mother));
insert into public.editorial_content(kind,week,title) select 'week',n,'Semana '||n from generate_series(1,40)n;
insert into public.editorial_content(kind,day,title) select 'postpartum',n,'Pós-parto · dia '||n from generate_series(0,90)n;
alter table public.editorial_content enable row level security;
revoke all on public.editorial_content from anon,authenticated;
grant select,insert,update,delete on public.editorial_content to authenticated;
grant all on public.editorial_content to service_role;
create policy editorial_read on public.editorial_content for select to authenticated using(private.is_superadmin() or (status='published' and review_status='approved' and (kind<>'radar' or private.feature_enabled('radar'))));
create policy editorial_manage on public.editorial_content for all to authenticated using(private.is_superadmin()) with check(private.is_superadmin());

create table public.community_categories(id uuid primary key default gen_random_uuid(),name text not null unique check(length(name) between 2 and 80),active boolean not null default true);
insert into public.community_categories(name) values('Conversas e acolhimento'),('Dúvidas para levar ao pré-natal'),('Pequenas descobertas');
create table public.community_bans(user_id uuid primary key references public.profiles(user_id) on delete cascade,reason text not null check(length(reason) between 1 and 1000),until_at timestamptz,created_at timestamptz not null default now());
create table public.community_posts (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(user_id) on delete cascade,
 category_id uuid not null references public.community_categories(id),alias text not null check(length(alias) between 2 and 60),
 title text not null check(length(title) between 2 and 160),body text not null check(length(body) between 1 and 5000),
 status text not null default 'published' check(status in('published','hidden','removed')),created_at timestamptz not null default now()
);
create index community_posts_user on public.community_posts(user_id,created_at desc);
create index community_posts_category on public.community_posts(category_id,created_at desc);
create index community_posts_feed on public.community_posts(status,created_at desc);
create index community_posts_search on public.community_posts using gin(to_tsvector('portuguese',title||' '||body));
create table public.community_comments(id uuid primary key default gen_random_uuid(),post_id uuid not null references public.community_posts(id) on delete cascade,user_id uuid not null references public.profiles(user_id) on delete cascade,alias text not null check(length(alias) between 2 and 60),body text not null check(length(body) between 1 and 2000),status text not null default 'published' check(status in('published','hidden','removed')),created_at timestamptz not null default now());
create index community_comments_post on public.community_comments(post_id,created_at);
create index community_comments_user on public.community_comments(user_id,created_at);
create table public.community_reactions(post_id uuid not null references public.community_posts(id) on delete cascade,user_id uuid not null references public.profiles(user_id) on delete cascade,primary key(post_id,user_id));
create index community_reactions_user on public.community_reactions(user_id);
create table public.community_reports(id uuid primary key default gen_random_uuid(),post_id uuid references public.community_posts(id) on delete cascade,comment_id uuid references public.community_comments(id) on delete cascade,user_id uuid not null references public.profiles(user_id) on delete cascade,reason text not null check(reason in('medical_risk','spam','harassment','privacy','other')),detail text not null default '' check(length(detail)<=1000),status text not null default 'pending' check(status in('pending','resolved')),created_at timestamptz not null default now(),check((post_id is null)<>(comment_id is null)));
create index community_reports_post on public.community_reports(post_id);
create index community_reports_comment on public.community_reports(comment_id);
create index community_reports_user on public.community_reports(user_id,created_at);
create table public.moderation_logs(id bigint generated always as identity primary key,actor_id uuid references auth.users(id) on delete set null,entity text not null,entity_id uuid not null,action text not null,reason text not null,created_at timestamptz not null default now());
create index moderation_actor on public.moderation_logs(actor_id);
create function private.community_access() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and not exists(select 1 from public.community_bans where user_id=auth.uid() and (until_at is null or until_at>now()))
 and exists(select 1 from public.pregnancies p where p.user_id=auth.uid() and private.owns_journey(p.id) and private.feature_enabled('community',p.clinic_id));
$$;
create function public.community_access() returns boolean language sql stable security invoker set search_path='' as $$select private.community_access();$$;
revoke all on function private.community_access(),public.community_access() from public,anon;
grant execute on function private.community_access(),public.community_access() to authenticated;
do $$declare t text;begin foreach t in array array['community_categories','community_bans','community_posts','community_comments','community_reactions','community_reports','moderation_logs'] loop
 execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);execute format('grant all on public.%I to service_role',t);end loop;end$$;
create policy categories_read on public.community_categories for select to authenticated using(private.community_access() or private.is_superadmin());
create policy categories_manage on public.community_categories for all to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
grant insert,update,delete on public.community_categories to authenticated;
create policy bans_read on public.community_bans for select to authenticated using(user_id=(select auth.uid()) or private.is_superadmin());
create policy posts_read on public.community_posts for select to authenticated using(private.is_superadmin() or (private.community_access() and (status='published' or user_id=(select auth.uid()))));
create policy posts_insert on public.community_posts for insert to authenticated with check(private.community_access() and user_id=(select auth.uid()) and status='published' and exists(select 1 from public.community_categories where id=category_id and active));
create policy posts_update on public.community_posts for update to authenticated using(private.community_access() and user_id=(select auth.uid()) and status='published') with check(private.community_access() and user_id=(select auth.uid()) and status='published');
create policy posts_delete on public.community_posts for delete to authenticated using(user_id=(select auth.uid()));
grant insert,delete on public.community_posts to authenticated;grant update(title,body,category_id) on public.community_posts to authenticated;
create policy comments_read on public.community_comments for select to authenticated using(private.is_superadmin() or (private.community_access() and (status='published' or user_id=(select auth.uid())) and exists(select 1 from public.community_posts where id=post_id and status='published')));
create policy comments_insert on public.community_comments for insert to authenticated with check(private.community_access() and user_id=(select auth.uid()) and status='published' and exists(select 1 from public.community_posts where id=post_id and status='published'));
create policy comments_update on public.community_comments for update to authenticated using(private.community_access() and user_id=(select auth.uid()) and status='published') with check(private.community_access() and user_id=(select auth.uid()) and status='published');
create policy comments_delete on public.community_comments for delete to authenticated using(user_id=(select auth.uid()));
grant insert,delete on public.community_comments to authenticated;grant update(body) on public.community_comments to authenticated;
create policy reactions_own on public.community_reactions for all to authenticated using(private.community_access() and user_id=(select auth.uid())) with check(private.community_access() and user_id=(select auth.uid()) and exists(select 1 from public.community_posts where id=post_id and status='published'));
grant insert,delete on public.community_reactions to authenticated;
create policy reports_read on public.community_reports for select to authenticated using(user_id=(select auth.uid()) or private.is_superadmin());
create policy reports_insert on public.community_reports for insert to authenticated with check(private.community_access() and user_id=(select auth.uid()) and status='pending' and ((post_id is not null and exists(select 1 from public.community_posts where id=post_id)) or (comment_id is not null and exists(select 1 from public.community_comments where id=comment_id))));
grant insert on public.community_reports to authenticated;
create policy moderation_read on public.moderation_logs for select to authenticated using(private.is_superadmin());

create function private.community_rate_limit() returns trigger language plpgsql security definer set search_path='' as $$declare n integer;begin
 perform 1 from public.profiles where user_id=new.user_id for update;
 execute format('select count(*) from public.%I where user_id=$1 and created_at>now()-interval ''1 hour''',TG_TABLE_NAME) into n using new.user_id;
 if n>=(case when TG_TABLE_NAME='community_posts' then 10 else 30 end) then raise exception 'Aguarde antes de publicar novamente';end if;
 new.created_at:=now();return new;end;$$;
revoke all on function private.community_rate_limit() from public,anon,authenticated;
create trigger community_posts_limit before insert on public.community_posts for each row execute function private.community_rate_limit();
create trigger community_comments_limit before insert on public.community_comments for each row execute function private.community_rate_limit();
create trigger community_reports_limit before insert on public.community_reports for each row execute function private.community_rate_limit();
create function private.moderate(p_entity text,p_id uuid,p_action text,p_reason text) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.is_superadmin() or length(trim(p_reason)) not between 2 and 1000 then raise exception 'Acesso negado';end if;
 if p_entity in('community_posts','community_comments') and p_action in('hidden','removed','published') then execute format('update public.%I set status=$1 where id=$2',p_entity) using p_action,p_id;
 elsif p_entity='community_reports' and p_action='resolved' then update public.community_reports set status='resolved' where id=p_id;
 elsif p_entity='community_bans' and p_action='block' then insert into public.community_bans(user_id,reason) values(p_id,p_reason) on conflict(user_id) do update set reason=excluded.reason,until_at=null;
 elsif p_entity='community_bans' and p_action='restore' then delete from public.community_bans where user_id=p_id;
 else raise exception 'Ação inválida';end if;
 insert into public.moderation_logs(actor_id,entity,entity_id,action,reason) values(auth.uid(),p_entity,p_id,p_action,p_reason);end;$$;
create function public.moderate(p_entity text,p_id uuid,p_action text,p_reason text) returns void language sql security invoker set search_path='' as $$select private.moderate(p_entity,p_id,p_action,p_reason);$$;
revoke all on function private.moderate(text,uuid,text,text),public.moderate(text,uuid,text,text) from public,anon;
grant execute on function private.moderate(text,uuid,text,text),public.moderate(text,uuid,text,text) to authenticated;
create index memories_text_search on public.private_memories using gin(to_tsvector('portuguese',coalesce(body,'')));
create function public.search_journey(p_query text,p_kind text default null,p_from date default null,p_to date default null,p_clinic uuid default null,p_scoped boolean default false)
returns table(id uuid,kind text,title text,excerpt text,occurred_on date,week integer) language sql stable security invoker set search_path='' as $$
 select m.id,m.category,m.category,left(coalesce(m.body,''),240),m.occurred_on,m.gestational_week::integer
 from public.private_memories m where m.user_id=(select auth.uid()) and length(trim(p_query)) between 2 and 100
 and (not p_scoped or m.clinic_id is not distinct from p_clinic)
 and to_tsvector('portuguese',coalesce(m.body,'')) @@ websearch_to_tsquery('portuguese',p_query)
 and (p_kind is null or m.category=p_kind) and (p_from is null or m.occurred_on>=p_from) and (p_to is null or m.occurred_on<=p_to)
 union all
 select e.id,e.kind,e.title,left(e.phrase||' '||e.body||' '||e.baby,240),e.published_at::date,e.week
 from public.editorial_content e where (e.kind<>'radar' or private.feature_enabled('radar',p_clinic)) and (e.kind<>'postpartum' or private.feature_enabled('postpartum',p_clinic)) and e.status='published' and e.review_status='approved' and length(trim(p_query)) between 2 and 100
 and to_tsvector('portuguese',e.title||' '||e.body||' '||e.baby||' '||e.mother) @@ websearch_to_tsquery('portuguese',p_query)
 and (p_kind is null or e.kind=p_kind) and (p_from is null or e.published_at::date>=p_from) and (p_to is null or e.published_at::date<=p_to)
 order by occurred_on desc nulls last limit 100;
$$;
revoke all on function public.search_journey(text,text,date,date,uuid,boolean) from public,anon;
grant execute on function public.search_journey(text,text,date,date,uuid,boolean) to authenticated;
commit;
