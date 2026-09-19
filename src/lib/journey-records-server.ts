import 'server-only';
import {requireClinic} from './access';

export async function journalContext(slug:string) {
  const context=await requireClinic(slug,['patient']);
  const pregnancy=await context.db.from('pregnancies').select('id,due_date')
    .eq('clinic_id',context.clinic.id).eq('user_id',context.user.id).eq('status','active').maybeSingle();
  if(pregnancy.error) throw new Error('Não foi possível carregar sua Jornada. Tente novamente.');
  return {...context,pregnancy:pregnancy.data};
}
