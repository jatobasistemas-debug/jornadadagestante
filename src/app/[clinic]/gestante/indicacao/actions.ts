'use server';
import {randomBytes} from 'node:crypto';
import {requireFeature} from '@/lib/features';
import {revalidatePath} from 'next/cache';
import type {ManageState} from '@/app/gestao/actions';
export async function createReferral(slug:string,_:ManageState):Promise<ManageState>{const {db,user}=await requireFeature(slug,'referrals');const r=await db.from('referral_codes').insert({user_id:user.id,code:randomBytes(12).toString('hex')});if(r.error&&r.error.code!=='23505')return {error:'Não foi possível criar seu link.'};revalidatePath(`/${slug}/gestante/indicacao`);return {success:'Seu link está disponível.'};}
