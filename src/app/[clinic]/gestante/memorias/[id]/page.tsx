import Link from 'next/link';
import {PatientShell} from '@/components/patient-shell';
import {DeleteMemory} from '@/components/memory-form';
import {ownedMemory} from '@/lib/memories-server';
import {memoryKinds} from '@/lib/memories';
import {recordDateLabel} from '@/lib/journey-records';
export const metadata={title:'Sua memória'};
export default async function Memory({params,searchParams}:{params:Promise<{clinic:string;id:string}>;searchParams:Promise<{guardado?:string}>}){
 const {clinic:slug,id}=await params,q=await searchParams;
 const {clinic,memory}=await ownedMemory(slug,id);
 const file=`/${slug}/gestante/memorias/${id}/arquivo`;
 return <PatientShell clinic={clinic} current="gestante/memorias"><main id="conteudo" className="journey-page journey-compose"><header className="journey-opening"><p className="eyebrow">Privado para você</p><h1>{memoryKinds[memory.category]}</h1><p><time dateTime={memory.occurred_on}>{recordDateLabel(memory.occurred_on)}</time> · {memory.gestational_week===null?'Semana não estimada':`Semana ${memory.gestational_week}`}</p></header>
  {q.guardado==='1'&&<p role="status" className="message">Sua memória foi guardada.</p>}
  {memory.storage_path&&(memory.storage_path.endsWith('.pdf')?<p><a className="button" href={file}>Baixar seu arquivo PDF</a></p>:<img className="memory-image" src={file} alt={memory.category==='ultrasound'?'Seu registro de ultrassom':'Sua fotografia privada'}/>)}
  {memory.category==='ultrasound'&&<p className="form-note">Seu exame fica guardado aqui, sem interpretação ou diagnóstico. Converse com sua equipe sobre o resultado.</p>}
  <article className={memory.category==='letter'?'memory-body memory-letter':'memory-body'}>{memory.body&&<p>{memory.body}</p>}</article>
  <div className="journey-form-actions"><Link href={`/${slug}/gestante/memorias/${id}/editar`}>Editar {memory.storage_path?'data e legenda':'registro'}</Link><Link href={`/${slug}/gestante/memorias`}>Voltar às memórias</Link></div>
  <DeleteMemory slug={slug} id={id}/>
 </main></PatientShell>;
}
