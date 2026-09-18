begin;
-- Move privileged implementations out of the exposed API schema, keep narrow invoker entrypoints.
alter function public.get_public_clinic(text) set schema private;
alter function public.my_clinic_links() set schema private;
alter function public.set_staff_membership(uuid,uuid,public.member_role,boolean) set schema private;
create function public.get_public_clinic(p_slug text) returns jsonb language sql stable security invoker set search_path='' as $$select private.get_public_clinic(p_slug);$$;
create function public.my_clinic_links() returns table(slug text,name text,role public.member_role) language sql stable security invoker set search_path='' as $$select * from private.my_clinic_links();$$;
create function public.set_staff_membership(p_clinic_id uuid,p_user_id uuid,p_role public.member_role,p_active boolean default true) returns void language sql security invoker set search_path='' as $$select private.set_staff_membership(p_clinic_id,p_user_id,p_role,p_active);$$;
revoke all on function public.get_public_clinic(text),public.my_clinic_links(),public.set_staff_membership(uuid,uuid,public.member_role,boolean) from public,anon,authenticated;
grant usage on schema private to anon;
grant execute on function private.get_public_clinic(text),public.get_public_clinic(text) to anon,authenticated;
grant execute on function public.my_clinic_links(),public.set_staff_membership(uuid,uuid,public.member_role,boolean) to authenticated;
alter table private.registration_settings enable row level security;

create index audit_actor_idx on public.audit_logs(actor_id);
create index domains_clinic_idx on public.clinic_domains(clinic_id);
create index clinic_modules_module_idx on public.clinic_modules(module_key);
create index clinics_plan_idx on public.clinics(plan_id);
create index consent_clinic_user_idx on public.consent_records(clinic_id,user_id);
create index pregnancies_user_idx on public.pregnancies(user_id);
create index memories_pregnancy_clinic_user_idx on public.private_memories(pregnancy_id,clinic_id,user_id);
-- Avoid duplicate SELECT policies; keep the original read permissions and explicit writes.
drop policy clinics_super on public.clinics;
create policy clinics_insert on public.clinics for insert to authenticated with check(private.is_superadmin());
create policy clinics_update on public.clinics for update to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
create policy clinics_delete on public.clinics for delete to authenticated using(private.is_superadmin());
drop policy modules_super on public.modules;
create policy modules_insert on public.modules for insert to authenticated with check(private.is_superadmin());
create policy modules_update on public.modules for update to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
create policy modules_delete on public.modules for delete to authenticated using(private.is_superadmin());
drop policy clinic_modules_super on public.clinic_modules;
create policy clinic_modules_insert on public.clinic_modules for insert to authenticated with check(private.is_superadmin());
create policy clinic_modules_update on public.clinic_modules for update to authenticated using(private.is_superadmin()) with check(private.is_superadmin());
create policy clinic_modules_delete on public.clinic_modules for delete to authenticated using(private.is_superadmin());
drop policy services_admin on public.clinic_services;
create policy services_insert on public.clinic_services for insert to authenticated with check(private.is_admin(clinic_id) or private.is_superadmin());
create policy services_update on public.clinic_services for update to authenticated using(private.is_admin(clinic_id) or private.is_superadmin()) with check(private.is_admin(clinic_id) or private.is_superadmin());
create policy services_delete on public.clinic_services for delete to authenticated using(private.is_admin(clinic_id) or private.is_superadmin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('clinic-branding','clinic-branding',true,2097152,array['image/png','image/jpeg','image/webp']),
('avatars','avatars',false,2097152,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create function private.can_manage_branding(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select array_length(string_to_array(p_name,'/'),1)=2 and split_part(p_name,'/',2)<>'' and exists(select 1 from public.clinics c where c.id::text=split_part(p_name,'/',1) and (private.is_admin(c.id) or private.is_superadmin()));
$$;
create function private.owns_avatar(p_name text) returns boolean language sql stable security invoker set search_path='' as $$
 select (select auth.uid()) is not null and split_part(p_name,'/',1)=(select auth.uid())::text and array_length(string_to_array(p_name,'/'),1)=2 and split_part(p_name,'/',2)<>'' and exists(select 1 from public.profiles p where p.user_id=(select auth.uid()));
$$;
revoke all on function private.can_manage_branding(text),private.owns_avatar(text) from public,anon;
grant execute on function private.can_manage_branding(text),private.owns_avatar(text) to authenticated;
create policy branding_read on storage.objects for select to authenticated using(bucket_id='clinic-branding' and private.can_manage_branding(name));
create policy branding_insert on storage.objects for insert to authenticated with check(bucket_id='clinic-branding' and private.can_manage_branding(name));
create policy branding_update on storage.objects for update to authenticated using(bucket_id='clinic-branding' and private.can_manage_branding(name)) with check(bucket_id='clinic-branding' and private.can_manage_branding(name));
create policy branding_delete on storage.objects for delete to authenticated using(bucket_id='clinic-branding' and private.can_manage_branding(name));
create policy avatar_read on storage.objects for select to authenticated using(bucket_id='avatars' and private.owns_avatar(name));
create policy avatar_insert on storage.objects for insert to authenticated with check(bucket_id='avatars' and private.owns_avatar(name));
create policy avatar_update on storage.objects for update to authenticated using(bucket_id='avatars' and private.owns_avatar(name)) with check(bucket_id='avatars' and private.owns_avatar(name));
create policy avatar_delete on storage.objects for delete to authenticated using(bucket_id='avatars' and private.owns_avatar(name));
alter table public.profiles add column avatar_path text check(avatar_path is null or (split_part(avatar_path,'/',1)=user_id::text and array_length(string_to_array(avatar_path,'/'),1)=2));
grant update(avatar_path) on public.profiles to authenticated;
commit;

