import Link from 'next/link';
import {PatientShell} from '@/components/patient-shell';
import {JourneyEmpty,JourneyTimeline} from '@/components/journey-timeline';
import {journalContext} from '@/lib/journey-records-server';
import {journeyPage,JOURNEY_PAGE_SIZE,timelineCategories,type JourneyRecord} from '@/lib/journey-records';
export const metadata={title:'Minha Jornada | Jornada da Gestante'};
export default async function Journal({params,searchParams}:{params:Promise<{clinic:string}>;searchParams:Promise<{pagina?:string;guardado?:string}>}) {
  const {clinic:slug}=await params;
  const query=await searchParams, page=journeyPage(query.pagina);
  const {db,user,clinic,pregnancy}=await journalContext(slug);
  const offset=(page-1)*JOURNEY_PAGE_SIZE;
  const result=await db.from('private_memories').select('id,category,body,occurred_on,gestational_week')
    .eq('user_id',user.id).eq('clinic_id',clinic.id).in('category',timelineCategories).is('storage_path',null)
    .order('occurred_on',{ascending:false}).order('created_at',{ascending:false}).order('id',{ascending:false})
    .range(offset,offset+JOURNEY_PAGE_SIZE);
  if(result.error) throw new Error('Não foi possível carregar seus registros. Tente novamente.');
  const records=result.data.slice(0,JOURNEY_PAGE_SIZE) as JourneyRecord[];
  const hasNext=result.data.length>JOURNEY_PAGE_SIZE;
  return <PatientShell clinic={clinic} current="gestante/jornada"><main id="conteudo" className="journey-page">
    <section className="journey-opening"><p className="eyebrow">Sua história, no seu tempo</p><h1>Minha Jornada</h1>
      <p className="journey-intro">Quer guardar algumas palavras sobre hoje?</p><p>Um espaço para o que você vive, sente e quer lembrar. Sem precisar registrar todos os dias.</p>
      {pregnancy&&<Link className="button" href={`/${slug}/gestante/jornada/novo`}>Novo registro</Link>}
      <p className="journey-privacy">Seus registros são privados. A clínica não tem acesso a eles.</p>
    </section>
    {query.guardado==='1'&&<p className="message" role="status">Seu registro foi guardado, só para você.</p>}
    {records.length>0?<JourneyTimeline records={records}/>:page===1?<JourneyEmpty hasActive={Boolean(pregnancy)}/>:<p className="journey-empty">Não há mais registros nesta página.</p>}
    {(page>1||hasNext)&&<nav className="journey-pagination" aria-label="Páginas da sua Jornada">
      {page>1&&<Link href={`/${slug}/gestante/jornada?pagina=${page-1}`}>Registros mais recentes</Link>}
      {hasNext&&<Link href={`/${slug}/gestante/jornada?pagina=${page+1}`}>Registros anteriores</Link>}
    </nav>}
  </main></PatientShell>;
}
