import Link from 'next/link';
import {PatientShell} from '@/components/patient-shell';
import {journalContext} from '@/lib/journey-records-server';
import {memoryFilters,filterLabels,memoryKinds,type MemoryRecord} from '@/lib/memories';
import {journeyPage,recordDateLabel,JOURNEY_PAGE_SIZE} from '@/lib/journey-records';
export const metadata={title:'Memórias'};
export default async function Memories({params,searchParams}:{params:Promise<{clinic:string}>;searchParams:Promise<{tipo?:string;pagina?:string;excluida?:string}>}){
 const {clinic:slug}=await params,q=await searchParams;
 const filter=Object.hasOwn(memoryFilters,q.tipo??'')?q.tipo as keyof typeof memoryFilters:'todas';
 const page=journeyPage(q.pagina),offset=(page-1)*JOURNEY_PAGE_SIZE;
 const {db,user,clinic,pregnancy}=await journalContext(slug);
 let query=db.from('private_memories').select('id,category,body,occurred_on,gestational_week,storage_path,pregnancy_id').eq('user_id',user.id).eq('clinic_id',clinic.id);
 if(filter!=='todas')query=query.in('category',[...memoryFilters[filter]]);
 const result=await query.order('occurred_on',{ascending:false}).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+JOURNEY_PAGE_SIZE);
 if(result.error)throw new Error('Não foi possível carregar suas memórias.');
 const records=result.data.slice(0,JOURNEY_PAGE_SIZE) as MemoryRecord[];
 const initial={fotos:'photo',ultrassons:'ultrasound',cartas:'letter',diario:'diary',momentos:'memory',todas:'memory'}[filter];
 return <PatientShell clinic={clinic} current="gestante/memorias"><main id="conteudo" className="journey-page">
  <header className="journey-opening"><p className="eyebrow">Só suas, no seu tempo</p><h1>{filter==='cartas'?'Cartas para o bebê':'Memórias'}</h1><p className="journey-intro">Pequenos instantes, palavras que ficam.</p><p>Não há uma forma certa de guardar sua história. Este espaço é privado, inclusive em relação à clínica.</p>{pregnancy&&<Link className="button" href={`/${slug}/gestante/memorias/nova?tipo=${initial}`}>{filter==='cartas'?'Escrever uma carta':'Guardar uma memória'}</Link>}</header>
  <nav className="memory-tabs" aria-label="Tipos de memória">{Object.keys(memoryFilters).map(key=><Link key={key} href={`/${slug}/gestante/memorias?tipo=${key}`} aria-current={key===filter?'page':undefined}>{filterLabels[key as keyof typeof filterLabels]}</Link>)}</nav>
  {q.excluida==='1'&&<p role="status" className="message">O registro foi excluído.</p>}
  {!records.length&&<section className="journey-empty"><h2>Sua história começa quando você quiser.</h2><p>{page>1?'Não há mais registros nesta página.':'Uma foto, algumas palavras, uma lembrança. Você escolhe quando guardar.'}</p>{!pregnancy&&<p>Não há gestação ativa para novos registros. Suas memórias anteriores continuam disponíveis.</p>}</section>}
  <div className="memory-collection">{records.map(record=><article key={record.id} className={`memory-preview memory-${record.category}`}>
   {record.storage_path&&!record.storage_path.endsWith('.pdf')&&<img src={`/${slug}/gestante/memorias/${record.id}/arquivo`} alt={record.category==='ultrasound'?'Ultrassom guardado por você':'Fotografia guardada por você'} loading="lazy"/>}
   <p className="eyebrow">{memoryKinds[record.category]}</p><h2><Link href={`/${slug}/gestante/memorias/${record.id}`}>{recordDateLabel(record.occurred_on)}</Link></h2><p className="form-note">{record.gestational_week===null?'Semana não estimada':`Semana ${record.gestational_week}`}</p>
   {record.body&&<p className="memory-excerpt">{record.body.slice(0,240)}{record.body.length>240?'…':''}</p>}
   <Link href={`/${slug}/gestante/memorias/${record.id}`}>Abrir {memoryKinds[record.category].toLowerCase()}</Link>
  </article>)}</div>
  <nav className="journey-pagination" aria-label="Páginas das memórias">{page>1&&<Link href={`/${slug}/gestante/memorias?tipo=${filter}&pagina=${page-1}`}>Mais recentes</Link>}{result.data.length>JOURNEY_PAGE_SIZE&&<Link href={`/${slug}/gestante/memorias?tipo=${filter}&pagina=${page+1}`}>Anteriores</Link>}</nav>
 </main></PatientShell>;
}
