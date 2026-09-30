'use server';
import {createHash} from 'node:crypto';
import {requireUser} from '@/lib/access';
import {redirect} from 'next/navigation';
import type {ManageState} from '@/app/gestao/actions';
import {z} from 'zod';
import {supabaseServer} from '@/lib/supabase/server';
import {appUrl} from '@/lib/config';
export async function enrollCompanion(_:ManageState,form:FormData):Promise<ManageState>{
 if(process.env.REGISTRATION_ENABLED!=='true')return {error:'Cadastro temporariamente indisponível.'};
 const p=z.object({full_name:z.string().trim().min(2).max(160),email:z.email().max(254),password:z.string().min(10).max(128),terms:z.literal('on'),privacy:z.literal('on')}).safeParse(Object.fromEntries(form));if(!p.success)return {error:'Confira os dados e os consentimentos.'};const v=p.data,db=await supabaseServer();const r=await db.auth.signUp({email:v.email,password:v.password,options:{emailRedirectTo:`${appUrl()}/auth/callback`,data:{full_name:v.full_name,entry_mode:'companion',terms_version:'2026-09-06',privacy_version:'2026-09-06'}}});if(r.error)return {error:'Não foi possível criar a conta. Se já tem cadastro, entre ou recupere sua senha.'};return {success:'Confirme seu e-mail e depois abra novamente o link do convite para aceitá-lo.'};
}
export async function accept(token:string,_:ManageState):Promise<ManageState>{if(!/^[a-f0-9]{64}$/.test(token))return {error:'Convite inválido.'};const {db,user}=await requireUser();if(!user.email_confirmed_at)return {error:'Confirme seu e-mail antes de aceitar.'};const r=await db.rpc('accept_companion',{p_hash:createHash('sha256').update(token).digest('hex')});if(r.error)return {error:'O convite expirou, foi revogado ou pertence a outro e-mail.'};redirect('/acompanhante');}
