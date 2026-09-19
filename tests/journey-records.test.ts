import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {journeyToday,recordWeek,recordPayload,recordSchema,recordDateLabel,journeyPage} from '../src/lib/journey-records';
import {JourneyEmpty,JourneyTimeline} from '../src/components/journey-timeline';
import {PatientNavigation} from '../src/components/patient-navigation';
const id='30000000-0000-4000-8000-000000000001';
const context={userId:'owner',clinicId:'clinic',pregnancyId:'pregnancy',dueDate:'2027-02-06'};
function form(kind='diary',date='2026-09-19',text='Um pequeno momento.'){const f=new FormData();for(const [k,v] of Object.entries({id,kind,date,text}))f.set(k,v);return f;}
test('record date uses São Paulo calendar and calculates the week of the chosen day',()=>{
 assert.equal(journeyToday(new Date('2026-09-20T01:00:00Z')),'2026-09-19');
 assert.equal(recordWeek('2027-02-06','2026-09-19'),20);
 assert.equal(recordWeek('2027-02-06','2026-09-12'),19);
 assert.equal(recordWeek('2027-02-06','2026-09-18'),19);
 assert.equal(recordWeek('2027-02-06','2026-02-31'),null);
 assert.equal(recordWeek('2027-02-06','2025-01-01'),null);
 assert.equal(recordDateLabel('2026-09-19'),'19 de setembro de 2026');
});
test('all three text types use server-owned tenant, pregnancy and calculated week',()=>{
 for(const kind of ['diary','memory','milestone']) {
  const f=form(kind);for(const key of ['user_id','clinic_id','pregnancy_id','gestational_week','storage_path'])f.set(key,'forged');
  const result=recordPayload(f,context,'2026-09-19');assert.ok(result.data);
  assert.equal(result.data.user_id,'owner');assert.equal(result.data.clinic_id,'clinic');assert.equal(result.data.pregnancy_id,'pregnancy');
  assert.equal(result.data.gestational_week,20);assert.equal(result.data.category,kind);assert.ok(!('storage_path' in result.data));
 }
});
test('empty text, future/invalid dates, unsupported type and overlong text are rejected',()=>{
 for(const f of [form('photo'),form('letter'),form('diary','2026-09-20'),form('diary','2026-02-30'),form('diary','2026-09-19','  '),form('diary','2026-09-19','a'.repeat(2001))])assert.ok(recordPayload(f,context,'2026-09-19').error);
 const f=form();f.set('id','invalid');assert.ok(recordPayload(f,context,'2026-09-19').error);
 assert.equal(recordPayload(form('diary','2026-09-19','  Meu texto.  '),context,'2026-09-19').data?.body,'Meu texto.');
 assert.ok(recordSchema('2026-09-19').safeParse({id,kind:'diary',text:'a'.repeat(2000),date:'2026-09-19'}).success);
});
test('timeline renders dates, week zero, unknown week and legacy moments without interpreting HTML',()=>{
 const html=renderToStaticMarkup(createElement(JourneyTimeline,{records:[
  {id,category:'diary',body:'<script>alert(1)</script>\nUma frase.',occurred_on:'2026-09-19',gestational_week:20},
  {id:'two',category:'moment',body:'Uma memória.',occurred_on:'2026-09-18',gestational_week:0},
  {id:'three',category:'milestone',body:'Um marco.',occurred_on:'2026-09-17',gestational_week:null},
 ]}));
 assert.ok(html.includes('Semana 20'));assert.ok(html.includes('Semana 0'));assert.ok(html.includes('Semana não estimada'));
 assert.ok(html.includes('Memória'));assert.ok(html.includes('Marco'));assert.match(html,/datetime="2026-09-19"/i);
 assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});
test('empty journey is optional and navigation enables only the authorized new destination',()=>{
 const empty=renderToStaticMarkup(createElement(JourneyEmpty,{hasActive:true}));
 assert.ok(empty.includes('Sua história começa'));assert.ok(empty.includes('quando você quiser'));
 const inactive=renderToStaticMarkup(createElement(JourneyEmpty,{hasActive:false}));assert.ok(inactive.includes('Não há uma gestação ativa'));
 const nav=renderToStaticMarkup(createElement(PatientNavigation,{slug:'vida-plena',current:'gestante/jornada'}));
 assert.match(nav,/<a(?=[^>]*aria-current="page")(?=[^>]*href="\/vida-plena\/gestante\/jornada")[^>]*>/);
 assert.ok(!nav.includes('/memorias'));assert.ok(!nav.includes('/cartas'));
});
test('pagination refuses malformed values and keeps a bounded offset',()=>{
 assert.equal(journeyPage('2'),2);for(const value of [undefined,'-1','1.5','2e2','0','100000','01'])assert.equal(journeyPage(value),1);
});
