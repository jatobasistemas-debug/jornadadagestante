'use server';
import {randomBytes} from 'node:crypto';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {requireClinic,requireSuperadmin} from '@/lib/access';
import {defaultTheme} from '@/lib/theme';
import {adminCatalog,adminValues,type AdminKind} from '@/lib/admin-catalog';
export type ManageState={error?:string;success?:string};
export async function manage(scope:string,kind:AdminKind,id:string|null,_:ManageState,form:FormData):Promise<ManageState>{
 if(!Object.hasOwn(adminCatalog,kind))return {error:'Área inválida.'};
 const def=adminCatalog[kind];
 const ctx=scope==='jatoba'?{...await requireSuperadmin(),clinic:undefined}:await requireClinic(scope,['clinic_admin']);
 if(def.superOnly&&scope!=='jatoba')return {error:'Acesso não permitido.'};
 const clinicId=scope==='jatoba'?String(form.get('clinic_id')??''):(ctx.clinic?.id??null);
 if(!def.superOnly&&!z.uuid().safeParse(clinicId).success)return {error:'Escolha a clínica.'};
 if(id&&!z.uuid().safeParse(id).success)return {error:'Registro inválido.'};
 if(form.get('operation')==='delete'){
  if(form.get('confirm')!=='on')return {error:'Confirme a exclusão.'};
  let query=ctx.db.from(def.table).delete().eq('id',id);if(!def.superOnly)query=query.eq('clinic_id',clinicId);
  const r=await query.select('id');if(r.error||r.data.length!==1)return {error:'Não foi possível excluir. Verifique se há vínculos; você também pode desativar.'};
 }else{
  let parsed;try{parsed=adminValues(kind,form);}catch{return {error:'Confira as datas.'};}
  if(!parsed.success)return {error:'Confira os campos, valores e datas.'};
  const data={...parsed.data,...(!def.superOnly?{clinic_id:clinicId}:{})};
  let query=id?ctx.db.from(def.table).update(parsed.data).eq('id',id):ctx.db.from(def.table).insert({...data,...(kind==='codes'?{code:randomBytes(8).toString('hex').toUpperCase()}:{})});
  if(id&&!def.superOnly)query=query.eq('clinic_id',clinicId);
  const r=await query.select('id');if(r.error||r.data.length!==1)return {error:'Não foi possível salvar. Confira os vínculos e valores únicos.'};
 }
 revalidatePath('/','layout');return {success:'Alteração salva.'};
}
export async function createClinic(_:ManageState,form:FormData):Promise<ManageState>{
 const {db}=await requireSuperadmin();const p=z.object({name:z.string().trim().min(2).max(160),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/)}).safeParse(Object.fromEntries(form));
 if(!p.success||p.data.slug==='pessoal')return {error:'Confira o nome e o endereço.'};
 const r=await db.rpc('create_clinic',{p_name:p.data.name,p_slug:p.data.slug,p_tokens:defaultTheme});if(r.error)return {error:'Não foi possível criar. Confira se o endereço já está em uso.'};revalidatePath('/jatoba');return {success:'Clínica criada como pendente. Configure os dados antes de ativar.'};
}
export async function updateClinic(id:string,_:ManageState,form:FormData):Promise<ManageState>{
 const {db}=await requireSuperadmin();const p=z.object({name:z.string().trim().min(2).max(160),status:z.enum(['pending','active','suspended']),cnpj:z.string().trim().max(30),monthly_cents:z.coerce.number().int().min(0),payment_status:z.enum(['paid','pending','suspended']),renewal_date:z.union([z.literal('').transform(()=>null),z.iso.date()])}).safeParse(Object.fromEntries(form));
 if(!p.success)return {error:'Confira os dados da clínica.'};const r=await db.from('clinics').update(p.data).eq('id',id).select('id').single();if(r.error)return {error:'Não foi possível salvar.'};revalidatePath('/','layout');return {success:'Clínica atualizada.'};
}
export async function setFlag(scope:string,_:ManageState,form:FormData):Promise<ManageState>{
 const ctx=scope==='jatoba'?{...await requireSuperadmin(),clinic:undefined}:await requireClinic(scope,['clinic_admin']);
 const key=String(form.get('key')),enabled=form.get('enabled')==='on';
 const r=scope==='jatoba'?await ctx.db.from('feature_flags').update({enabled}).eq('key',key).select('key').single():await ctx.db.from('clinic_feature_flags').upsert({clinic_id:ctx.clinic?.id??null,key,enabled}).select('key').single();
 if(r.error)return {error:'Não foi possível configurar o módulo.'};revalidatePath('/','layout');return {success:'Módulo atualizado. A configuração global também precisa permitir seu uso.'};
}
export async function staff(scope:string,_:ManageState,form:FormData):Promise<ManageState>{
 const {db,clinic}=await requireClinic(scope,['clinic_admin']);const user=String(form.get('user_id'));const role=String(form.get('role'));
 if(!z.uuid().safeParse(user).success||!['clinic_admin','clinic_staff'].includes(role))return {error:'Confira o identificador e o papel.'};
 const r=await db.rpc('set_staff_membership',{p_clinic_id:clinic.id,p_user_id:user,p_role:role,p_active:form.get('active')==='on'});
 if(r.error)return {error:'Não foi possível alterar. A conta precisa existir e não pode ser uma gestante desta clínica.'};revalidatePath(`/${scope}/clinica`);return {success:'Equipe atualizada.'};
}
export async function setSubscription(_:ManageState,form:FormData):Promise<ManageState>{
 const {db}=await requireSuperadmin();const p=z.object({user_id:z.uuid(),status:z.enum(['trial','active','sponsored','past_due','cancelled','expired']),plan_id:z.union([z.literal(''),z.uuid()]),sponsor_id:z.union([z.literal(''),z.uuid()]),ends_at:z.union([z.literal(''),z.iso.date()])}).safeParse(Object.fromEntries(form));
 if(!p.success)return {error:'Confira os dados do acesso.'};const v=p.data;
 const r=await db.rpc('set_access',{p_user:v.user_id,p_status:v.status,p_plan:v.plan_id||null,p_sponsor:v.sponsor_id||null,p_end:v.ends_at?`${v.ends_at}T23:59:59Z`:null});if(r.error)return {error:'Não foi possível alterar. Confira plano, patrocinador e validade.'};revalidatePath('/jatoba');return {success:'Acesso administrativo atualizado e registrado no histórico. Isso não registra pagamento.'};
}
