-- Extend the existing owner-private records, retaining RLS, FKs and created_at.
alter table public.private_memories
  add column occurred_on date,
  add column gestational_week smallint check (gestational_week between 0 and 42);

-- Legacy records have no separate event date; use their original local creation day.
update public.private_memories m
set occurred_on = (m.created_at at time zone 'America/Sao_Paulo')::date,
    gestational_week = case
      when 280 + ((m.created_at at time zone 'America/Sao_Paulo')::date - p.due_date) between 0 and 300
      then (280 + ((m.created_at at time zone 'America/Sao_Paulo')::date - p.due_date)) / 7
      else null end
from public.pregnancies p
where p.id=m.pregnancy_id and p.clinic_id=m.clinic_id and p.user_id=m.user_id;

alter table public.private_memories
  alter column occurred_on set default ((now() at time zone 'America/Sao_Paulo')::date),
  alter column occurred_on set not null;
alter table public.private_memories drop constraint private_memories_category_check;
alter table public.private_memories add constraint private_memories_category_check
  check (category in ('photo','diary','ultrasound','letter','moment','memory','milestone'));
create index memories_timeline_idx on public.private_memories
  (user_id,clinic_id,occurred_on desc,created_at desc,id desc);
comment on column public.private_memories.occurred_on is 'Date chosen by the owner. Legacy records use the creation day in America/Sao_Paulo.';
comment on column public.private_memories.gestational_week is 'Estimated week for occurred_on, calculated from the pregnancy due date when saved; null outside the estimated gestational range.';
