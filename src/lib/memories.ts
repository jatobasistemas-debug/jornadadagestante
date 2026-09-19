import {z} from 'zod';
import {journeyToday,recordWeek} from './journey-records';
import {validateImage,MAX_IMAGE_BYTES} from './image-upload';

export const memoryKinds={photo:'Foto',diary:'Diário',ultrasound:'Ultrassom',letter:'Carta para o bebê',memory:'Memória',milestone:'Marco',moment:'Momento'} as const;
export type MemoryKind=keyof typeof memoryKinds;
export const memoryFilters={todas:[],fotos:['photo'],diario:['diary'],ultrassons:['ultrasound'],cartas:['letter'],momentos:['memory','milestone','moment']} as const;
export const filterLabels={todas:'Todas',fotos:'Fotos',diario:'Diário',ultrassons:'Ultrassons',cartas:'Cartas',momentos:'Momentos/Marcos'};
export type MemoryRecord={id:string;category:MemoryKind;body:string|null;occurred_on:string;gestational_week:number|null;storage_path:string|null;pregnancy_id:string};
export const hasAttachment=(kind:string)=>kind==='photo'||kind==='ultrasound';
export function memoryInput(form:FormData,today=journeyToday()) {
 const result=z.object({id:z.uuid(),category:z.enum(['photo','diary','ultrasound','letter','memory','milestone','moment']),
  date:z.iso.date().refine(v=>v<=today,'Escolha hoje ou uma data anterior.'),body:z.string().trim().max(20000,'Use até 20.000 caracteres.')
 }).safeParse({id:form.get('id'),category:form.get('category'),date:form.get('date'),body:form.get('body')??''});
 if(!result.success)return {error:'Confira o tipo, a data e o tamanho do texto.'} as const;
 const data=result.data;
 if(!hasAttachment(data.category)&&!data.body)return {error:'Escreva algumas palavras para guardar.'} as const;
 if(data.category!=='letter'&&data.body.length>2000)return {error:'Use até 2.000 caracteres neste registro.'} as const;
 return {data} as const;
}
export function memoryValues(value:{category:MemoryKind;date:string;body:string},dueDate:string){return {category:value.category,body:value.body||null,occurred_on:value.date,gestational_week:recordWeek(dueDate,value.date)};}
export function ownedMemoryPath(path:string,clinicId:string,userId:string,pregnancyId:string){
 const prefix=`${clinicId}/${userId}/${pregnancyId}/`;
 return path.startsWith(prefix)&&/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|pdf)$/.test(path.slice(prefix.length));
}
export async function validateMemoryFile(value:FormDataEntryValue|null,kind:MemoryKind){
 if(kind==='ultrasound'&&value instanceof File&&value.type==='application/pdf'){
  if(!value.size||value.size>MAX_IMAGE_BYTES)throw new Error('Use um arquivo de até 2 MB.');
  const bytes=new Uint8Array(await value.arrayBuffer());
  const header=new TextDecoder().decode(bytes.slice(0,8));
  const tail=new TextDecoder().decode(bytes.slice(-1024));
  if(!/^%PDF-1\.[0-9]/.test(header)&&!header.startsWith('%PDF-2.0'))throw new Error('O arquivo não é um PDF válido.');
  if(!tail.includes('%%EOF'))throw new Error('O PDF está incompleto.');
  return {bytes,type:'application/pdf',extension:'pdf'};
 }
 return validateImage(value);
}
