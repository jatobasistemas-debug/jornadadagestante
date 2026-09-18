begin;
create function public.my_clinic_links() returns table(slug text,name text,role public.member_role) language sql stable security definer set search_path='' as $$
 select c.slug,c.name,m.role from public.clinics c join public.clinic_memberships m on m.clinic_id=c.id
 where m.user_id=(select auth.uid()) and m.active and c.status='active' order by c.name;
$$;
revoke execute on function public.my_clinic_links() from public,anon;
grant execute on function public.my_clinic_links() to authenticated;
-- Enrollment is disabled until actual policies are reviewed. Guards direct Auth API signup too.
create table private.registration_settings(singleton boolean primary key default true check(singleton),enabled boolean not null default false);
insert into private.registration_settings(singleton,enabled) values(true,false);
create function private.check_enrollment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if nullif(new.raw_user_meta_data->>'clinic_slug','') is not null and not (select enabled from private.registration_settings where singleton) then
  raise exception 'Cadastros ainda não liberados';
 end if;
 return new;
end; $$;
create trigger check_enrollment before insert on auth.users for each row execute function private.check_enrollment();
revoke all on private.registration_settings from public,anon,authenticated;
revoke all on function private.check_enrollment() from public,anon,authenticated;
commit;

