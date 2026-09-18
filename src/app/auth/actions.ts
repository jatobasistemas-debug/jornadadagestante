 'use server';
import {redirect} from 'next/navigation';
import {supabaseServer} from '@/lib/supabase/server';
import {loginSchema,signupSchema,passwordSchema} from '@/lib/validation';
import {appUrl,isConfigured} from '@/lib/config';
import {requireUser} from '@/lib/access';
import {signupDiagnostic} from '@/lib/auth-diagnostics';
export type ActionState={error?:string;success?:string};
export async function login(_:ActionState,form:FormData):Promise<ActionState>{
 const parsed=loginSchema.safeParse(Object.fromEntries(form));if(!parsed.success)return {error:'Confira o e-mail e a senha.'};
 if(!isConfigured())return {error:'O acesso ainda está sendo configurado.'};
 const db=await supabaseServer();const {error}=await db.auth.signInWithPassword(parsed.data);
 if(error)return {error:'Não foi possível entrar. Confira seus dados e a confirmação do e-mail.'};
 redirect('/acesso');
}
export async function signup(_:ActionState,form:FormData):Promise<ActionState>{
 if(process.env.REGISTRATION_ENABLED!=='true')return {error:'O cadastro ainda não foi liberado pela plataforma.'};
 const p=signupSchema.safeParse(Object.fromEntries(form));if(!p.success)return {error:p.error.issues[0]?.message==='Confira a data informada.'?'Confira a data informada.':'Confira os campos e os três aceites. A senha precisa ter ao menos 10 caracteres.'};
 const v=p.data;const db=await supabaseServer();
 const {error}=await db.auth.signUp({email:v.email,password:v.password,options:{emailRedirectTo:`${appUrl()}/auth/callback`,data:{full_name:v.full_name,clinic_slug:v.clinic_slug,[v.date_type]:v.date,terms_version:'2026-09-06',privacy_version:'2026-09-06',sensitive_consent:true}}});
 if(error){
  // Temporary server-side diagnostics; keep the public response generic.
  console.error(signupDiagnostic(error,[v.email,v.password,v.full_name,v.date]));
  return {error:'Não foi possível concluir o cadastro. Confira os dados ou tente novamente mais tarde.'};
 }
 return {success:'Confira sua caixa de entrada para confirmar o e-mail. Se já possui uma conta, entre ou recupere sua senha.'};
}
export async function recover(_:ActionState,form:FormData):Promise<ActionState>{
 const email=String(form.get('email')??'').trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||email.length>254)return {error:'Informe um e-mail válido.'};
 if(!isConfigured())return {error:'O acesso ainda está sendo configurado.'};
 const db=await supabaseServer();await db.auth.resetPasswordForEmail(email,{redirectTo:`${appUrl()}/auth/callback?next=/auth/nova-senha`});
 return {success:'Se houver uma conta com esse e-mail, você receberá as instruções de recuperação.'};
}
export async function updatePassword(_:ActionState,form:FormData):Promise<ActionState>{
 const p=passwordSchema.safeParse(form.get('password'));if(!p.success)return {error:'Use uma senha de 10 a 128 caracteres.'};
 if(form.get('confirmation')!==p.data)return {error:'As senhas precisam ser iguais.'};
 const {db}=await requireUser();const {error}=await db.auth.updateUser({password:p.data});
 if(error)return {error:'Não foi possível alterar sua senha. Solicite um novo link.'};
 redirect('/acesso');
}
export async function signOut(){if(isConfigured()){const db=await supabaseServer();const {error}=await db.auth.signOut();if(error)throw new Error('Não foi possível sair. Tente novamente.');}redirect('/');}
