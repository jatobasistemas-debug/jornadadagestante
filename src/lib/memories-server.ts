import 'server-only';
import {notFound} from 'next/navigation';
import {z} from 'zod';
import {requireClinic} from './access';
import type {MemoryRecord} from './memories';
export async function ownedMemory(slug:string,id:string){
 if(!z.uuid().safeParse(id).success)notFound();
 const context=await requireClinic(slug,['patient']);
 const result=await context.db.from('private_memories').select('id,category,body,occurred_on,gestational_week,storage_path,pregnancy_id')
 .eq('id',id).eq('user_id',context.user.id).eq('clinic_id',context.clinic.id).maybeSingle();
 if(result.error)throw new Error('Não foi possível carregar sua memória.');
 if(!result.data)notFound();
 return {...context,memory:result.data as MemoryRecord};
}
