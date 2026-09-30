begin;
-- Legacy sponsored accounts retain approved access; explicit subscriptions enforce expiry.
create function private.can_write_journey() returns boolean language sql stable security definer set search_path='' as $$
 select not exists(select 1 from public.subscriptions where user_id=(select auth.uid())) or private.personal_access();
$$;
revoke all on function private.can_write_journey() from public,anon;
grant execute on function private.can_write_journey() to authenticated;
create policy memories_subscription_insert on public.private_memories as restrictive for insert to authenticated with check(private.can_write_journey());
create policy memories_subscription_update on public.private_memories as restrictive for update to authenticated using(true) with check(private.can_write_journey());
create policy storage_subscription_insert on storage.objects as restrictive for insert to authenticated with check(bucket_id<>'private-memories' or private.can_write_journey());
create policy storage_subscription_update on storage.objects as restrictive for update to authenticated using(true) with check(bucket_id<>'private-memories' or private.can_write_journey());
create function private.cancel_my_access() returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'Acesso necessário';end if;
 update public.subscriptions set status='cancelled',sponsor_id=null,ends_at=greatest(now(),starts_at+interval '1 microsecond'),renews_at=null where user_id=auth.uid();
end;$$;
create function public.cancel_my_access() returns void language sql security invoker set search_path='' as $$select private.cancel_my_access();$$;
revoke all on function private.cancel_my_access(),public.cancel_my_access() from public,anon;
grant execute on function private.cancel_my_access(),public.cancel_my_access() to authenticated;

alter table public.journey_books add column birth_pregnancy_id uuid references public.birth_records(pregnancy_id) on delete set null;
create index books_birth_idx on public.journey_books(birth_pregnancy_id);
create policy books_birth_owner on public.journey_books as restrictive for all to authenticated using(true) with check(birth_pregnancy_id is null or exists(select 1 from public.birth_records where pregnancy_id=birth_pregnancy_id and user_id=(select auth.uid())));
create function private.save_book_selection(p_book uuid,p_title text,p_memories uuid[],p_birth uuid) returns uuid language plpgsql security definer set search_path='' as $$declare b uuid;begin
 if auth.uid() is null or not private.feature_enabled('book') or p_memories is null or cardinality(p_memories)>100 or (cardinality(p_memories)=0 and p_birth is null) then raise exception 'Seleção inválida';end if;
 if (select count(*) from public.private_memories m where m.id=any(p_memories) and m.user_id=auth.uid() and private.owns_journey(m.pregnancy_id) and private.feature_enabled('book',m.clinic_id))<>cardinality(p_memories) then raise exception 'Seleção inválida';end if;
 if p_birth is not null and not exists(select 1 from public.birth_records r join public.pregnancies p on p.id=r.pregnancy_id where r.pregnancy_id=p_birth and r.user_id=auth.uid() and private.owns_journey(p.id) and private.feature_enabled('book',p.clinic_id) and private.feature_enabled('postpartum',p.clinic_id)) then raise exception 'Nascimento indisponível';end if;
 if p_book is null then insert into public.journey_books(user_id,title,birth_pregnancy_id) values(auth.uid(),p_title,p_birth) returning id into b;
 else update public.journey_books set title=p_title,birth_pregnancy_id=p_birth where id=p_book and user_id=auth.uid() returning id into b;if b is null then raise exception 'Livro indisponível';end if;delete from public.journey_book_items where book_id=b;end if;
 insert into public.journey_book_items(book_id,memory_id,position) select b,u.id,u.position from unnest(p_memories) with ordinality as u(id,position);
 return b;end;$$;
create function public.save_book_selection(p_book uuid,p_title text,p_memories uuid[],p_birth uuid default null) returns uuid language sql security invoker set search_path='' as $$select private.save_book_selection(p_book,p_title,p_memories,p_birth);$$;
revoke all on function private.save_book_selection(uuid,text,uuid[],uuid),public.save_book_selection(uuid,text,uuid[],uuid) from public,anon;
grant execute on function private.save_book_selection(uuid,text,uuid[],uuid),public.save_book_selection(uuid,text,uuid[],uuid) to authenticated;
create function private.referral_activated() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.status in('active','trial','sponsored') and (new.ends_at is null or new.ends_at>now()) then update public.referral_conversions set status='active' where user_id=new.user_id;end if;return new;end;$$;
revoke all on function private.referral_activated() from public,anon,authenticated;
create trigger referral_activated after insert or update on public.subscriptions for each row execute function private.referral_activated();
commit;
