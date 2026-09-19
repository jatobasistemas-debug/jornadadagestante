'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {journalContext} from '@/lib/journey-records-server';
import {recordPayload,type RecordFormState} from '@/lib/journey-records';

export async function createJourneyRecord(slug:string,_previous:RecordFormState,form:FormData):Promise<RecordFormState> {
  const {db,user,clinic,pregnancy}=await journalContext(slug);
  if(!pregnancy) return {error:'Não há uma gestação ativa para vincular este registro. Seus registros anteriores continuam guardados.'};
  const result=recordPayload(form,{userId:user.id,clinicId:clinic.id,pregnancyId:pregnancy.id,dueDate:pregnancy.due_date});
  if(result.error) return {error:result.error};
  const payload=result.data!;
  const saved=await db.from('private_memories').insert(payload).select('id').single();
  if(saved.error) {
    // A retry after a lost response must not create a second copy. Never overwrite.
    if(saved.error.code!=='23505') return {error:'Não foi possível guardar agora. Seu texto continua aqui para tentar novamente.'};
    const existing=await db.from('private_memories').select('body,category,occurred_on,pregnancy_id')
      .eq('id',payload.id).eq('user_id',user.id).eq('clinic_id',clinic.id).maybeSingle();
    if(existing.error || !existing.data || existing.data.body!==payload.body || existing.data.category!==payload.category ||
       existing.data.occurred_on!==payload.occurred_on || existing.data.pregnancy_id!==payload.pregnancy_id)
      return {error:'Não foi possível confirmar este registro. Seu texto continua aqui.'};
  }
  revalidatePath(`/${slug}/gestante/jornada`);
  revalidatePath(`/${slug}/gestante/memorias`);
  revalidatePath(`/${slug}/gestante`);
  redirect(`/${slug}/gestante/jornada?guardado=1`);
}
