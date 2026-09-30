import Link from 'next/link';
import {z} from 'zod';
import {recordLabel} from '@/lib/journey-records';
import {PatientShell} from '@/components/patient-shell';
import {JourneyEmpty,JourneyTimeline} from '@/components/journey-timeline';
import {journalContext} from '@/lib/journey-records-server';
import {journeyPage,JOURNEY_PAGE_SIZE,timelineCategories,type JourneyRecord} from '@/lib/journey-records';
export const metadata={title:'Minha Jornada'};
export default async function Journal({params,searchParams}:{params:Promise<{clinic:string}>;searchParams:Promise<{pagina?:string;guardado?:string;tipo?:string;semana?:string;de?:string;ate?:string;ordem?:string}>}) {
  const {clinic:slug}=await params;
  const query=await searchParams, page=journeyPage(query.pagina);
  const {db,user,clinic,pregnancy}=await journalContext(slug);
  const offset=(page-1)*JOURNEY_PAGE_SIZE;
  const kind=timelineCategories.includes(query.tipo??'')?query.tipo:null,week=z.coerce.number().int().min(0).max(42).safeParse(query.semana),from=z.iso.date().safeParse(query.de),to=z.iso.date().safeParse(query.ate),ascending=query.ordem==='antigos';
  let request=db.from('private_memories').select('id,category,body,occurred_on,gestational_week')
    .eq('user_id',user.id).filter('clinic_id',clinic.id===null?'is':'eq',clinic.id??'null').in('category',timelineCategories)
    .order('occurred_on',{ascending}).order('created_at',{ascending}).order('id',{ascending});
  if(kind)request=request.eq('category',kind);if(query.semana&&week.success)request=request.eq('gestational_week',week.data);if(from.success)request=request.gte('occurred_on',from.data);if(to.success)request=request.lte('occurred_on',to.data);
  const result=await request.range(offset,offset+JOURNEY_PAGE_SIZE);
  const pageLink=(value:number)=>{const qs=new URLSearchParams();for(const key of ['tipo','semana','de','ate','ordem'] as const)if(query[key])qs.set(key,query[key]!);qs.set('pagina',String(value));return `/${slug}/gestante/jornada?${qs}`;};
  if(result.error) throw new Error('Não foi possível carregar seus registros. Tente novamente.');
  const records=result.data.slice(0,JOURNEY_PAGE_SIZE) as JourneyRecord[];
  const hasNext=result.data.length>JOURNEY_PAGE_SIZE;
  return <PatientShell clinic={clinic} current="gestante/jornada"><main id="conteudo" className="journey-page">
    <section className="journey-opening"><p className="eyebrow">Sua história, no seu tempo</p><h1>Minha Jornada</h1>
      <p className="journey-intro">Quer guardar algumas palavras sobre hoje?</p><p>Um espaço para o que você vive, sente e quer lembrar. Sem precisar registrar todos os dias.</p>
      {pregnancy&&<Link className="button" href={`/${slug}/gestante/jornada/novo`}>Novo registro</Link>}
      <p className="journey-privacy">Seus registros são privados. A clínica não tem acesso a eles.</p>
    </section>
    <form className="form"><label>Tipo<select name="tipo" defaultValue={kind??''}><option value="">Todos</option>{timelineCategories.map(k=><option key={k} value={k}>{recordLabel(k)}</option>)}</select></label><label>Semana gestacional<input name="semana" type="number" min={0} max={42} defaultValue={query.semana}/></label><label>De<input name="de" type="date" defaultValue={query.de}/></label><label>Até<input name="ate" type="date" defaultValue={query.ate}/></label><label>Ordem<select name="ordem" defaultValue={ascending?'antigos':'recentes'}><option value="recentes">Mais recentes primeiro</option><option value="antigos">Mais antigos primeiro</option></select></label><button>Filtrar registros</button><Link href={`/${slug}/gestante/jornada`}>Limpar filtros</Link></form>
    {query.guardado==='1'&&<p className="message" role="status">Seu registro foi guardado, só para você.</p>}
    {records.length>0?<JourneyTimeline records={records} slug={slug}/>:page===1?<JourneyEmpty hasActive={Boolean(pregnancy)}/>:<p className="journey-empty">Não há mais registros nesta página.</p>}
    {(page>1||hasNext)&&<nav className="journey-pagination" aria-label="Páginas da sua Jornada">
      {page>1&&<Link href={pageLink(page-1)}>Página anterior</Link>}
      {hasNext&&<Link href={pageLink(page+1)}>Próxima página</Link>}
    </nav>}
  </main></PatientShell>;
}
