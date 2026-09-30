'use server';
import {requireUser} from '@/lib/access';
import {revalidatePath} from 'next/cache';
import type {ManageState} from '@/app/gestao/actions';
export async function cancelAccess(_:ManageState,form:FormData):Promise<ManageState>{
 const {db}=await requireUser();if(form.get('confirm')!=='on')return {error:'Confirme o encerramento do acesso.'};
 const r=await db.rpc('cancel_my_access');if(r.error)return {error:'Não foi possível encerrar o acesso.'};
 revalidatePath('/assinatura');return {success:'Acesso encerrado. Seus registros continuam disponíveis para leitura, download e exclusão. Nenhuma transação financeira foi realizada.'};
}
