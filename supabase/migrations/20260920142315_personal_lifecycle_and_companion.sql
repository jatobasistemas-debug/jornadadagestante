begin;
create table public.time_capsules (
 memory_id uuid primary key references public.private_memories(id) on delete cascade,
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 recipient text check(length(recipient)<=160), opens_on date, created_at timestamptz not null default now()
);
create index capsules_user_idx on public.time_capsules(user_id);
create table public.birth_records (
 pregnancy_id uuid primary key, user_id uuid not null references public.profiles(user_id) on delete cascade,
 born_at timestamptz not null check(born_at<=now()), name text check(length(name)<=160), sex text check(sex in('female','male','not_informed')),
 weight_grams integer check(weight_grams between 100 and 10000), length_cm numeric(5,2) check(length_cm between 10 and 100),
 note text check(length(note)<=2000), photo_memory_id uuid references public.private_memories(id) on delete set null,
 foreign key(pregnancy_id,user_id) references public.pregnancies(id,user_id) on delete cascade
);
create index birth_user_idx on public.birth_records(user_id);
create index birth_photo_idx on public.birth_records(photo_memory_id);
create table public.companion_invites (
 id uuid primary key default gen_random_uuid(), pregnancy_id uuid not null, user_id uuid not null references public.profiles(user_id) on delete cascade,
 email text not null check(length(email)<=254 and email=lower(email)), token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz not null default now()+interval '7 days', status text not null default 'pending' check(status in('pending','accepted','revoked')),
 companion_id uuid references public.profiles(user_id) on delete cascade, created_at timestamptz not null default now(),
 foreign key(pregnancy_id,user_id) references public.pregnancies(id,user_id) on delete cascade,
 check(companion_id is null or companion_id<>user_id),check((status='accepted')=(companion_id is not null) or status='revoked')
);
create unique index one_live_companion on public.companion_invites(pregnancy_id) where status in('pending','accepted');
create index companion_owner_idx on public.companion_invites(user_id);
create index companion_member_idx on public.companion_invites(companion_id);
create table public.memory_shares (
 memory_id uuid primary key references public.private_memories(id) on delete cascade,
 invitation_id uuid not null references public.companion_invites(id) on delete cascade,
 user_id uuid not null references public.profiles(user_id) on delete cascade, created_at timestamptz not null default now()
);
create index shares_invitation_idx on public.memory_shares(invitation_id);
create index shares_user_idx on public.memory_shares(user_id);
create table public.journey_books (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(user_id) on delete cascade,
 title text not null check(length(title) between 1 and 160), created_at timestamptz not null default now()
);
create index books_user_idx on public.journey_books(user_id);
create table public.journey_book_items (
 book_id uuid not null references public.journey_books(id) on delete cascade, memory_id uuid not null references public.private_memories(id) on delete cascade,
 position integer not null check(position between 1 and 500), primary key(book_id,memory_id), unique(book_id,position)
);
create index book_items_memory_idx on public.journey_book_items(memory_id);

do $$declare t text;begin foreach t in array array['time_capsules','birth_records','companion_invites','memory_shares','journey_books','journey_book_items'] loop
 execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select,insert,delete on public.%I to authenticated',t);execute format('grant all on public.%I to service_role',t);end loop;end$$;
grant update(recipient,opens_on) on public.time_capsules to authenticated;
grant update(born_at,name,sex,weight_grams,length_cm,note,photo_memory_id) on public.birth_records to authenticated;
grant update(status) on public.companion_invites to authenticated;
grant update(invitation_id) on public.memory_shares to authenticated;
grant update(title) on public.journey_books to authenticated;
grant update(position) on public.journey_book_items to authenticated;
create policy capsules_owner on public.time_capsules for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.private_memories where id=memory_id and user_id=(select auth.uid())));
create policy birth_owner on public.birth_records for all to authenticated using(user_id=(select auth.uid()) and private.owns_journey(pregnancy_id)) with check(user_id=(select auth.uid()) and private.owns_journey(pregnancy_id) and (photo_memory_id is null or exists(select 1 from public.private_memories where id=photo_memory_id and user_id=(select auth.uid()) and category='photo')));
create policy birth_feature on public.birth_records as restrictive for all to authenticated using(private.feature_enabled('postpartum',(select clinic_id from public.pregnancies where id=pregnancy_id))) with check(private.feature_enabled('postpartum',(select clinic_id from public.pregnancies where id=pregnancy_id)));
create policy invites_read on public.companion_invites for select to authenticated using(user_id=(select auth.uid()) or companion_id=(select auth.uid()));
create policy invites_create on public.companion_invites for insert to authenticated with check(user_id=(select auth.uid()) and private.owns_journey(pregnancy_id) and status='pending' and companion_id is null and private.feature_enabled('companion',(select clinic_id from public.pregnancies where id=pregnancy_id)));
create policy invites_revoke on public.companion_invites for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and status='revoked');
create policy invites_delete on public.companion_invites for delete to authenticated using(user_id=(select auth.uid()));
create policy shares_owner on public.memory_shares for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.private_memories m join public.companion_invites i on i.pregnancy_id=m.pregnancy_id where m.id=memory_id and i.id=invitation_id and i.user_id=(select auth.uid()) and i.status='accepted'));
create policy books_owner on public.journey_books for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy books_enabled on public.journey_books as restrictive for all to authenticated using(private.feature_enabled('book')) with check(private.feature_enabled('book'));
create policy book_items_owner on public.journey_book_items for all to authenticated using(exists(select 1 from public.journey_books where id=book_id and user_id=(select auth.uid()))) with check(exists(select 1 from public.journey_books where id=book_id and user_id=(select auth.uid())) and exists(select 1 from public.private_memories where id=memory_id and user_id=(select auth.uid())));

create function private.accept_companion(p_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare i public.companion_invites; email_address text; c uuid;begin
 if auth.uid() is null then raise exception 'Acesso necessário';end if;
 select * into i from public.companion_invites where token_hash=p_hash for update;
 select lower(email) into email_address from auth.users where id=auth.uid();
 select clinic_id into c from public.pregnancies where id=i.pregnancy_id;
 if i.id is null or i.status<>'pending' or i.expires_at<=now() or i.user_id=auth.uid() or i.email is distinct from email_address or not private.feature_enabled('companion',c) then raise exception 'Convite indisponível';end if;
 update public.companion_invites set status='accepted',companion_id=auth.uid() where id=i.id;return i.id;end;$$;
create function public.accept_companion(p_hash text) returns uuid language sql security invoker set search_path='' as $$select private.accept_companion(p_hash);$$;
revoke all on function private.accept_companion(text),public.accept_companion(text) from public,anon;
grant execute on function private.accept_companion(text),public.accept_companion(text) to authenticated;
create function private.companion_overview() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'due_date',p.due_date,'status',p.status,'clinic_slug',c.slug,'mother_name',p.display_name)), '[]'::jsonb)
 from public.companion_invites i join public.pregnancies p on p.id=i.pregnancy_id left join public.clinics c on c.id=p.clinic_id
 where i.companion_id=(select auth.uid()) and i.status='accepted' and private.feature_enabled('companion',p.clinic_id) and (p.clinic_id is null or c.status='active');
$$;
create function public.companion_overview() returns jsonb language sql stable security invoker set search_path='' as $$select private.companion_overview();$$;
create function private.shared_memory(p_memory uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',m.id,'body',m.body,'category',m.category,'occurred_on',m.occurred_on,'gestational_week',m.gestational_week,'storage_path',m.storage_path)
 from public.memory_shares s join public.private_memories m on m.id=s.memory_id join public.companion_invites i on i.id=s.invitation_id
 where m.id=p_memory and i.companion_id=(select auth.uid()) and i.status='accepted' and private.feature_enabled('companion',m.clinic_id)
 and (m.clinic_id is null or exists(select 1 from public.clinics c where c.id=m.clinic_id and c.status='active'))
 and not exists(select 1 from public.time_capsules t where t.memory_id=m.id and t.opens_on>current_date);
$$;
create function public.shared_memory(p_memory uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.shared_memory(p_memory);$$;
create function private.shared_memory_ids() returns table(id uuid) language sql stable security definer set search_path='' as $$select s.memory_id from public.memory_shares s where private.shared_memory(s.memory_id) is not null;$$;
create function public.shared_memory_ids() returns table(id uuid) language sql stable security invoker set search_path='' as $$select * from private.shared_memory_ids();$$;
revoke all on function private.companion_overview(),public.companion_overview(),private.shared_memory(uuid),public.shared_memory(uuid),private.shared_memory_ids(),public.shared_memory_ids() from public,anon;
grant execute on function private.companion_overview(),public.companion_overview(),private.shared_memory(uuid),public.shared_memory(uuid),private.shared_memory_ids(),public.shared_memory_ids() to authenticated;
create function private.shared_storage(p_path text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.private_memories m where m.storage_path=p_path and private.shared_memory(m.id) is not null);$$;
revoke all on function private.shared_storage(text) from public,anon;
grant execute on function private.shared_storage(text) to authenticated;
create policy companion_explicit_file on storage.objects for select to authenticated using(bucket_id='private-memories' and private.shared_storage(name));

create function private.birth_stage() returns trigger language plpgsql security definer set search_path='' as $$begin
 if TG_OP='DELETE' then update public.pregnancies set status='active' where id=old.pregnancy_id and status='completed';return old;end if;
 update public.pregnancies set status='completed' where id=new.pregnancy_id;return new;end;$$;
revoke all on function private.birth_stage() from public,anon,authenticated;
create trigger birth_stage after insert or delete on public.birth_records for each row execute function private.birth_stage();
-- A postpartum record must not keep advancing the gestational clock.
create function private.memory_birth_week() returns trigger language plpgsql security definer set search_path='' as $$begin
 if exists(select 1 from public.birth_records b where b.pregnancy_id=new.pregnancy_id and b.user_id=new.user_id and new.occurred_on>(b.born_at at time zone 'America/Sao_Paulo')::date) then new.gestational_week:=null;end if;
 return new;end;$$;
revoke all on function private.memory_birth_week() from public,anon,authenticated;
create trigger memory_birth_week before insert or update on public.private_memories for each row execute function private.memory_birth_week();
create function private.save_journey_book(p_title text,p_memories uuid[]) returns uuid language plpgsql security definer set search_path='' as $$declare b uuid;begin
 if auth.uid() is null or not private.feature_enabled('book') or cardinality(p_memories) not between 1 and 100 then raise exception 'Acesso negado';end if;
 if (select count(*) from public.private_memories m where m.id=any(p_memories) and m.user_id=auth.uid() and private.owns_journey(m.pregnancy_id) and private.feature_enabled('book',m.clinic_id))<>cardinality(p_memories) then raise exception 'Seleção inválida';end if;
 insert into public.journey_books(user_id,title) values(auth.uid(),p_title) returning id into b;
 insert into public.journey_book_items(book_id,memory_id,position) select b,u.id,u.position from unnest(p_memories) with ordinality as u(id,position);
 return b;end;$$;
create function public.save_journey_book(p_title text,p_memories uuid[]) returns uuid language sql security invoker set search_path='' as $$select private.save_journey_book(p_title,p_memories);$$;
revoke all on function private.save_journey_book(text,uuid[]),public.save_journey_book(text,uuid[]) from public,anon;
grant execute on function private.save_journey_book(text,uuid[]),public.save_journey_book(text,uuid[]) to authenticated;
commit;
