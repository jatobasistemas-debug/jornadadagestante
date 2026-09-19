import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('journey migration preserves legacy content and timestamp while backfilling the local event date',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create table public.pregnancies(id text,clinic_id text,user_id text,due_date date);
   create table public.private_memories(id text primary key,clinic_id text,user_id text,pregnancy_id text,
    category text constraint private_memories_category_check check(category in ('diary','moment','photo','ultrasound','letter')),
    body text,created_at timestamptz);
   insert into pregnancies values('p','c','u','2027-02-06');
   insert into private_memories values('m','c','u','p','moment','Original','2026-09-20T01:00:00Z');`);
  const file=(await readdir('supabase/migrations')).find(n=>n.endsWith('_journey_record_dates.sql'))!;
  await db.exec(await readFile('supabase/migrations/'+file,'utf8'));
  const result=await db.query<{body:string;category:string;day:string;week:number;created:string}>("select body,category,occurred_on::text as day,gestational_week as week,to_char(created_at at time zone 'UTC','YYYY-MM-DD HH24:MI:SS') as created from private_memories");
  assert.deepEqual(result.rows,[{body:'Original',category:'moment',day:'2026-09-19',week:20,created:'2026-09-20 01:00:00'}]);
 } finally {await db.close();}
});
