// Real Supabase + production SSR. User-agent checks are not visual browser QA.
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4188',jar=new Map();
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','4188'],{env:{...process.env,APP_URL:origin,NODE_USE_ENV_PROXY:'1'},stdio:['ignore','pipe','pipe']});
async function request(path,options={}){const r=await fetch(origin+path,{...options,redirect:'manual',signal:AbortSignal.timeout(90000),headers:{...options.headers,cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')}});for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return r;}
const decode=s=>s.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&amp;','&');
try{
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Server startup timeout')),30000);server.stdout.on('data',d=>{if(d.toString().includes('Ready')){clearTimeout(t);resolve();}});server.once('exit',()=>{clearTimeout(t);reject(Error('Server exited'));});});
 const html=await (await request('/')).text(),form=new FormData();
 const markup=[...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)].find(m=>m[1].includes('name="email"'))?.[1];assert.ok(markup);
 for(const m of markup.matchAll(/<input\b[^>]*>/g)){const n=m[0].match(/name="([^"]*)"/),v=m[0].match(/value="([^"]*)"/);if(n)form.append(decode(n[1]),decode(v?.[1]??''));}
 form.set('email','ana@jornada.example.com');form.set('password',process.env.DEMO_PASSWORD);
 assert.equal((await request('/',{method:'POST',headers:{origin},body:form})).status,303);
 for(const agent of ['Mozilla/5.0 (X11; Linux x86_64)','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile']){
  const r=await request('/vida-plena/gestante',{headers:{'user-agent':agent}});assert.equal(r.status,200);const body=(await r.text()).replace(/<!--[\s\S]*?-->/g,'');
  for(const text of ['Olá, Ana','Seu bebê','Você','Para observar','Para guardar','Seu cuidado','Minha Jornada','Memórias','Minha Clínica','Perfil','Nutrição','Obstetrícia','--primary:#805044'])assert.ok(body.includes(text),text);
  assert.ok(body.includes('<progress'));assert.ok(body.includes('aria-current="page"'));assert.ok(!body.includes('Sua experiência de acompanhamento estará disponível em breve'));
  assert.ok(!body.includes('Beatriz')&&!body.includes('Luísa'));
  console.log('PASS Home SSR real: '+(agent.includes('iPhone')?'mobile user-agent':'desktop user-agent'));
 }
 const p=await request('/vida-plena/conta');assert.equal(p.status,200);const body=await p.text();assert.ok(body.includes('Navegação da gestante'));assert.ok(body.includes('Excluir minha conta'));console.log('PASS Perfil existente + navegação');
}finally{server.kill('SIGTERM');}
