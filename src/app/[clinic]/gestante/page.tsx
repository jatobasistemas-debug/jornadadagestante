import Link from 'next/link';
import {PatientShell} from '@/components/patient-shell';
import {GestationProgress} from '@/components/gestation-progress';
import {ContextualServices} from '@/components/contextual-services';
import {patientJourney} from '@/lib/patient-journey';
import {contextualServices} from '@/lib/contextual-services';
import {homeWeeks} from '@/content/home-weeks';
import {publishedWeek} from '@/content/gestation-weeks';
import {BabyDevelopmentMap} from '@/components/baby-development-map';
import {LatestMemory} from '@/components/latest-memory';
export default async function Patient({params}:{params:Promise<{clinic:string}>}){
 const {clinic:slug}=await params;const {clinic,active,age,name,services}=await patientJourney(slug);
 const copy=age?homeWeeks[age.week]:undefined;
 const related=contextualServices(services,copy?.services);
 const readingWeek=age&&publishedWeek(age.week)?age.week:20;
 return <PatientShell clinic={clinic} current="gestante"><main id="conteudo" className="patient-home">
  <section className="home-welcome"><p className="eyebrow">Sua jornada, no seu tempo</p><h1>Olá, {name}.</h1><p className="home-lead">{age?`Vocês chegaram à semana ${age.week}.`:'Um espaço para o seu momento.'}</p><p className="muted">Um dia de cada vez. Há espaço para tudo o que você sente.</p></section>
  <GestationProgress age={age} dueDate={active?.due_date} hasActive={Boolean(active)}/>
  {age&&<p className="week-home-link"><Link href={`/${slug}/gestante/semana/${readingWeek}`}>{age.week===readingWeek?'Ler sobre a sua semana':`Leitura disponível: semana ${readingWeek}`} <span aria-hidden="true">↗</span></Link></p>}
  {age&&<BabyDevelopmentMap currentWeek={age.week}/>}
  {age&&<><div className="home-heading"><h2>Um olhar para esta semana</h2><span>Para ler com calma</span></div>
  <div className="home-grid">
   <section className="home-card baby-card" aria-label="Seu bebê"><p className="eyebrow">01 · Seu bebê</p><h2>Pequenas mudanças,<br/>uma grande história.</h2><p>{copy?.baby??'O conteúdo desta semana está sendo preparado com cuidado. Seu pré-natal é o espaço para conversar sobre o desenvolvimento do bebê.'}</p>{copy&&<a className="home-source" href={copy.source} target="_blank" rel="noreferrer">Fonte: NHS · Semana {age!.week} (em inglês) ↗</a>}</section>
   <section className="home-card" aria-label="Você"><p className="eyebrow">02 · Você</p><h2>Seu tempo também<br/>merece cuidado.</h2><p>{copy?.you??'Você não precisa viver este momento de um jeito específico. Leve suas dúvidas e o que tem sentido para a conversa com sua equipe.'}</p><p className="home-note">Não há uma lista de sensações que você precise cumprir.</p></section>
   <section className="home-card observe-card" aria-label="Para observar"><p className="eyebrow">03 · Para observar</p><h2>Escute o seu momento.</h2>{age&&age.week>=16?<><p>Os primeiros movimentos costumam ser percebidos entre 16 e 24 semanas. Se ainda não os percebeu até a semana 24, converse com a equipe do pré-natal.</p><p>Se o bebê se movimentar menos, parar de se movimentar ou mudar seu padrão habitual, procure sua equipe ou maternidade imediatamente. Não espere até o dia seguinte.</p><a className="home-source" href="https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/" target="_blank" rel="noreferrer">Fonte: NHS · Movimentos do bebê (em inglês) ↗</a></>:<p>Alguma mudança trouxe preocupação? Converse com a equipe do pré-natal. Você não precisa descobrir sozinha o que ela significa.</p>}<p className="home-note">Informação educativa, sem diagnóstico. Não substitui atendimento profissional.</p></section>
   <section className="home-card keep-card" aria-label="Para guardar"><p className="eyebrow">04 · Para guardar</p><h2>{copy?.question??'O que você gostaria de lembrar destes dias?'}</h2><p>Uma frase, um gesto, um instante. Ou apenas viver o momento. Guardar uma memória é sempre uma escolha sua.</p><p className="home-note"><Link className="home-source" href={`/${slug}/gestante/jornada/novo`}>Guardar algumas palavras</Link></p></section>
  </div></>}
  <LatestMemory slug={slug}/>
  <section className="home-care" aria-label="Seu cuidado"><div><p className="eyebrow">05 · Seu cuidado</p><h2>Perto de quem cuida.</h2><p>Conte com {clinic.name} para conversar sobre o cuidado que faz sentido para você.</p></div><ContextualServices services={related} emptyMessage={age?'Não há serviços relacionados para exibir nesta semana.':'Seu perfil e suas informações de privacidade estão disponíveis no menu Perfil.'}/></section>
 </main></PatientShell>;
}
