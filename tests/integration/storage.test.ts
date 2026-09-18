import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
const env=process.env,url=env.NEXT_PUBLIC_SUPABASE_URL!,key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,password=env.DEMO_PASSWORD!;
const ready=!!(url&&key&&password),skip=ready?false:'Ambiente Supabase real e contas demo necessários';
const A='10000000-0000-4000-8000-000000000001',B='20000000-0000-4000-8000-000000000001';
const names=['ana','beatriz','luisa','admin.vida','equipe.vida','admin.horizonte','jatoba'];
const db:Record<string,SupabaseClient>={},uid:Record<string,string>={};
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(a,b)=>fetch(a,{...b,signal:AbortSignal.timeout(45000)})}});
function ok<T extends {error:unknown}>(r:T):T{assert.ifError(r.error);return r;}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlRMAAAAASUVORK5CYII=','base64');
function denied(r:{error:unknown;data:unknown}){assert.ok(r.error||Array.isArray(r.data)&&r.data.length===0);}
before(async()=>{if(!ready)return;await Promise.all(names.map(async n=>{db[n]=client();uid[n]=ok(await db[n].auth.signInWithPassword({email:`${n}@jornada.example.com`,password})).data.user!.id;}));});
after(async()=>{await Promise.all(Object.values(db).map(c=>c.auth.signOut({scope:'local'})));});
test('Storage: remove exclusivamente o arquivo temporário da execução interrompida',{skip},async()=>{
 const path=`${A}/qa-6ba2d048-91cf-407e-8edc-ff7291ef8ef5.png`,bucket=db['admin.vida'].storage.from('clinic-branding');
 ok(await bucket.remove([path]));
 const list=ok(await bucket.list(A,{search:'qa-6ba2d048-91cf-407e-8edc-ff7291ef8ef5.png'}));assert.equal(list.data?.length,0);
});
test('Storage real: logo público e escrita restrita ao administrador do tenant',{skip},async()=>{
 const bucket='clinic-branding',path=`${A}/qa-${randomUUID()}.png`,s=db['admin.vida'].storage.from(bucket);
 try{
  ok(await s.upload(path,png,{contentType:'image/png'}));ok(await s.upload(path,png,{contentType:'image/png',upsert:true}));
  const r=await fetch(s.getPublicUrl(path).data.publicUrl,{signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);assert.equal((await r.arrayBuffer()).byteLength,png.length);
  await Promise.all(['ana','equipe.vida','admin.horizonte'].map(async n=>{assert.ok((await db[n].storage.from(bucket).upload(path,png,{contentType:'image/png',upsert:true})).error);denied(await db[n].storage.from(bucket).remove([path]));}));
  ok(await db.jatoba.storage.from(bucket).download(path));
  assert.ok((await s.upload(`${B}/cross.png`,png,{contentType:'image/png'})).error);
  assert.ok((await s.upload(`${A}/invalid.svg`,'<svg/>',{contentType:'image/svg+xml'})).error);
  assert.ok((await s.upload(`${A}/too-large.png`,new Uint8Array(2097153),{contentType:'image/png'})).error);
 }finally{ok(await s.remove([path]));}
});
test('Storage real: avatar privado, substituição, perfil e bloqueio de outra proprietária',{skip},async()=>{
 const path=`${uid.ana}/qa-${randomUUID()}.png`,s=db.ana.storage.from('avatars');
 try{
  ok(await s.upload(path,png,{contentType:'image/png'}));ok(await s.upload(path,png,{contentType:'image/png',upsert:true}));ok(await s.download(path));
  ok(await db.ana.from('profiles').update({avatar_path:path}).eq('user_id',uid.ana).select().single());
  await Promise.all(['beatriz','admin.vida','equipe.vida','jatoba'].map(async n=>{assert.ok((await db[n].storage.from('avatars').download(path)).error);assert.ok((await db[n].storage.from('avatars').createSignedUrl(path,30)).error);denied(await db[n].storage.from('avatars').remove([path]));}));
  assert.ok((await client().storage.from('avatars').download(path)).error);
  assert.ok((await db.beatriz.storage.from('avatars').upload(path,png,{contentType:'image/png',upsert:true})).error);
  assert.ok((await db.ana.from('profiles').update({avatar_path:`${uid.beatriz}/photo.png`}).eq('user_id',uid.ana)).error);
  const signed=ok(await s.createSignedUrl(path,30)).data!.signedUrl;
  assert.equal((await fetch(signed,{signal:AbortSignal.timeout(45000)})).status,200);
 }finally{ok(await db.ana.from('profiles').update({avatar_path:null}).eq('user_id',uid.ana));ok(await s.remove([path]));}
});
test('Storage real: memórias privadas, caminhos, MIME, edição e exclusão sob RLS',{skip},async()=>{
 const p=ok(await db.ana.from('pregnancies').select('id').single()).data!,p2=ok(await db.luisa.from('pregnancies').select('id').single()).data!;
 const base=`${A}/${uid.ana}/${p.id}`,path=`${base}/qa-${randomUUID()}.png`,s=db.ana.storage.from('private-memories');
 try{
  ok(await s.upload(path,png,{contentType:'image/png'}));ok(await s.upload(path,png,{contentType:'image/png',upsert:true}));assert.equal((await ok(await s.download(path)).data!.arrayBuffer()).byteLength,png.length);
  await Promise.all(['beatriz','luisa','admin.vida','equipe.vida','admin.horizonte','jatoba'].map(async n=>{assert.ok((await db[n].storage.from('private-memories').download(path)).error);assert.ok((await db[n].storage.from('private-memories').upload(path,png,{contentType:'image/png',upsert:true})).error);denied(await db[n].storage.from('private-memories').remove([path]));}));
  assert.ok((await s.upload(`${B}/${uid.luisa}/${p2.id}/forged.png`,png,{contentType:'image/png'})).error);
  assert.ok((await s.upload(`${base}/nested/bad.png`,png,{contentType:'image/png'})).error);
  assert.ok((await s.upload(`${base}/bad.html`,'<script/>',{contentType:'text/html'})).error);
  const pdfPath=`${base}/qa-${randomUUID()}.pdf`;try{ok(await s.upload(pdfPath,Buffer.from('%PDF-1.4\n%%EOF'),{contentType:'application/pdf'}));ok(await s.download(pdfPath));}finally{ok(await s.remove([pdfPath]));}
 }finally{ok(await s.remove([path]));}
});
