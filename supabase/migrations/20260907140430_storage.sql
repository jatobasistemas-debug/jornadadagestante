begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('private-memories','private-memories',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do nothing;
create function private.owns_storage_path(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.pregnancies p
 where p.clinic_id::text=split_part(p_name,'/',1)
 and p.user_id=(select auth.uid()) and p.user_id::text=split_part(p_name,'/',2)
 and p.id::text=split_part(p_name,'/',3)
 and array_length(string_to_array(p_name,'/'),1)=4 and split_part(p_name,'/',4)<>'' and private.has_role(p.clinic_id,array['patient']::public.member_role[]));
$$;
revoke all on function private.owns_storage_path(text) from public,anon;
grant execute on function private.owns_storage_path(text) to authenticated;
create policy memory_objects_read on storage.objects for select to authenticated using(bucket_id='private-memories' and private.owns_storage_path(name));
create policy memory_objects_insert on storage.objects for insert to authenticated with check(bucket_id='private-memories' and private.owns_storage_path(name));
create policy memory_objects_update on storage.objects for update to authenticated using(bucket_id='private-memories' and private.owns_storage_path(name)) with check(bucket_id='private-memories' and private.owns_storage_path(name));
create policy memory_objects_delete on storage.objects for delete to authenticated using(bucket_id='private-memories' and private.owns_storage_path(name));
commit;

