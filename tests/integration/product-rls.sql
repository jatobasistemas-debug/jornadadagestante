-- Run as the database administrator. Every fixture and flag change is rolled back.
begin;
create temporary table qa_product_context as select gen_random_uuid() as mother,gen_random_uuid() as other,gen_random_uuid() as companion,gen_random_uuid() as administrator,gen_random_uuid() as superadmin,gen_random_uuid() as pregnancy,gen_random_uuid() as memory,gen_random_uuid() as invitation,
 (select id from public.clinics where slug='vida-plena' and status='active') as clinic,
 (select id from public.clinics where slug='clinica-horizonte' and status='active') as other_clinic;
grant select on qa_product_context to authenticated;
do $$begin if exists(select 1 from qa_product_context where clinic is null or other_clinic is null) then raise exception 'Demo clinics unavailable';end if;end$$;
insert into auth.users(id,aud,role,email,raw_user_meta_data)
select u,'authenticated','authenticated','qa-product-'||u||'@example.invalid',jsonb_build_object('full_name','QA PRODUTO TRANSACIONAL') from qa_product_context c cross join lateral unnest(array[c.mother,c.other,c.companion,c.administrator,c.superadmin]) u;
insert into public.clinic_memberships(clinic_id,user_id,role)
select clinic,mother,'patient'::public.member_role from qa_product_context union all
select clinic,other,'patient'::public.member_role from qa_product_context union all
select other_clinic,administrator,'clinic_admin'::public.member_role from qa_product_context;
insert into public.superadmins(user_id) select superadmin from qa_product_context;
insert into public.pregnancies(id,user_id,clinic_id,display_name,due_date) select pregnancy,mother,clinic,'QA PRODUTO TRANSACIONAL',current_date+140 from qa_product_context;
update public.feature_flags set enabled=true where key in('companion','postpartum','book','community','radar');
delete from public.clinic_feature_flags where clinic_id in(select clinic from qa_product_context) and key in('companion','postpartum','book','community','radar');
set local role authenticated;
select set_config('request.jwt.claim.sub',(select mother::text from qa_product_context),true);
insert into public.private_memories(id,user_id,clinic_id,pregnancy_id,category,body) select memory,mother,clinic,pregnancy,'diary','QA PRODUTO TRANSACIONAL' from qa_product_context;
insert into public.companion_invites(id,pregnancy_id,user_id,email,token_hash) select invitation,pregnancy,mother,'qa-product-'||companion||'@example.invalid',repeat('c',64) from qa_product_context;
do $$begin if (select count(*) from public.private_memories where id=(select memory from qa_product_context))<>1 then raise exception 'Owner cannot read';end if;end$$;
select set_config('request.jwt.claim.sub',(select other::text from qa_product_context),true);
do $$begin if exists(select 1 from public.private_memories where id=(select memory from qa_product_context)) then raise exception 'Other patient sees private content';end if;end$$;
select set_config('request.jwt.claim.sub',(select administrator::text from qa_product_context),true);
do $$begin if exists(select 1 from public.private_memories where id=(select memory from qa_product_context)) then raise exception 'Clinic sees private content';end if;
 if exists(select 1 from public.pregnancies where id=(select pregnancy from qa_product_context)) then raise exception 'Cross-tenant pregnancy exposed';end if;
 begin perform public.platform_metrics();raise exception 'Clinic reached superadmin';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub',(select superadmin::text from qa_product_context),true);
do $$begin if exists(select 1 from public.private_memories where id=(select memory from qa_product_context)) then raise exception 'Superadmin sees private content';end if;end$$;
select set_config('request.jwt.claim.sub',(select companion::text from qa_product_context),true);
select public.accept_companion(repeat('c',64));
do $$begin if public.shared_memory((select memory from qa_product_context)) is not null then raise exception 'Automatic sharing';end if;end$$;
select set_config('request.jwt.claim.sub',(select mother::text from qa_product_context),true);
insert into public.memory_shares(memory_id,invitation_id,user_id) select memory,invitation,mother from qa_product_context;
select set_config('request.jwt.claim.sub',(select companion::text from qa_product_context),true);
do $$begin if public.shared_memory((select memory from qa_product_context)) is null then raise exception 'Explicit sharing failed';end if;end$$;
select set_config('request.jwt.claim.sub',(select mother::text from qa_product_context),true);
insert into public.time_capsules(memory_id,user_id,opens_on) select memory,mother,current_date+1 from qa_product_context;
update public.time_capsules set recipient='QA futuro' where memory_id=(select memory from qa_product_context);
select set_config('request.jwt.claim.sub',(select companion::text from qa_product_context),true);
do $$begin if public.shared_memory((select memory from qa_product_context)) is not null then raise exception 'Future capsule exposed';end if;end$$;
select set_config('request.jwt.claim.sub',(select mother::text from qa_product_context),true);
delete from public.time_capsules where memory_id=(select memory from qa_product_context);
update public.companion_invites set status='revoked' where id=(select invitation from qa_product_context);
select set_config('request.jwt.claim.sub',(select companion::text from qa_product_context),true);
do $$begin if public.shared_memory((select memory from qa_product_context)) is not null then raise exception 'Revocation failed';end if;end$$;
select set_config('request.jwt.claim.sub',(select mother::text from qa_product_context),true);
select public.save_journey_book('QA livro',array[(select memory from qa_product_context)]);
insert into public.birth_records(pregnancy_id,user_id,born_at) select pregnancy,mother,now()-interval '2 days' from qa_product_context;
update public.birth_records set name='QA bebê' where pregnancy_id=(select pregnancy from qa_product_context);
do $$declare selected_book uuid;begin
 selected_book:=public.save_book_selection(null,'QA nascimento',array[]::uuid[],(select pregnancy from qa_product_context));
 perform public.save_book_selection(selected_book,'QA edição',array[(select memory from qa_product_context)],null);
 if (select count(*) from public.journey_book_items where book_id=selected_book and memory_id=(select memory from qa_product_context))<>1 then raise exception 'Book editing failed';end if;
end$$;
do $$begin if (select status from public.pregnancies where id=(select pregnancy from qa_product_context))<>'completed' then raise exception 'Birth stage failed';end if;end$$;
delete from public.birth_records where pregnancy_id=(select pregnancy from qa_product_context);
do $$begin if (select status from public.pregnancies where id=(select pregnancy from qa_product_context))<>'active' then raise exception 'Birth cancellation failed';end if;end$$;
reset role;
select 'PASS: owner, patient isolation, cross-tenant, clinic restrictions, superadmin privacy, companion sharing/revocation, capsule, book and birth CRUD' as result;
rollback;
