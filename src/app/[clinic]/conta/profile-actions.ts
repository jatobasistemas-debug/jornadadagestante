'use server';
import {requireClinic} from '@/lib/access';
import {profileInput} from '@/lib/profile-input';
import {revalidatePath} from 'next/cache';
export async function saveProfile(slug:string,_:{error?:string;success?:string},form:FormData){
 const {db,user}=await requireClinic(slug,['patient']);
 const parsed=profileInput.safeParse({full_name:form.get('full_name'),preferred_name:form.get('preferred_name')??''});
 if(!parsed.success)return {error:'Confira seu nome e como gostaria de ser chamada.'};
 const result=await db.from('profiles').update({...parsed.data,preferred_name:parsed.data.preferred_name||null}).eq('user_id',user.id).select('user_id').single();
 if(result.error)return {error:'Não foi possível atualizar seu nome. Tente novamente.'};
 revalidatePath(`/${slug}/conta`);revalidatePath(`/${slug}/gestante`);
 return {success:'Seus dados foram atualizados.'};
}
