// Exercises the real production server and Supabase through HTTP, independently of browser QA.
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const imagesOnly=process.argv.includes('--images-only');
const output=imagesOnly?'docs/test-results/http-images.json':'docs/test-results/http.json';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlRMAAAAASUVORK5CYII=','base64');
console.log('HTTP suite: iniciando servidor de produção');
const port=4191,base=`http://127.0.0.1:${port}`,results=[];
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,APP_URL:base},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',d=>{logs+=d;});server.stderr.on('data',d=>{logs+=d});
const jars=new Map();
async function request(path,options={},account='anon'){
 console.log(`HTTP ${options.method||'GET'} ${path}`);
 const jar=jars.get(account)||new Map();jars.set(account,jar);
 const started=Date.now();
 const res=await fetch(new URL(path,base),{...options,redirect:'manual',headers:{...options.headers,...(jar.size?{cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')}:{})},signal:AbortSignal.timeout(180000)});
 console.log(`HTTP response ${res.status} ${path} ${Date.now()-started}ms`);
 for(const c of res.headers.getSetCookie()){const [pair]=c.split(';'),i=pair.indexOf('=');const k=pair.slice(0,i),v=pair.slice(i+1);if(v)jar.set(k,v);else jar.delete(k);}
 return res;
}
const decode=s=>s.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
function getForm(html,match){
 const forms=[...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)].map(m=>m[1]);
 const selected=forms.find(f=>match(f));assert.ok(selected,'Formulário real não encontrado');
 const form=new FormData();for(const m of selected.matchAll(/<input\b[^>]*>/g)){const tag=m[0],name=tag.match(/\bname="([^"]*)"/),value=tag.match(/\bvalue="([^"]*)"/);if(name&&!/\btype="(?:file|submit|button)"/.test(tag)&&(!/\btype="checkbox"/.test(tag)||/\bchecked/.test(tag)))form.append(decode(name[1]),decode(value?.[1]||''));}
 return form;
}
async function submit(path,form,account){return request(path,{method:'POST',headers:{origin:base},body:form},account);}
async function login(account){
 const home=await request('/',{},account);const html=await home.text();const form=getForm(html,f=>f.includes('name="email"'));form.set('email',`${account}@jornada.example.com`);form.set('password',process.env.DEMO_PASSWORD);
 const r=await submit('/',form,account);assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/acesso');
 const access=await request('/acesso',{},account);const body=await access.text();const location=access.headers.get('location')||body;assert.ok(location.includes(account==='ana'?'/vida-plena/gestante':account==='jatoba'?'/jatoba':account==='admin.horizonte'?'/clinica-horizonte/clinica':'/vida-plena/clinica'));
}
async function check(name,fn){console.log('RUN '+name);await fn();results.push(name);console.log('PASS '+name);}
try{
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Servidor não iniciou')),20000);server.stdout.on('data',d=>{if(d.toString().includes('Ready')){clearTimeout(timeout);resolve();}});server.on('exit',()=>{clearTimeout(timeout);reject(new Error('Servidor encerrou antes de iniciar'));});});
 await check('Produção: saúde e página inicial sem erro crítico',async()=>{const r=await request('/api/health');assert.equal(r.status,200);assert.equal((await r.json()).stage,1);const h=await request('/');assert.equal(h.status,200);assert.match(await h.text(),/Jornada da Gestante/);assert.equal(h.headers.get('x-content-type-options'),'nosniff');});
 await check('Temas reais renderizados com tokens distintos nas duas clínicas',async()=>{const [a,b]=await Promise.all(['/vida-plena','/clinica-horizonte'].map(async p=>(await request(p)).text()));assert.match(a,/--primary:#805044/);assert.match(b,/--primary:#315D58/);assert.match(a,/Clínica Vida Plena/);assert.match(b,/Clínica Horizonte/);});
 await check('Server Action real: login e roteamento por papel',async()=>{await Promise.all((imagesOnly?['ana','admin.vida']:['ana','admin.vida','equipe.vida','admin.horizonte','jatoba']).map(login));});
 if(!imagesOnly)await check('Rotas autenticadas recusam papéis e tenants incorretos',async()=>{await Promise.all([['ana','/vida-plena/clinica/tema'],['ana','/clinica-horizonte/gestante'],['equipe.vida','/vida-plena/clinica/tema'],['admin.horizonte','/vida-plena/clinica'],['admin.vida','/jatoba'],['jatoba','/vida-plena/gestante']].map(async([account,path])=>{const r=await request(path,{},account);const html=await r.text();assert.ok(r.status===404||html.includes('Este espaço não está disponível.'),'Acesso indevido deve retornar indisponível');}));});
 if(!imagesOnly)await check('Exportação de Ana contém só dados da titular',async()=>{const r=await request('/api/conta/exportar',{},'ana');assert.equal(r.status,200);const data=await r.text();assert.match(data,/Ana Carolina/);assert.ok(!data.includes('Beatriz')&&!data.includes('Luísa'));});
 for(const [account,path,button,message] of [['admin.vida','/vida-plena/clinica/tema','Remover logo','Logo atualizada.'],['ana','/vida-plena/conta','Remover foto','Foto atualizada.']]){
  await check(`Server Action real: upload e remoção de ${account==='ana'?'avatar':'logo'}`,async()=>{
   let html=await (await request(path,{},account)).text();let form=getForm(html,f=>f.includes('name="image"'));form.set('image',new File([png],'fixture.png',{type:'image/png'}));
   let r=await submit(path,form,account);assert.equal(r.status,303);assert.equal(r.headers.get('location'),path+'?imagem=atualizada');html=await (await request(r.headers.get('location'),{},account)).text();assert.ok(html.includes(message), 'Upload deve retornar confirmação');
   html=await (await request(path,{},account)).text();form=getForm(html,f=>f.includes(button));r=await submit(path,form,account);assert.equal(r.status,303);assert.equal(r.headers.get('location'),path+'?imagem=removida');assert.ok((await (await request(r.headers.get('location'),{},account)).text()).includes(account==='ana'?'Foto removida.':'Logo removida.'));
  });
 }
 await check('Server Action real: tema salvo e isolado, com restauração',async()=>{
  const path='/vida-plena/clinica/tema',html=await (await request(path,{},'admin.vida')).text();
  const form=getForm(html,f=>f.includes('name="tokens"')),original=String(form.get('tokens'));
  try{
   form.set('tokens',JSON.stringify({...JSON.parse(original),primary:'#654333'}));
   const saved=await submit(path,form,'admin.vida');assert.equal(saved.status,303);assert.equal(saved.headers.get('location'),path+'?identidade=salva');
   const a=await (await request('/vida-plena')).text(),b=await (await request('/clinica-horizonte')).text();assert.match(a,/--primary:#654333/);assert.match(b,/--primary:#315D58/);
  }finally{
   const fresh=getForm(await (await request(path,{},'admin.vida')).text(),f=>f.includes('name="tokens"'));fresh.set('tokens',original);
   assert.equal((await submit(path,fresh,'admin.vida')).status,303);
  }
 });
 await check('Server Action real: logout remove acesso à sessão',async()=>{const path='/vida-plena/gestante',html=await (await request(path,{},'ana')).text(),form=getForm(html,f=>f.includes('Sair'));const r=await submit(path,form,'ana');assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/');const e=await request('/api/conta/exportar',{},'ana');assert.equal(e.status,401);});
 await mkdir('docs/test-results',{recursive:true});await writeFile(output,JSON.stringify({timestamp:new Date().toISOString(),result:'passed',checks:results,browser:false},null,2));
}catch(e){console.error(e.message);await mkdir('docs/test-results',{recursive:true});await writeFile(output,JSON.stringify({timestamp:new Date().toISOString(),result:'failed',checks:results,error:e.message,browser:false},null,2));process.exitCode=1;}
finally{
 server.kill('SIGTERM');
 // A failed response must not leave a fixture associated with a demo clinic or profile.
 for(const account of ['admin.vida','ana']){
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(a,b)=>fetch(a,{...b,signal:AbortSignal.timeout(45000)})}});
  try{
   const auth=await db.auth.signInWithPassword({email:`${account}@jornada.example.com`,password:process.env.DEMO_PASSWORD});if(auth.error)throw auth.error;
   const logo=account==='admin.vida',table=logo?'clinic_themes':'profiles',id=logo?'10000000-0000-4000-8000-000000000001':auth.data.user.id,idColumn=logo?'clinic_id':'user_id',column=logo?'logo_url':'avatar_path';
   const record=await db.from(table).select(column).eq(idColumn,id).single();if(record.error)throw record.error;
   const value=record.data[column];if(!value)continue;
   const bucket=db.storage.from(logo?'clinic-branding':'avatars'),prefix=bucket.getPublicUrl('').data.publicUrl;
   if(logo&&!value.startsWith(prefix))continue;
   const path=logo?value.slice(prefix.length):value;
   if(!path.startsWith(id+'/')||path.split('/').length!==2)continue;
   const file=await bucket.download(path);if(file.error)throw file.error;
   if(!Buffer.from(await file.data.arrayBuffer()).equals(png))continue;
   const removed=await bucket.remove([path]);if(removed.error)throw removed.error;
   const cleared=await db.from(table).update({[column]:null}).eq(idColumn,id).eq(column,value);if(cleared.error)throw cleared.error;
   console.log('CLEANUP fixture '+(logo?'logo':'avatar'));
  }catch{console.error('CLEANUP pendente para '+account);process.exitCode=1;}
  finally{await db.auth.signOut({scope:'local'});}
 }
}
