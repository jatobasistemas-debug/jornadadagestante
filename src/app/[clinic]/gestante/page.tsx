import {requireClinic} from '@/lib/access';
import {PatientShell} from '@/components/patient-shell';
import {gestation} from '@/lib/gestation';
import {homeWeeks} from '@/content/home-weeks';
export default async function Patient({params}:{params:Promise<{clinic:string}>}){
 const {clinic:slug}=await params;const {db,user,clinic}=await requireClinic(slug,['patient']);
 const [profile,pregnancies,services]=await Promise.all([
  db.from('profiles').select('full_name,preferred_name').eq('user_id',user.id).single(),
  db.from('pregnancies').select('due_date,status').eq('user_id',user.id).eq('clinic_id',clinic.id).order('created_at',{ascending:false}),
  db.from('clinic_services').select('id,name').eq('clinic_id',clinic.id).eq('active',true).order('name'),
 ]);
 if(profile.error||pregnancies.error||services.error)throw new Error('Não foi possível carregar seu espaço. Tente novamente.');
 const active=pregnancies.data.find(p=>p.status==='active');const age=active?gestation(active.due_date):null;
 const copy=age?homeWeeks[age.week]:undefined;
 const related=services.data.filter(s=>(copy?.services??['Obstetrícia']).includes(s.name));
 const name=profile.data.preferred_name?.trim()||profile.data.full_name.trim().split(/\s+/)[0];
 return <PatientShell clinic={clinic} current="gestante"><main id="conteudo" className="patient-home">
  <section className="home-welcome"><p className="eyebrow">Sua jornada, no seu tempo</p><h1>Olá, {name}.</h1><p className="home-lead">{age?`Vocês chegaram à semana ${age.week}.`:'Um espaço para o seu momento.'}</p><p className="muted">Um dia de cada vez. Há espaço para tudo o que você sente.</p></section>
  <section className="home-progress" aria-label="Seu momento na gestação">{age?<><div className="progress-heading"><div><p className="eyebrow">Hoje, na sua jornada</p><p className="week-number"><strong>{age.week}</strong> semanas <small>e {age.day} {age.day===1?'dia':'dias'}</small></p></div><span className="trimester">{age.trimester}º trimestre</span></div><div className="progress-label"><span>{age.week} de 40 semanas</span><span>Cada história tem seu tempo</span></div><progress value={age.progress} max={100} aria-label="Progresso estimado da gestação" aria-valuetext={`${age.week} semanas e ${age.day} dias, referência de 40 semanas`}/><p className="form-note">Data prevista do parto: {new Date(active!.due_date+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'})}. Uma estimativa, não um prazo.</p></>:<><h2>Você não precisa ter pressa.</h2><p>{active?'Converse com sua clínica para conferir a data registrada. Não foi possível calcular a semana com segurança.':'Sem gestação ativa no momento. Seu perfil e suas informações de privacidade continuam disponíveis.'}</p></>}</section>
  <div className="home-heading"><h2>Um olhar para esta semana</h2><span>Para ler com calma</span></div>
  <div className="home-grid">
   <section className="home-card baby-card"><p className="eyebrow">01 · Seu bebê</p><h2>Pequenas mudanças,<br/>uma grande história.</h2><p>{copy?.baby??'O conteúdo desta semana está sendo preparado com cuidado. Seu pré-natal é o espaço para conversar sobre o desenvolvimento do bebê.'}</p>{copy&&<a className="home-source" href={copy.source} target="_blank" rel="noreferrer">Fonte: NHS · Semana {age!.week} (em inglês) ↗</a>}</section>
   <section className="home-card"><p className="eyebrow">02 · Você</p><h2>Seu tempo também<br/>merece cuidado.</h2><p>{copy?.you??'Você não precisa viver este momento de um jeito específico. Leve suas dúvidas e o que tem sentido para a conversa com sua equipe.'}</p><p className="home-note">Não há uma lista de sensações que você precise cumprir.</p></section>
   <section className="home-card observe-card"><p className="eyebrow">03 · Para observar</p><h2>Escute o seu momento.</h2>{age&&age.week>=16?<><p>Os primeiros movimentos costumam ser percebidos entre 16 e 24 semanas. Se ainda não os percebeu até a semana 24, converse com a equipe do pré-natal.</p><p>Se o bebê se movimentar menos, parar de se movimentar ou mudar seu padrão habitual, procure sua equipe ou maternidade imediatamente. Não espere até o dia seguinte.</p><a className="home-source" href="https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/" target="_blank" rel="noreferrer">Fonte: NHS · Movimentos do bebê (em inglês) ↗</a></>:<p>Alguma mudança trouxe preocupação? Converse com a equipe do pré-natal. Você não precisa descobrir sozinha o que ela significa.</p>}<p className="home-note">Informação educativa, sem diagnóstico. Não substitui atendimento profissional.</p></section>
   <section className="home-card keep-card"><p className="eyebrow">04 · Para guardar</p><h2>{copy?.question??'O que você gostaria de lembrar destes dias?'}</h2><p>Uma frase, um gesto, um instante. Ou apenas viver o momento. Guardar uma memória é sempre uma escolha sua.</p><p className="home-note">Em breve, seu espaço privado para memórias.</p></section>
  </div>
  <section className="home-care"><div><p className="eyebrow">05 · Seu cuidado</p><h2>Perto de quem cuida.</h2><p>Conte com {clinic.name} para conversar sobre o cuidado que faz sentido para você.</p></div><div><p className="muted">Disponível na sua clínica</p>{related.length?<ul>{related.map(s=><li key={s.id}>{s.name}</li>)}</ul>:<p>A clínica ainda não cadastrou serviços relacionados a esta fase.</p>}<p className="form-note">A necessidade e o momento de cada atendimento são definidos com sua equipe.</p></div></section>
 </main></PatientShell>;
}
