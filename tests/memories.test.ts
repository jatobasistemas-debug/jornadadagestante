import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {memoryInput,memoryValues,validateMemoryFile,ownedMemoryPath,memoryFilters} from '../src/lib/memories';
import {profileInput} from '../src/lib/profile-input';
const id='30000000-0000-4000-8000-000000000001';
function form(category='letter',body='Para você, bebê.',date='2026-09-19'){const f=new FormData();Object.entries({id,category,body,date}).forEach(([k,v])=>f.set(k,v));return f;}
test('memories support the seven existing categories and all six filters',()=>{
 for(const category of ['photo','diary','ultrasound','letter','memory','milestone','moment'])assert.ok(memoryInput(form(category),'2026-09-19').data);
 assert.equal(Object.keys(memoryFilters).length,6);
});
test('empty captions allowed only for photos and ultrasound; letter limit independent from diary',()=>{
 for(const category of ['photo','ultrasound'])assert.ok(memoryInput(form(category,''),'2026-09-19').data);
 for(const category of ['diary','letter','memory','milestone'])assert.ok(memoryInput(form(category,'  '),'2026-09-19').error);
 assert.ok(memoryInput(form('letter','x'.repeat(20000)),'2026-09-19').data);
 assert.ok(memoryInput(form('letter','x'.repeat(20001)),'2026-09-19').error);
 assert.ok(memoryInput(form('diary','x'.repeat(2001)),'2026-09-19').error);
});
test('invalid and future dates, forged categories and IDs are refused',()=>{
 for(const date of ['2026-02-30','2026-09-20','invalid'])assert.ok(memoryInput(form('letter','a',date),'2026-09-19').error);
 assert.ok(memoryInput(form('admin'),'2026-09-19').error);
 const f=form();f.set('id','bad');assert.ok(memoryInput(f,'2026-09-19').error);
});
test('edit payload recalculates week and excludes forged owner, clinic, pregnancy and path',()=>{
 const f=form();for(const key of ['user_id','clinic_id','pregnancy_id','storage_path','gestational_week'])f.set(key,'forged');
 const parsed=memoryInput(f,'2026-09-19');assert.ok(parsed.data);
 assert.deepEqual(memoryValues(parsed.data,'2027-02-06'),{category:'letter',body:'Para você, bebê.',occurred_on:'2026-09-19',gestational_week:20});
});
test('private paths must match all ownership segments and cannot traverse or nest',()=>{
 assert.ok(ownedMemoryPath('c/u/p/file.png','c','u','p'));
 for(const path of ['c/other/p/file.png','other/u/p/file.png','c/u/other/file.png','c/u/p/../file.png','c/u/p/nested/file.png','c/u/p/file.html'])assert.equal(ownedMemoryPath(path,'c','u','p'),false);
});
test('upload validates bytes rather than trusting filename or MIME',async()=>{
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlRMAAAAASUVORK5CYII=','base64');
 assert.equal((await validateMemoryFile(new File([png],'foto.png',{type:'image/png'}),'photo')).extension,'png');
 await assert.rejects(()=>validateMemoryFile(new File(['<script/>'],'foto.png',{type:'image/png'}),'photo'));
 await assert.rejects(()=>validateMemoryFile(new File([new Uint8Array(2097153)],'large.png',{type:'image/png'}),'photo'));
 await assert.rejects(()=>validateMemoryFile(null,'photo'));
});
test('PDF allowed for ultrasound only, with header, trailer and size validation',async()=>{
 const pdf=new File(['%PDF-1.4\n%%EOF'],'exame.pdf',{type:'application/pdf'});
 assert.equal((await validateMemoryFile(pdf,'ultrasound')).type,'application/pdf');
 await assert.rejects(()=>validateMemoryFile(pdf,'photo'));
 await assert.rejects(()=>validateMemoryFile(new File(['%PDF-1.4'],'bad.pdf',{type:'application/pdf'}),'ultrasound'));
});
test('profile validation trims name, bounds input, ignores privileges',()=>{
 assert.deepEqual(profileInput.parse({full_name:' Ana ',preferred_name:'',role:'admin'}),{full_name:'Ana',preferred_name:''});
 assert.equal(profileInput.safeParse({full_name:' ',preferred_name:''}).success,false);
 assert.equal(profileInput.safeParse({full_name:'a'.repeat(161),preferred_name:''}).success,false);
});
test('private files use authenticated owner reads, no public URLs, no caching and PDF download',()=>{
 const source=readFileSync('src/app/[clinic]/gestante/memorias/[id]/arquivo/route.ts','utf8');
 assert.match(source,/ownedMemory\(slug,id\)/);assert.match(source,/ownedMemoryPath/);assert.match(source,/private, no-store/);assert.match(source,/attachment/);assert.doesNotMatch(source,/getPublicUrl|service_role/);
});
test('new layouts use theme tokens, bounded columns and accessible mobile control sizes',()=>{
 const css=readFileSync('src/app/memories.css','utf8');assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b|rgba?\(/i);
 assert.match(css,/minmax\(0,1fr\)/);assert.match(css,/min-height:44px/);assert.match(css,/overflow-wrap:anywhere/);assert.match(css,/font-size:1rem/);
 const global=readFileSync('src/app/globals.css','utf8');assert.match(global,/safe-area-inset-bottom/);
});
