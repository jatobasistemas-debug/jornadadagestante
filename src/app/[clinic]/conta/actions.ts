 'use server';
import {requireClinic} from '@/lib/access';import {deletionAdmin} from '@/lib/supabase/admin';import {redirect} from 'next/navigation';import type {ActionState} from '@/app/auth/actions';
export async function deleteAccount(slug:string,_:ActionState,form:FormData):Promise<ActionState>{
 const {db,user}=await requireClinic(slug,['patient']);
 if(form.get('confirm')!=='on')return {error:'Confirme que deseja excluir sua conta e os registros.'};
 const password=String(form.get('password')||'');if(!password||password.length>128||!user.email)return {error:'Confirme sua senha.'};
 const verified=await db.auth.signInWithPassword({email:user.email,password});
 if(verified.error||verified.data.user?.id!==user.id)return {error:'Não foi possível confirmar sua senha.'};
 if(!process.env.SUPABASE_SERVICE_ROLE_KEY)return {error:'A exclusão de conta ainda está sendo configurada.'};
 const admin=deletionAdmin();
 const [roles,superRole]=await Promise.all([admin.from('clinic_memberships').select('role').eq('user_id',user.id),admin.from('superadmins').select('user_id').eq('user_id',user.id)]);
 if(roles.error||superRole.error)return {error:'Não foi possível verificar sua conta. Tente novamente.'};
 if(superRole.data.length||roles.data.some(r=>r.role!=='patient'))return {error:'Uma conta com acesso administrativo precisa encerrar esses vínculos antes da exclusão.'};
 const pregnancies=await admin.from('pregnancies').select('id,clinic_id').eq('user_id',user.id);
 if(pregnancies.error)return {error:'Não foi possível preparar a exclusão.'};
 // All privileged storage operations are scoped to the freshly reauthenticated owner.
 // Remove objects before Auth deletion, as Supabase refuses deletion while objects remain.
 for(const pregnancy of pregnancies.data){
  const prefix=`${pregnancy.clinic_id}/${user.id}/${pregnancy.id}`;
  for(;;){
   const listed=await admin.storage.from('private-memories').list(prefix,{limit:1000,offset:0});
   if(listed.error)return {error:'A remoção dos arquivos não terminou. Tente novamente para continuar.'};
   if(!listed.data.length)break;
   if(listed.data.some(file=>!file.id))return {error:'Há arquivos que precisam de revisão antes da exclusão.'};
   const removed=await admin.storage.from('private-memories').remove(listed.data.map(file=>`${prefix}/${file.name}`));
   if(removed.error)return {error:'A remoção dos arquivos não terminou. Tente novamente para continuar.'};
  }
 }
 // Avatars are separate private objects and must be removed before deleting Auth.
 for(;;){
  const list=await admin.storage.from('avatars').list(user.id,{limit:1000,offset:0});
  if(list.error)return {error:'Não foi possível remover sua foto. Tente novamente.'};
  if(!list.data.length)break;
  if(list.data.some(file=>!file.id))return {error:'Há arquivos que precisam de revisão antes da exclusão.'};
  const removed=await admin.storage.from('avatars').remove(list.data.map(file=>`${user.id}/${file.name}`));
  if(removed.error)return {error:'Não foi possível remover sua foto. Tente novamente.'};
 }
 const audit=await admin.from('audit_logs').insert({actor_id:user.id,action:'ACCOUNT_DELETE_REQUESTED',entity:'auth.users'});
 if(audit.error)return {error:'Não foi possível registrar a exclusão. Tente novamente.'};
 const deleted=await admin.auth.admin.deleteUser(user.id);
 if(deleted.error)return {error:'A exclusão não terminou. Tente novamente para continuar.'};
 await db.auth.signOut();redirect('/?conta=excluida');
}
