import Link from 'next/link';
import {notFound} from 'next/navigation';
import {patientJourney} from '@/lib/patient-journey';
import {parseWeek, publishedWeek} from '@/content/gestation-weeks';
import {contextualServices} from '@/lib/contextual-services';
import {PatientShell} from '@/components/patient-shell';
import {GestationWeekArticle} from '@/components/gestation-week-article';
import {supabaseServer} from '@/lib/supabase/server';
import {EditorialArticle} from '@/components/editorial-article';
import {WeekNavigation} from '@/components/week-navigation';

export const metadata = {title: 'Semana da Gestação'};

export default async function GestationWeek({params}: {params: Promise<{clinic: string; week: string}>}) {
  const {clinic: slug, week: requestedWeek} = await params;
  const week = parseWeek(requestedWeek);
  if (week === null) notFound();
  const {clinic, name, age, active, services} = await patientJourney(slug);
  const content = publishedWeek(week);
  const db=await supabaseServer();const editorial=await db.from('editorial_content').select('*').eq('kind','week').eq('week',week).eq('status','published').eq('review_status','approved').maybeSingle();
  if(editorial.error)throw new Error('Não foi possível carregar esta semana.');

  return <PatientShell clinic={clinic} current="gestante">{editorial.data?<main id="conteudo"><EditorialArticle entry={editorial.data}/></main>:content ?
    <GestationWeekArticle week={week} content={content} slug={slug} clinicName={clinic.name} name={name}
      age={age} dueDate={active?.due_date} hasActive={Boolean(active)} services={contextualServices(services, content.services)}/>
    : <main id="conteudo" className="week-page week-unavailable">
      <p className="week-label">Semana {week}</p><h1>Uma leitura em preparação.</h1>
      <p>O conteúdo completo desta semana ainda não está disponível. Você pode voltar ao início para acompanhar o seu momento.</p>
      <Link className="week-back" href={`/${slug}/gestante`}>Voltar ao início</Link>
    </main>
  }<WeekNavigation slug={slug} week={week} current={age?.week??null}/></PatientShell>;
}
