import Link from 'next/link';
import {requireFeature} from '@/lib/features';
import {PatientShell} from '@/components/patient-shell';
import {EditorialArticle} from '@/components/editorial-article';
import {postpartumAge} from '@/lib/postpartum';
export default async function Page({params,searchParams}:{params:Promise<{clinic:string}>;searchParams:Promise<{dia?:string}>}){
 const {clinic:slug}=await params;const {db,user,clinic}=await requireFeature(slug,'postpartum');
 const pregnancies=await db.from('pregnancies').select('id').eq('user_id',user.id).filter('clinic_id',clinic.id===null?'is':'eq',clinic.id??'null').order('created_at',{ascending:false});
 if(pregnancies.error)throw new Error('Não foi possível carregar sua Jornada.');
 const result=pregnancies.data.length?await db.from('birth_records').select('born_at,name,pregnancy_id').eq('user_id',user.id).in('pregnancy_id',pregnancies.data.map(p=>p.id)).order('born_at',{ascending:false}).limit(1).maybeSingle():{data:null,error:null};
 if(result.error)throw new Error('Não foi possível carregar este momento.');
 const b=result.data,age=b?postpartumAge(b.born_at):null,query=await searchParams;
 const requested=query.dia&&/^\d{1,2}$/.test(query.dia)?Number(query.dia):null;
 const day=requested!==null&&requested<=90?requested:Math.min(age?.days??0,90);
 const editorial=age?await db.from('editorial_content').select('*').eq('kind','postpartum').eq('day',day).eq('status','published').eq('review_status','approved').maybeSingle():null;
 if(editorial?.error)throw new Error('Não foi possível carregar a leitura.');
 return <PatientShell clinic={clinic} current="gestante"><main id="conteudo" className="journey-page"><h1>Depois da chegada</h1>{age?<>
 <p>{age.days} dias desde o nascimento{b?.name?` de ${b.name}`:''}.</p><h2>{age.withinProgram?`Semana ${age.week} do pós-parto`:'Sua história continua'}</h2>
 <p>Você pode continuar guardando esta história no seu tempo.</p><nav className="product-links" aria-label="Semanas do pós-parto">{Array.from({length:13},(_,i)=><Link key={i} href={`?dia=${i*7}`} aria-current={Math.floor(day/7)===i?'page':undefined}>Semana {i+1}</Link>)}</nav>
 <form className="form"><label>Dia do pós-parto<input type="number" name="dia" min={0} max={90} defaultValue={day}/></label><button>Ver dia</button></form>
 {editorial?.data?<EditorialArticle entry={editorial.data}/>:<section><h2>Dia {day} · No seu tempo</h2><p>O conteúdo educativo deste dia aguarda revisão profissional. Para orientações sobre você e o bebê, converse com sua equipe de saúde.</p></section>}
 <Link href={`/${slug}/gestante/memorias/nova`}>Guardar uma memória</Link></>:<><p>Registre o nascimento quando quiser iniciar esta fase.</p><Link href={`/${slug}/gestante/nascimento`}>Registrar nascimento</Link></>}</main></PatientShell>;
}
