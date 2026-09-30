'use server';
import {requireClinic} from '@/lib/access';
import {revalidatePath} from 'next/cache';
import type {ManageState} from '@/app/gestao/actions';
export async function preferences(slug:string,_:ManageState,form:FormData):Promise<ManageState>{const {db,user}=await requireClinic(slug,['patient']);const r=await db.from('communication_preferences').upsert({user_id:user.id,weekly_email:form.get('weekly_email')==='on',version:'2026-09-20'});if(r.error)return {error:'Não foi possível atualizar sua preferência.'};revalidatePath(`/${slug}/gestante/comunicacoes`);return {success:'Preferência registrada. Você pode mudar quando quiser.'};}
