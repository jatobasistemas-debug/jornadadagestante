import 'server-only';
import {requireClinic} from './access';
import {gestation} from './gestation';

// Mesmas leituras da Home, compartilhadas com a tela semanal. Sem service role.
export async function patientJourney(slug: string) {
  const {db, user, clinic} = await requireClinic(slug, ['patient']);
  const [profile, pregnancies, services] = await Promise.all([
    db.from('profiles').select('full_name,preferred_name').eq('user_id', user.id).single(),
    db.from('pregnancies').select('due_date,status').eq('user_id', user.id).eq('clinic_id', clinic.id).order('created_at', {ascending: false}),
    db.from('clinic_services').select('id,name,booking_url').eq('clinic_id', clinic.id).eq('active', true).order('name'),
  ]);
  if (profile.error || pregnancies.error || services.error) throw new Error('Não foi possível carregar seu espaço. Tente novamente.');
  const active = pregnancies.data.find(p => p.status === 'active');
  const age = active ? gestation(active.due_date) : null;
  const name = profile.data.preferred_name?.trim() || profile.data.full_name.trim().split(/\s+/)[0];
  return {clinic, active, age, name, services: services.data};
}
