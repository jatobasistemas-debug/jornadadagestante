import {PatientShell} from '@/components/patient-shell';
import {MemoryForm} from '@/components/memory-form';
import {ownedMemory} from '@/lib/memories-server';
import {journeyToday} from '@/lib/journey-records';
export const metadata={title:'Editar memória'};
export default async function EditMemory({params}:{params:Promise<{clinic:string;id:string}>}){
 const {clinic:slug,id}=await params;
 const {db,user,clinic,memory}=await ownedMemory(slug,id);
 const pregnancy=await db.from('pregnancies').select('due_date').eq('id',memory.pregnancy_id).eq('clinic_id',clinic.id).eq('user_id',user.id).single();
 if(pregnancy.error)throw new Error('Não foi possível carregar a gestação deste registro.');
 return <PatientShell clinic={clinic} current="gestante/memorias"><main id="conteudo" className="journey-page journey-compose"><header className="journey-opening"><h1>Revisitar suas palavras</h1><p>A história é sua. Você pode ajustar este registro.</p></header><MemoryForm slug={slug} id={id} today={journeyToday()} dueDate={pregnancy.data.due_date} initial={memory}/></main></PatientShell>;
}
