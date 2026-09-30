import 'server-only';
import {requireClinic} from './access';

export async function journalContext(slug:string) {
  const context=await requireClinic(slug,['patient']);
  const pregnancy=await context.db.from('pregnancies').select('id,due_date')
    .filter('clinic_id',context.clinic.id===null?'is':'eq',context.clinic.id??'null').eq('user_id',context.user.id).in('status',['active','completed']).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(pregnancy.error) throw new Error('Não foi possível carregar sua Jornada. Tente novamente.');
  return {...context,pregnancy:pregnancy.data};
}
