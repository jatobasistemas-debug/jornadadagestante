import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {defaultTheme} from '../src/lib/theme';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,password=process.env.DEMO_PASSWORD;
if(process.env.ALLOW_DEMO_SEED!=='true'||!url||!key||!password||password.length<12)throw new Error('Defina ALLOW_DEMO_SEED=true, URL, service role e DEMO_PASSWORD com pelo menos 12 caracteres em um projeto isolado de demonstração.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const A='10000000-0000-4000-8000-000000000001',B='20000000-0000-4000-8000-000000000001';
async function checked<T extends {error:unknown}>(request:PromiseLike<T>){const r=await request;if(r.error)throw r.error;return r;}
async function main(){
 await checked(db.from('plans').upsert({id:'00000000-0000-4000-8000-000000000001',name:'Referência V1',setup_cents:249700,monthly_cents:6200}));
 const horizon={...defaultTheme,primary:'#315D58',primarySoft:'#DCEAE6',secondary:'#675980',accent:'#926D33',background:'#F3F7F5',border:'#C5D5CF'};
 for(const c of [{id:A,slug:'vida-plena',name:'Clínica Vida Plena',city:'Barueri/SP',tokens:defaultTheme},{id:B,slug:'clinica-horizonte',name:'Clínica Horizonte · demonstração',city:'Clínica fictícia de teste',tokens:horizon}]){
  await checked(db.from('clinics').upsert({id:c.id,slug:c.slug,name:c.name,status:'active',plan_id:'00000000-0000-4000-8000-000000000001'}));
  // Preserve changes to an existing theme when rerunning the demo seed.
  await checked(db.from('clinic_themes').upsert({clinic_id:c.id,tokens:c.tokens,city:c.city,slogan:'Primeiro cuidar. Depois oferecer.'},{onConflict:'clinic_id',ignoreDuplicates:true}));
 }
 const modules=[['journey','Jornada'],['memories','Memórias'],['letters','Cartas físicas'],['book','Livro da Jornada'],['materials','Materiais']];
 await checked(db.from('modules').upsert(modules.map(([key,name])=>({key,name}))));
 await checked(db.from('clinic_modules').upsert([A,B].flatMap(clinic_id=>modules.map(([module_key])=>({clinic_id,module_key,enabled:false}))),{onConflict:'clinic_id,module_key',ignoreDuplicates:true}));
 await checked(db.from('clinic_services').upsert(['Obstetrícia','Ultrassonografia','Laboratório','Nutrição','Odontologia','Psicologia'].map(name=>({clinic_id:A,name})),{onConflict:'clinic_id,name',ignoreDuplicates:true}));
 const existing=new Map<string,string>();
 for(let page=1;;page++){const {data,error}=await db.auth.admin.listUsers({page,perPage:1000});if(error)throw error;for(const u of data.users)if(u.email)existing.set(u.email,u.id);if(data.users.length<1000)break;}
 const users=[{email:'ana@jornada.example.com',name:'Ana Carolina',clinic:A,role:'patient'},{email:'beatriz@jornada.example.com',name:'Beatriz',clinic:A,role:'patient'},{email:'luisa@jornada.example.com',name:'Luísa',clinic:B,role:'patient'},{email:'admin.vida@jornada.example.com',name:'Administradora Vida Plena',clinic:A,role:'clinic_admin'},{email:'equipe.vida@jornada.example.com',name:'Equipe Vida Plena',clinic:A,role:'clinic_staff'},{email:'admin.horizonte@jornada.example.com',name:'Administrador Horizonte',clinic:B,role:'clinic_admin'},{email:'jatoba@jornada.example.com',name:'Administração Jatobá',clinic:null,role:'superadmin'}];
 for(const u of users){
  let id=existing.get(u.email);
  if(!id){const {data,error}=await db.auth.admin.createUser({email:u.email,password,email_confirm:true,user_metadata:{full_name:u.name,demo:true}});if(error)throw error;id=data.user.id;}
  if(u.role==='superadmin'){await checked(db.from('superadmins').upsert({user_id:id}));continue;}
  await checked(db.from('clinic_memberships').upsert({clinic_id:u.clinic,user_id:id,role:u.role,active:true},{onConflict:'clinic_id,user_id'}));
  if(u.role==='patient'){
   const {data,error}=await db.from('pregnancies').select('id').eq('clinic_id',u.clinic!).eq('user_id',id).eq('status','active').maybeSingle();if(error)throw error;
   const pregnancyId=data?.id??randomUUID();
   await checked(db.from('pregnancies').upsert({id:pregnancyId,clinic_id:u.clinic,user_id:id,display_name:u.name,due_date:new Date(Date.now()+140*86400000).toISOString().slice(0,10)}));
   await checked(db.from('consent_records').upsert(['terms','privacy','sensitive_data'].map(document=>({clinic_id:u.clinic,user_id:id,document,version:'demo-2026-09-06'})),{onConflict:'user_id,clinic_id,document,version',ignoreDuplicates:true}));
   const {data:mem,error:memError}=await db.from('private_memories').select('id').eq('pregnancy_id',pregnancyId).limit(1);if(memError)throw memError;
   if(!mem?.length)await checked(db.from('private_memories').insert({clinic_id:u.clinic,user_id:id,pregnancy_id:pregnancyId,category:'diary',body:`Registro estritamente fictício de ${u.name}, para validar privacidade.`}));
  }
 }
 console.log('Demonstração criada: 2 clínicas, 7 contas, 3 gestantes e registros fictícios. A senha vem de DEMO_PASSWORD e não é impressa. Contas existentes conservam a senha anterior.');
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Falha na carga de demonstração.');process.exitCode=1;});
