begin;
-- Read-only timeline projection. Underlying owner RLS and module flags remain authoritative.
create function public.journey_timeline(
 p_clinic uuid, p_kind text default null, p_week integer default null,
 p_from date default null, p_to date default null, p_oldest boolean default false,
 p_offset integer default 0, p_limit integer default 21
) returns table(id uuid,category text,body text,occurred_on date,gestational_week integer,is_capsule boolean,opens_on date)
language sql stable security invoker set search_path='' as $$
 with events as (
  select m.id,m.category,m.body,m.occurred_on,m.gestational_week::integer,
   c.memory_id is not null as is_capsule,c.opens_on
  from public.private_memories m left join public.time_capsules c on c.memory_id=m.id
  where m.user_id=(select auth.uid()) and m.clinic_id is not distinct from p_clinic
  union all
  select b.pregnancy_id,'birth',concat_ws(E'\n',nullif(b.name,''),nullif(b.note,'')),
   (b.born_at at time zone 'America/Sao_Paulo')::date,
   greatest(0,least(42,floor(((b.born_at at time zone 'America/Sao_Paulo')::date-(p.due_date-280))/7.0)::integer)),false,null::date
  from public.birth_records b join public.pregnancies p on p.id=b.pregnancy_id
  where b.user_id=(select auth.uid()) and p.clinic_id is not distinct from p_clinic
 ) select * from events e
 where (p_kind is null or e.category=p_kind or (p_kind='capsule' and e.is_capsule))
 and (p_week is null or e.gestational_week=p_week)
 and (p_from is null or e.occurred_on>=p_from) and (p_to is null or e.occurred_on<=p_to)
 order by case when p_oldest then e.occurred_on end asc,
 case when not coalesce(p_oldest,false) then e.occurred_on end desc,e.id
 limit greatest(1,least(coalesce(p_limit,21),100)) offset greatest(0,coalesce(p_offset,0));
$$;
revoke all on function public.journey_timeline(uuid,text,integer,date,date,boolean,integer,integer) from public,anon;
grant execute on function public.journey_timeline(uuid,text,integer,date,date,boolean,integer,integer) to authenticated;
commit;
