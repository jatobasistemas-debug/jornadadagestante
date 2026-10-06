import {notFound} from 'next/navigation';
import {requireUser} from '@/lib/access';
import {parseWeek,publishedWeek} from '@/content/gestation-weeks';
import {BrandShell} from '@/components/brand-shell';
import {EditorialArticle} from '@/components/editorial-article';
import {gestation} from '@/lib/gestation';
export const metadata={title:'Acompanhar uma semana'};
export default async function CompanionWeek({params}:{params:Promise<{week:string}>}){
 const week=parseWeek((await params).week);if(week===null)notFound();
 const {db}=await requireUser();const overview=await db.rpc('companion_overview');
 if(overview.error)throw new Error('Não foi possível carregar este acompanhamento.');
 if(!overview.data?.length)notFound();
 const result=await db.from('editorial_content').select('*').eq('kind','companion').eq('week',week).eq('status','published').eq('review_status','approved').order('created_at');
 if(result.error)throw new Error('Não foi possível carregar a leitura.');
 const reference=publishedWeek(week);
 const currentWeeks=[...new Set<number>(overview.data.filter((p:{status:string})=>p.status==='active').map((p:{due_date:string})=>gestation(p.due_date)?.week).filter((w:number|undefined)=>w&&w<=40))];
 return <BrandShell signedIn><main id="conteudo" className="content narrow">
  <a href="/acompanhante">Voltar ao acompanhamento</a><p className="eyebrow">Semana {week}</p><h1>Presença, escuta e cuidado</h1>
  {result.data.length?result.data.map(e=><EditorialArticle key={e.id} entry={e}/>):<section><h2>Uma leitura em preparação</h2><p>O conteúdo específico para quem acompanha nesta semana ainda está em revisão. Você pode explorar outras semanas ou voltar ao acompanhamento.</p>{reference&&<><h3>Sobre o bebê nesta fase</h3><p>{reference.baby}</p></>}</section>}
  <nav aria-label="Semanas do acompanhamento"><ol className="development-scale">{Array.from({length:40},(_,i)=><li key={i} aria-current={week===i+1?'page':undefined}><a href={`/acompanhante/semana/${i+1}`} aria-label={`Semana ${i+1}`}>{i+1}</a></li>)}</ol>{currentWeeks.map(w=><a className="button secondary" key={w} href={`/acompanhante/semana/${w}`}>Voltar à semana atual: {w}</a>)}</nav>
 </main></BrandShell>;
}
