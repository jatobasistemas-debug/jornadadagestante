import 'server-only';
import { redirect, notFound } from 'next/navigation';
import { isConfigured } from '@/lib/config';
import { supabaseServer } from '@/lib/supabase/server';
import { slugSchema } from '@/lib/validation';
import { themeSchema, type Theme } from '@/lib/theme';
export type Clinic={id:string;slug:string;name:string;logo_url:string|null;tokens:Theme;city:string|null;slogan:string|null;phone:string|null;whatsapp:string|null;address:string|null;instagram:string|null;website:string|null};
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
export async function requireClinic(slug:string,allowed:readonly string[]){
 const clinic=await publicClinic(slug);const {db,user}=await requireUser();
 const {data,error}=await db.from('clinic_memberships').select('role').eq('clinic_id',clinic.id).eq('user_id',user.id).eq('active',true).maybeSingle();
 if(error) throw new Error('Não foi possível verificar seu acesso.');
 if(!data || !allowed.includes(data.role)) notFound();
 return {db,user,clinic,role:data.role as string};
}
export async function requireSuperadmin(){
 const {db,user}=await requireUser();const {data,error}=await db.from('superadmins').select('user_id').eq('user_id',user.id).maybeSingle();
 if(error) throw new Error('Não foi possível verificar seu acesso.');
 if(!data) notFound();return {db,user};
}
