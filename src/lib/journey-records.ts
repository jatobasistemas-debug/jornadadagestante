import {z} from 'zod';
import {gestation} from './gestation';

export const recordKinds = {diary:'Diário', memory:'Memória', milestone:'Marco'} as const;
export type RecordKind = keyof typeof recordKinds;
export const timelineCategories = ['diary','memory','milestone','moment'];
export const RECORD_TEXT_LIMIT = 2000;
export const JOURNEY_PAGE_SIZE = 20;
export type JourneyRecord = {id:string; category:string; body:string|null; occurred_on:string; gestational_week:number|null};
export type RecordFormState = {error?:string};

export function journeyToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return ['year','month','day'].map(key=>parts.find(p=>p.type===key)!.value).join('-');
}
export function recordSchema(today:string) {
  return z.object({
    id:z.uuid(),
    kind:z.enum(['diary','memory','milestone']),
    text:z.string().trim().min(1,'Escreva algumas palavras para guardar este registro.').max(RECORD_TEXT_LIMIT,'Use até 2.000 caracteres neste registro.'),
    date:z.iso.date('Confira a data do registro.').refine(value=>value<=today,'Escolha hoje ou uma data anterior.'),
  });
}
export function recordWeek(dueDate:string,date:string) {
  if(!z.iso.date().safeParse(date).success) return null;
  // Noon UTC keeps date-only input on the same calendar day in São Paulo.
  return gestation(dueDate,new Date(`${date}T12:00:00Z`))?.week ?? null;
}
export function recordPayload(form:FormData,context:{userId:string;clinicId:string;pregnancyId:string;dueDate:string},today=journeyToday()) {
  const parsed=recordSchema(today).safeParse({id:form.get('id'),kind:form.get('kind'),text:form.get('text'),date:form.get('date')});
  if(!parsed.success) return {error:parsed.error.issues[0].message} as const;
  const value=parsed.data;
  return {data:{id:value.id,user_id:context.userId,clinic_id:context.clinicId,pregnancy_id:context.pregnancyId,
    category:value.kind,body:value.text,occurred_on:value.date,gestational_week:recordWeek(context.dueDate,value.date)}} as const;
}
export function recordLabel(category:string) {
  return category==='moment' ? 'Memória' : recordKinds[category as RecordKind] ?? 'Registro';
}
export function recordDateLabel(date:string) {
  return new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${date}T12:00:00Z`));
}
export function journeyPage(value:string|undefined) {
  return value && /^[1-9]\d{0,4}$/.test(value) ? Number(value) : 1;
}
