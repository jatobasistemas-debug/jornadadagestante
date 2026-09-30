'use server';
import {signupSchema} from '@/lib/validation';
import {supabaseServer} from '@/lib/supabase/server';
import {appUrl} from '@/lib/config';
import {signupDiagnostic} from '@/lib/auth-diagnostics';
import type {ActionState} from '@/app/auth/actions';
import {requireUser} from '@/lib/access';
import {redirect} from 'next/navigation';
export async function enroll(_:ActionState,form:FormData):Promise<ActionState>{
 if(process.env.REGISTRATION_ENABLED!=='true')return {error:'Os cadastros estão temporariamente indisponíveis.'};
 const parsed=signupSchema.safeParse({...Object.fromEntries(form),clinic_slug:'validation-only'});
 if(!parsed.success)return {error:'Confira os dados, a data e os três consentimentos.'};
 const value=parsed.data,code=String(form.get('partner_code')??'').trim().toUpperCase();
 const plan=String(form.get('plan_code')??'');
 if(code&&!/^[A-Z0-9]{8,32}$/.test(code))return {error:'Confira o código do parceiro.'};
 if(!code&&!/^[a-z0-9_-]{2,40}$/.test(plan))return {error:'Escolha um plano disponível.'};
 const db=await supabaseServer();
 const {error}=await db.auth.signUp({email:value.email,password:value.password,options:{emailRedirectTo:`${appUrl()}/auth/callback`,data:{full_name:value.full_name,referral_code:/^[a-f0-9]{24}$/.test(String(form.get('referral_code')))?String(form.get('referral_code')):undefined,entry_mode:code?'partner':'direct',partner_code:code||undefined,plan_code:plan||undefined,[value.date_type]:value.date,terms_version:'2026-09-06',privacy_version:'2026-09-06',sensitive_consent:true}}});
 if(error){console.error(signupDiagnostic(error,[value.email,value.password,value.full_name,value.date,code]));return {error:'Não foi possível concluir. Confira os dados e a disponibilidade do acesso. Se já tem uma conta, entre para vincular o parceiro.'};}
 return {success:'Confira seu e-mail para confirmar a conta. Se você já tem cadastro, entre ou recupere sua senha.'};
}
export async function redeem(_:ActionState,form:FormData):Promise<ActionState>{
 const {db}=await requireUser();const code=String(form.get('code')??'').trim().toUpperCase();
 if(!/^[A-Z0-9]{8,32}$/.test(code))return {error:'Confira o código.'};
 const result=await db.rpc('redeem_partner',{p_code:code});
 if(result.error)return {error:'Código indisponível, expirado ou sem vagas. Nenhum vínculo foi alterado.'};
 redirect('/assinatura?parceiro=ativado');
}
