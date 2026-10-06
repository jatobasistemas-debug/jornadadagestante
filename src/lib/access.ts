import 'server-only';
import { redirect, notFound } from 'next/navigation';
import { isConfigured } from '@/lib/config';
import { supabaseServer } from '@/lib/supabase/server';
import { slugSchema } from '@/lib/validation';
import { defaultTheme, themeSchema, type Theme } from '@/lib/theme';
export type Clinic={id:string|null;slug:string;name:string;logo_url:string|null;tokens:Theme;city:string|null;slogan:string|null;phone:string|null;whatsapp:string|null;address:string|null;instagram:string|null;website:string|null};
export const personalSpace:Clinic={id:null,slug:'pessoal',name:'Sua Jornada',logo_url:null,tokens:defaultTheme,city:null,slogan:null,phone:null,whatsapp:null,address:null,instagram:null,website:null};
export async function publicClinic(slug:string):Promise<Clinic> {
 if(!slugSchema.safeParse(slug).success) notFound();
 if(!isConfigured()) redirect('/');
 const db=await supabaseServer(); const {data,error}=await db.rpc('get_public_clinic',{p_slug:slug});
 if(error) throw new Error('Não foi possível carregar a clínica.');
 if(!data) notFound();
 return {...data,tokens:themeSchema.parse(data.tokens)} as Clinic;
}
export async function requireUser(){
 if(!isConfigured()) redirect('/');
 const db=await supabaseServer(); const {data:{user},error}=await db.auth.getUser();
 if(error||!user) redirect('/?acesso=necessario');
 return {db,user};
}
export async function requireOwnAccount(slug:string){return slug?requireClinic(slug,['patient']):requireUser();}
export async function requireClinic(slug:string,allowed:readonly string[]){
 if(slug==='pessoal'){
  if(!allowed.includes('patient'))notFound();
  const {db,user}=await requireUser();
  const own=await db.from('pregnancies').select('id').eq('user_id',user.id).is('clinic_id',null).limit(1);
  if(own.error)throw new Error('Não foi possível carregar sua Jornada.');
  if(!own.data.length)notFound();
  return {db,user,clinic:personalSpace,role:'patient'};
 }
 const clinic=await publicClinic(slug);const {db,user}=await requireUser();
 const {data,error}=await db.from('clinic_memberships').select('role').filter('clinic_id',clinic.id===null?'is':'eq',clinic.id??'null').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(error) throw new Error('Não foi possível verificar seu acesso.');
 if(!data || !allowed.includes(data.role)) notFound();
 return {db,user,clinic,role:data.role as string};
}
export async function requireSuperadmin(){
 const {db,user}=await requireUser();const {data,error}=await db.from('superadmins').select('user_id').eq('user_id',user.id).maybeSingle();
 if(error) throw new Error('Não foi possível verificar seu acesso.');
 if(!data) notFound();return {db,user};
}
/** Administrative identity editing, including pending clinics, never patient records. */
export async function requireClinicManagement(slug:string){
 if(!slugSchema.safeParse(slug).success||slug==='pessoal')notFound();
 const {db,user}=await requireUser();
 const global=await db.from('superadmins').select('user_id').eq('user_id',user.id).maybeSingle();
 if(global.error)throw new Error('Não foi possível verificar seu acesso.');
 if(!global.data)return requireClinic(slug,['clinic_admin']);
 const record=await db.from('clinics').select('id,slug,name').eq('slug',slug).maybeSingle();
 if(record.error)throw new Error('Não foi possível carregar a clínica.');if(!record.data)notFound();
 const identity=await db.from('clinic_themes').select('*').eq('clinic_id',record.data.id).single();
 if(identity.error)throw new Error('Não foi possível carregar a identidade.');
 return {db,user,role:'superadmin',clinic:{...identity.data,...record.data,tokens:themeSchema.parse(identity.data.tokens)} as Clinic};
}
