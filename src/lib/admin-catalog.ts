import {z} from 'zod';
const text=(max=160)=>z.string().trim().min(1).max(max);
const optionalText=z.string().trim().max(2000).transform(v=>v||null);
const integer=(min:number,max=10000000)=>z.coerce.number().int().min(min).max(max);
const nullableNumber=z.union([z.literal('').transform(()=>null),integer(0)]);
const url=z.union([z.literal('').transform(()=>null),z.url().refine(v=>v.startsWith('https://')||v.startsWith('tel:'))]);
export type Field={name:string;label:string;type?:string;options?:string[];required?:boolean;max?:number};
export const adminCatalog={
 services:{table:'clinic_services',title:'Serviços',superOnly:false,schema:z.object({name:text(),booking_url:url,active:z.boolean()}),fields:[{name:'name',label:'Nome',required:true},{name:'booking_url',label:'Link de atendimento',type:'url'},{name:'active',label:'Ativo',type:'checkbox'}]},
 professionals:{table:'clinic_professionals',title:'Profissionais',superOnly:false,schema:z.object({name:text(),specialty:text(),registration:optionalText,active:z.boolean()}),fields:[{name:'name',label:'Nome',required:true},{name:'specialty',label:'Especialidade',required:true},{name:'registration',label:'Registro profissional'},{name:'active',label:'Ativo',type:'checkbox'}]},
 codes:{table:'partner_codes',title:'Códigos de parceiro',superOnly:false,schema:z.object({label:text(120),campaign:z.string().max(120).transform(v=>v||null),starts_at:z.iso.datetime(),expires_at:z.union([z.literal('').transform(()=>null),z.iso.datetime()]),max_uses:nullableNumber.refine(v=>v===null||v>0),access_days:nullableNumber.refine(v=>v===null||(v>0&&v<=730)),active:z.boolean()}),fields:[{name:'label',label:'Identificação',required:true},{name:'campaign',label:'Campanha/origem'},{name:'starts_at',label:'Início (UTC)',type:'datetime-local',required:true},{name:'expires_at',label:'Validade (UTC)',type:'datetime-local'},{name:'max_uses',label:'Limite de usos (vazio: sem limite)',type:'number'},{name:'access_days',label:'Dias de acesso (vazio: sem prazo)',type:'number'},{name:'active',label:'Ativo',type:'checkbox'}]},
 plans:{table:'access_plans',title:'Planos individuais',superOnly:true,schema:z.object({code:z.string().regex(/^[a-z0-9_-]{2,40}$/),name:text(100),months:z.coerce.number().refine(v=>[1,3,6,9,12].includes(v)),price_cents:nullableNumber,promotional_cents:nullableNumber,promotional_months:nullableNumber.refine(v=>v===null||(v>=1&&v<=12)),trial_days:integer(0,90),active:z.boolean()}).refine(v=>(v.promotional_cents===null)===(v.promotional_months===null)),fields:[{name:'code',label:'Código',required:true},{name:'name',label:'Nome',required:true},{name:'months',label:'Duração em meses',options:['1','3','6','9','12']},{name:'price_cents',label:'Preço total em centavos',type:'number'},{name:'promotional_cents',label:'Preço promocional em centavos',type:'number'},{name:'promotional_months',label:'Meses de promoção',type:'number'},{name:'trial_days',label:'Dias de experiência',type:'number',required:true},{name:'active',label:'Disponível',type:'checkbox'}]},
 campaigns:{table:'clinic_campaigns',title:'Campanhas',superOnly:false,schema:z.object({title:text(),body:text(2000),service_id:z.uuid(),starts_on:z.iso.date(),ends_on:z.iso.date(),week_from:integer(1,40),week_to:integer(1,40),cta:z.url().refine(v=>v.startsWith('https://')),priority:integer(0,10),active:z.boolean()}).refine(v=>v.ends_on>=v.starts_on&&v.week_to>=v.week_from),fields:[{name:'title',label:'Título',required:true},{name:'body',label:'Texto',type:'textarea',required:true},{name:'service_id',label:'Serviço',required:true},{name:'starts_on',label:'Início',type:'date',required:true},{name:'ends_on',label:'Fim',type:'date',required:true},{name:'week_from',label:'Da semana',type:'number',required:true},{name:'week_to',label:'Até a semana',type:'number',required:true},{name:'cta',label:'Link de atendimento',type:'url',required:true},{name:'priority',label:'Prioridade (0 a 10)',type:'number',required:true},{name:'active',label:'Ativa',type:'checkbox'}]},
} satisfies Record<string,{table:string;title:string;superOnly:boolean;schema:z.ZodType;fields:Field[]}>;
export type AdminKind=keyof typeof adminCatalog;
export function adminValues(kind:AdminKind,form:FormData){
 const fields=adminCatalog[kind].fields as Field[];
 return adminCatalog[kind].schema.safeParse(Object.fromEntries(fields.map(f=>{
  let value:unknown=f.type==='checkbox'?form.get(f.name)==='on':String(form.get(f.name)??'');
  if(f.type==='datetime-local'&&value)value=new Date(String(value)+'Z').toISOString();
  return [f.name,value];
 })));
}
