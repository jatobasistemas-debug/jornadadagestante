import 'server-only';
import {requireClinic} from './access';
import {gestation} from './gestation';

// Mesmas leituras da Home, compartilhadas com a tela semanal. Sem service role.
export async function patientJourney(slug: string) {
  const {db, user, clinic} = await requireClinic(slug, ['patient']);
  const [profile, pregnancies, services] = await Promise.all([
    db.from('profiles').select('full_name,preferred_name').eq('user_id', user.id).single(),
    db.from('pregnancies').select('id,due_date,status').eq('user_id', user.id).filter('clinic_id',clinic.id===null?'is':'eq',clinic.id??'null').order('created_at', {ascending: false}),
    db.from('clinic_services').select('id,name,booking_url').filter('clinic_id',clinic.id===null?'is':'eq',clinic.id??'null').eq('active', true).order('name'),
  ]);
  if (profile.error || pregnancies.error || services.error) throw new Error('Não foi possível carregar seu espaço. Tente novamente.');
  const active = pregnancies.data.find(p => p.status === 'active');
  const age = active ? gestation(active.due_date) : null;
  const name = profile.data.preferred_name?.trim() || profile.data.full_name.trim().split(/\s+/)[0];
  const latest=pregnancies.data[0];
  const birth=latest?.status==='completed'?await db.from('birth_records').select('born_at,name').eq('pregnancy_id',latest.id).eq('user_id',user.id).maybeSingle():null;
  if(birth?.error)throw new Error('Não foi possível carregar sua Jornada.');
  return {clinic, active, age, name, birth:birth?.data??null, services: services.data};
}
