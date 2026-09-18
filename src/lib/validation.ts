import { z } from 'zod';
export const slugSchema=z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/);
export const loginSchema=z.object({email:z.email().max(254),password:z.string().min(1).max(128)});
export const passwordSchema=z.string().min(10,'Use pelo menos 10 caracteres.').max(128);
export const signupSchema=z.object({full_name:z.string().trim().min(2).max(160),email:z.email().max(254),password:passwordSchema,clinic_slug:slugSchema,date_type:z.enum(['due_date','last_menstrual_period']),date:z.iso.date(),terms:z.literal('on'),privacy:z.literal('on'),sensitive:z.literal('on')}).superRefine((v,ctx)=>{
 const now=new Date(); now.setUTCHours(0,0,0,0); const d=new Date(v.date+'T00:00:00Z');
 const due=v.date_type==='due_date'?d.getTime():d.getTime()+280*86400000;
 if(due<now.getTime()-42*86400000 || due>now.getTime()+294*86400000 || (v.date_type==='last_menstrual_period' && d>now)) ctx.addIssue({code:'custom',message:'Confira a data informada.',path:['date']});
});
export function safeNext(value:string|null){return value==='/auth/nova-senha'?value:'/acesso';}
