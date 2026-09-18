-- Fictional clinics only. User accounts are provisioned with the Admin Auth API by scripts/seed-demo.ts.
insert into public.plans(id,name) values('00000000-0000-4000-8000-000000000001','Referência V1') on conflict do nothing;
insert into public.clinics(id,slug,name,status,plan_id) values
('10000000-0000-4000-8000-000000000001','vida-plena','Clínica Vida Plena','active','00000000-0000-4000-8000-000000000001'),
('20000000-0000-4000-8000-000000000001','clinica-horizonte','Clínica Horizonte · demonstração','active','00000000-0000-4000-8000-000000000001') on conflict do nothing;
insert into public.clinic_themes(clinic_id,tokens,city,slogan) values('10000000-0000-4000-8000-000000000001','{"primary": "#805044", "primarySoft": "#F0E2DA", "secondary": "#526758", "accent": "#A17440", "background": "#FAF7F2", "surface": "#FFFFFF", "text": "#302D29", "muted": "#68615A", "border": "#D7CBC2", "onPrimary": "#FFFFFF", "danger": "#A12B30", "focus": "#66532D"}','Barueri/SP','Primeiro cuidar. Depois oferecer.') on conflict do nothing;
insert into public.clinic_themes(clinic_id,tokens,city,slogan) values('20000000-0000-4000-8000-000000000001','{"primary": "#315D58", "primarySoft": "#DCEAE6", "secondary": "#675980", "accent": "#926D33", "background": "#F3F7F5", "surface": "#FFFFFF", "text": "#302D29", "muted": "#68615A", "border": "#C5D5CF", "onPrimary": "#FFFFFF", "danger": "#A12B30", "focus": "#66532D"}','Clínica fictícia para teste de isolamento','Primeiro cuidar. Depois oferecer.') on conflict do nothing;
insert into public.modules(key,name) values ('journey','Jornada'),('memories','Memórias'),('letters','Cartas físicas'),('book','Livro da Jornada'),('materials','Materiais') on conflict do nothing;
insert into public.clinic_modules(clinic_id,module_key,enabled) select c.id,m.key,false from public.clinics c cross join public.modules m on conflict do nothing;
insert into public.clinic_services(clinic_id,name) values('10000000-0000-4000-8000-000000000001','Obstetrícia') on conflict do nothing;
insert into public.clinic_services(clinic_id,name) values('10000000-0000-4000-8000-000000000001','Ultrassonografia') on conflict do nothing;
insert into public.clinic_services(clinic_id,name) values('10000000-0000-4000-8000-000000000001','Laboratório') on conflict do nothing;
insert into public.clinic_services(clinic_id,name) values('10000000-0000-4000-8000-000000000001','Nutrição') on conflict do nothing;
insert into public.clinic_services(clinic_id,name) values('10000000-0000-4000-8000-000000000001','Odontologia') on conflict do nothing;
insert into public.clinic_services(clinic_id,name) values('10000000-0000-4000-8000-000000000001','Psicologia') on conflict do nothing;
