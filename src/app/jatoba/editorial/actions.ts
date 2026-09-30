'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {requireSuperadmin} from '@/lib/access';
import type {ManageState} from '@/app/gestao/actions';
const blankNumber=z.union([z.literal('').transform(()=>null),z.coerce.number().int().min(0).max(90)]);
const link=z.union([z.literal('').transform(()=>null),z.url().refine(v=>v.startsWith('https://'))]);
export async function saveEditorial(id:string|null,_:ManageState,form:FormData):Promise<ManageState>{const {db}=await requireSuperadmin();
 const p=z.object({kind:z.enum(['week','postpartum','radar','companion']),week:blankNumber,day:blankNumber,title:z.string().trim().min(1).max(180),phrase:z.string().max(500),baby:z.string().max(10000),mother:z.string().max(10000),curiosity:z.string().max(4000),care:z.string().max(4000),alert:z.string().max(4000),question:z.string().max(1000),body:z.string().max(30000),source_name:z.string().max(300),source_url:link,image_url:link,image_caption:z.string().max(1000),reviewer:z.string().max(160),status:z.enum(['draft','published','archived']),review_status:z.enum(['pending','approved']),tags:z.string().max(500),related_services:z.string().max(1000)}).safeParse(Object.fromEntries(form));
 if(!p.success)return {error:'Confira os campos e os endereços HTTPS.'};const v=p.data;if(v.status==='published'&&(v.review_status!=='approved'||!v.reviewer.trim()||!v.source_url))return {error:'Para publicar, informe fonte e responsável pela revisão aprovada.'};
 const data={...v,tags:v.tags.split(',').map(t=>t.trim()).filter(Boolean),related_services:v.related_services.split(',').map(t=>t.trim()).filter(Boolean),reviewed_at:v.review_status==='approved'?new Date().toISOString():null,published_at:v.status==='published'?new Date().toISOString():null,updated_at:new Date().toISOString()};
 const q=id?db.from('editorial_content').update(data).eq('id',id):db.from('editorial_content').insert(data);const r=await q.select('id').single();if(r.error)return {error:'Não foi possível guardar. Confira semana/dia e se já existe um conteúdo para esse período.'};revalidatePath('/','layout');return {success:'Conteúdo salvo com o status escolhido.'};
}
