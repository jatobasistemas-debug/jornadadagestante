import Link from 'next/link';
import {PatientShell} from '@/components/patient-shell';
import {MemoryForm} from '@/components/memory-form';
import {journalContext} from '@/lib/journey-records-server';
import {journeyToday} from '@/lib/journey-records';
import {memoryKinds,type MemoryKind} from '@/lib/memories';
export const metadata={title:'Guardar uma memória'};
export default async function NewMemory({params,searchParams}:{params:Promise<{clinic:string}>;searchParams:Promise<{tipo?:string}>}){
 const {clinic:slug}=await params,q=await searchParams;
 const {clinic,pregnancy}=await journalContext(slug);
 const kind=Object.hasOwn(memoryKinds,q.tipo??'')?q.tipo as MemoryKind:'memory';
 return <PatientShell clinic={clinic} current="gestante/memorias"><main id="conteudo" className="journey-page journey-compose"><header className="journey-opening"><p className="eyebrow">Um lugar para lembrar</p><h1>{kind==='letter'?'Uma carta para você, bebê':'Guardar uma memória'}</h1><p>Pode ser um instante ou algumas palavras. Sem pressa.</p></header>{pregnancy?<MemoryForm slug={slug} id={crypto.randomUUID()} today={journeyToday()} dueDate={pregnancy.due_date} kind={kind}/>:<p>Não há uma gestação ativa para novos registros.</p>}<p><Link href={`/${slug}/gestante/memorias`}>Todas as memórias</Link></p></main></PatientShell>;
}
