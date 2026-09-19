import Link from 'next/link';
import {PatientShell} from '@/components/patient-shell';
import {JourneyRecordForm} from '@/components/journey-record-form';
import {journalContext} from '@/lib/journey-records-server';
import {journeyToday} from '@/lib/journey-records';
export const metadata={title:'Novo registro | Jornada da Gestante'};
export default async function NewJournalRecord({params}:{params:Promise<{clinic:string}>}) {
  const {clinic:slug}=await params;
  const {clinic,pregnancy}=await journalContext(slug);
  return <PatientShell clinic={clinic} current="gestante/jornada"><main id="conteudo" className="journey-page journey-compose">
    <Link className="week-back" href={`/${slug}/gestante/jornada`}>← Minha Jornada</Link>
    <section className="journey-opening"><p className="eyebrow">Para guardar</p><h1>Algumas palavras<br/>sobre este momento.</h1><p>Não precisa ser uma grande história. Pode ser algo simples, só seu.</p></section>
    {pregnancy?<JourneyRecordForm slug={slug} dueDate={pregnancy.due_date} today={journeyToday()} recordId={crypto.randomUUID()}/>:<p className="message">Não há uma gestação ativa para novos registros. Seus registros anteriores continuam guardados na Minha Jornada.</p>}
  </main></PatientShell>;
}
