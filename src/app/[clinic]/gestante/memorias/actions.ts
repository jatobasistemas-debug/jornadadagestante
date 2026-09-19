'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {journalContext} from '@/lib/journey-records-server';
import {ownedMemory} from '@/lib/memories-server';
import {memoryInput,memoryValues,hasAttachment,ownedMemoryPath,validateMemoryFile} from '@/lib/memories';
export type MemoryState={error?:string};
function refresh(slug:string){revalidatePath(`/${slug}/gestante`,'layout');}
export async function saveMemory(slug:string,editing:string|null,_:MemoryState,form:FormData):Promise<MemoryState>{
 const parsed=memoryInput(form);if('error' in parsed)return {error:parsed.error};
 const value=parsed.data;
 if(editing){
  const {db,user,clinic,memory}=await ownedMemory(slug,editing);
  if(value.id!==editing||value.category!==memory.category)return {error:'O tipo deste registro não pode ser alterado.'};
  const pregnancy=await db.from('pregnancies').select('due_date').eq('id',memory.pregnancy_id).eq('user_id',user.id).eq('clinic_id',clinic.id).single();
  if(pregnancy.error)return {error:'Não foi possível conferir a gestação.'};
  const saved=await db.from('private_memories').update(memoryValues(value,pregnancy.data.due_date)).eq('id',editing).eq('user_id',user.id).eq('clinic_id',clinic.id).select('id').single();
  if(saved.error)return {error:'Não foi possível salvar. Seu texto continua aqui.'};
 }else{
  const {db,user,clinic,pregnancy}=await journalContext(slug);
  if(!pregnancy)return {error:'Não há uma gestação ativa para novos registros.'};
  const prior=await db.from('private_memories').select('id,body,category,occurred_on,pregnancy_id,storage_path').eq('id',value.id).eq('user_id',user.id).eq('clinic_id',clinic.id).maybeSingle();
  if(prior.error)return {error:'Não foi possível conferir o registro.'};
  if(prior.data&&((prior.data.body??'')!==value.body||prior.data.category!==value.category||prior.data.occurred_on!==value.date||prior.data.pregnancy_id!==pregnancy.id))return {error:'Este registro já existe. Abra-o em Memórias para editar.'};
  let path:string|null=null;
  let file:Awaited<ReturnType<typeof validateMemoryFile>>|undefined;
  if(hasAttachment(value.category)){
   try{file=await validateMemoryFile(form.get('file'),value.category);}catch(error){return {error:error instanceof Error?error.message:'Confira o arquivo.'};}
   path=`${clinic.id}/${user.id}/${pregnancy.id}/${value.id}.${file.extension}`;
  }
  if(prior.data&&prior.data.storage_path!==path)return {error:'Use o mesmo arquivo para concluir este envio.'};
  // Persist the owner-scoped reference BEFORE uploading: an interrupted upload
  // remains discoverable/deletable in Memórias, never an unreferenced object.
  if(!prior.data){
   const saved=await db.from('private_memories').insert({id:value.id,user_id:user.id,clinic_id:clinic.id,pregnancy_id:pregnancy.id,storage_path:path,...memoryValues(value,pregnancy.due_date)});
   if(saved.error)return {error:'Não foi possível guardar. Tente novamente; seu texto continua aqui.'};
  }
  if(path&&file){
   const upload=await db.storage.from('private-memories').upload(path,file.bytes,{contentType:file.type,upsert:false});
   if(upload.error){
    const existing=await db.storage.from('private-memories').download(path);
    if(existing.error)return {error:'O registro foi preservado, mas o arquivo não terminou de enviar. Selecione o mesmo arquivo e tente novamente, ou exclua o registro em Memórias.'};
   }
  }
 }
 refresh(slug);redirect(`/${slug}/gestante/memorias/${value.id}?guardado=1`);
}
export async function deleteMemory(slug:string,id:string,_:MemoryState,form:FormData):Promise<MemoryState>{
 const {db,user,clinic,memory}=await ownedMemory(slug,id);
 if(form.get('confirm')!=='on')return {error:'Confirme que deseja excluir este registro.'};
 if(memory.storage_path){
  if(!ownedMemoryPath(memory.storage_path,clinic.id,user.id,memory.pregnancy_id))return {error:'O arquivo precisa ser conferido antes da exclusão.'};
  const removed=await db.storage.from('private-memories').remove([memory.storage_path]);
  if(removed.error)return {error:'Não foi possível remover o arquivo. Tente novamente.'};
 }
 const removed=await db.from('private_memories').delete().eq('id',id).eq('user_id',user.id).eq('clinic_id',clinic.id).select('id').single();
 if(removed.error)return {error:'A exclusão não terminou. Tente novamente para continuar.'};
 refresh(slug);redirect(`/${slug}/gestante/memorias?excluida=1`);
}
