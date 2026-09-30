'use server';
import {randomBytes,createHash} from 'node:crypto';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {requireFeature} from '@/lib/features';
import {ownedMemory} from '@/lib/memories-server';
import {requireClinic} from '@/lib/access';
import {appUrl} from '@/lib/config';
import {emailProvider} from '@/lib/email-provider';
import {companionEmail} from '@/lib/email-templates';
import type {ManageState} from '@/app/gestao/actions';
export async function capsule(slug:string,id:string,_:ManageState,form:FormData):Promise<ManageState>{
 const {db,user}=await ownedMemory(slug,id);let result;
 if(form.get('operation')==='delete')result=await db.from('time_capsules').delete().eq('memory_id',id).eq('user_id',user.id);
 else{const p=z.object({recipient:z.string().trim().max(160),opens_on:z.union([z.literal(''),z.iso.date()])}).safeParse(Object.fromEntries(form));if(!p.success)return {error:'Confira destinatário e data.'};const existing=await db.from('time_capsules').select('memory_id').eq('memory_id',id).eq('user_id',user.id).maybeSingle();if(existing.error)return {error:'Não foi possível carregar a cápsula.'};const values={recipient:p.data.recipient||null,opens_on:p.data.opens_on||null};result=existing.data?await db.from('time_capsules').update(values).eq('memory_id',id).eq('user_id',user.id):await db.from('time_capsules').insert({...values,memory_id:id,user_id:user.id});}
 if(result.error)return {error:'Não foi possível guardar esta configuração.'};revalidatePath(`/${slug}/gestante`,'layout');return {success:form.get('operation')==='delete'?'Cápsula cancelada. O registro foi preservado.':'Guardado para o futuro. Você pode ler e editar; o acompanhante só terá acesso após a data e se houver compartilhamento explícito.'};
}
export async function invite(slug:string,_:ManageState,form:FormData):Promise<ManageState>{
 const {db,user,clinic}=await requireFeature(slug,'companion');const email=z.email().max(254).safeParse(String(form.get('email')??'').trim().toLowerCase());if(!email.success||email.data===user.email)return {error:'Informe o e-mail da pessoa que deseja convidar.'};
 const pregnancy=await db.from('pregnancies').select('id').eq('user_id',user.id).filter('clinic_id',clinic.id===null?'is':'eq',clinic.id??'null').order('created_at',{ascending:false}).limit(1).single();if(pregnancy.error)return {error:'Não há uma Jornada disponível.'};
 const token=randomBytes(32).toString('hex');const r=await db.from('companion_invites').insert({pregnancy_id:pregnancy.data.id,user_id:user.id,email:email.data,token_hash:createHash('sha256').update(token).digest('hex')});
 if(r.error)return {error:'Não foi possível convidar. Revogue o convite anterior antes de criar outro.'};revalidatePath(`/${slug}/gestante/acompanhante`);const link=`${appUrl()}/acompanhante/convite?token=${token}`;const provider=emailProvider();if(provider){try{await provider.send({to:email.data,...companionEmail(link),key:`companion-${createHash('sha256').update(token).digest('hex')}`});return {success:'Convite enviado por e-mail, válido por 7 dias.'};}catch{console.error({event:'companion_email_failed',code:'EMAIL_DELIVERY_FAILED'});}}return {success:`Convite criado, mas o e-mail não foi enviado. Envie este link somente à pessoa convidada, válido por 7 dias: ${link}`};
}
export async function revokeInvite(slug:string,id:string,_:ManageState):Promise<ManageState>{const {db,user}=await requireFeature(slug,'companion');const r=await db.from('companion_invites').update({status:'revoked'}).eq('id',id).eq('user_id',user.id).select('id').single();if(r.error)return {error:'Não foi possível revogar.'};revalidatePath(`/${slug}/gestante/acompanhante`);return {success:'Convite e acesso revogados.'};}
export async function share(slug:string,id:string,_:ManageState,form:FormData):Promise<ManageState>{
 await requireFeature(slug,'companion');const {db,user,memory}=await ownedMemory(slug,id);
 if(form.get('shared')!=='on'){const r=await db.from('memory_shares').delete().eq('memory_id',id).eq('user_id',user.id);if(r.error)return {error:'Não foi possível retirar o compartilhamento.'};}
 else{const invitation=await db.from('companion_invites').select('id').eq('user_id',user.id).eq('pregnancy_id',memory.pregnancy_id).eq('status','accepted').single();if(invitation.error)return {error:'É necessário ter um acompanhante com convite aceito.'};const existing=await db.from('memory_shares').select('memory_id').eq('memory_id',id).eq('user_id',user.id).maybeSingle();if(existing.error)return {error:'Não foi possível carregar as permissões.'};const r=existing.data?await db.from('memory_shares').update({invitation_id:invitation.data.id}).eq('memory_id',id).eq('user_id',user.id):await db.from('memory_shares').insert({memory_id:id,user_id:user.id,invitation_id:invitation.data.id});if(r.error)return {error:'Não foi possível compartilhar.'};}
 revalidatePath(`/${slug}/gestante/memorias/${id}`);return {success:'Permissão de compartilhamento atualizada.'};
}
export async function birth(slug:string,_:ManageState,form:FormData):Promise<ManageState>{
 const {db,user}=await requireFeature(slug,'postpartum');const p=z.object({pregnancy_id:z.uuid(),born_at:z.string().datetime({offset:true}),name:z.string().max(160),sex:z.enum(['female','male','not_informed']),weight_grams:z.union([z.literal('').transform(()=>null),z.coerce.number().int().min(100).max(10000)]),length_cm:z.union([z.literal('').transform(()=>null),z.coerce.number().min(10).max(100)]),note:z.string().max(2000),photo_memory_id:z.union([z.literal('').transform(()=>null),z.uuid()])}).safeParse({...Object.fromEntries(form),born_at:String(form.get('born_at'))+':00-03:00'});
 if(!p.success||new Date(p.data.born_at)>new Date())return {error:'Confira a data e os campos opcionais.'};
 const existing=await db.from('birth_records').select('pregnancy_id').eq('pregnancy_id',p.data.pregnancy_id).eq('user_id',user.id).maybeSingle();if(existing.error)return {error:'Não foi possível carregar o nascimento.'};const {pregnancy_id,...values}=p.data;const r=existing.data?await db.from('birth_records').update(values).eq('pregnancy_id',pregnancy_id).eq('user_id',user.id):await db.from('birth_records').insert({...values,pregnancy_id,user_id:user.id});if(r.error)return {error:'Não foi possível guardar o nascimento.'};revalidatePath(`/${slug}/gestante`,'layout');return {success:'Nascimento registrado. Sua Jornada agora acompanha o pós-parto.'};
}
export async function saveBook(slug:string,_:ManageState,form:FormData):Promise<ManageState>{
 const {db}=await requireFeature(slug,'book');const title=z.string().trim().min(1).max(160).safeParse(form.get('title'));
 const birthId=String(form.get('birth_pregnancy_id')??'');const bookId=String(form.get('book_id')??'');if((birthId&&!z.uuid().safeParse(birthId).success)||(bookId&&!z.uuid().safeParse(bookId).success))return {error:'Seleção inválida.'};
 const selected=form.getAll('memory_id').map(String);if(!title.success||(!selected.length&&!birthId)||selected.length>100||!selected.every(id=>z.uuid().safeParse(id).success))return {error:'Escolha de 1 a 100 registros e um título.'};
 selected.sort((a,b)=>Number(form.get(`position_${a}`)??0)-Number(form.get(`position_${b}`)??0));
 const r=await db.rpc('save_book_selection',{p_book:bookId||null,p_title:title.data,p_memories:selected,p_birth:birthId||null});if(r.error)return {error:'Não foi possível criar o livro. Confira se todos os registros ainda estão disponíveis.'};revalidatePath(`/${slug}/gestante/livro`);return {success:'Seleção guardada. Seu livro está disponível abaixo para baixar.'};
}
export async function removeBook(slug:string,id:string,_:ManageState,form:FormData):Promise<ManageState>{const {db,user}=await requireFeature(slug,'book');if(form.get('confirm')!=='on')return {error:'Confirme a exclusão da seleção.'};const r=await db.from('journey_books').delete().eq('id',id).eq('user_id',user.id).select('id').single();if(r.error)return {error:'Não foi possível excluir.'};revalidatePath(`/${slug}/gestante/livro`);return {success:'Livro excluído. Os registros originais foram preservados.'};}
export async function removeBirth(slug:string,id:string,_:ManageState,form:FormData):Promise<ManageState>{const {db,user}=await requireFeature(slug,'postpartum');if(form.get('confirm')!=='on')return {error:'Confirme a remoção do nascimento.'};const r=await db.from('birth_records').delete().eq('pregnancy_id',id).eq('user_id',user.id).select('pregnancy_id').single();if(r.error)return {error:'Não foi possível remover. Confira se há outra gestação ativa.'};revalidatePath(`/${slug}/gestante`,'layout');return {success:'Nascimento removido. Seus demais registros foram preservados.'};}
