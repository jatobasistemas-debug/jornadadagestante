 'use server';
import {redirect} from 'next/navigation';
import {requireClinic} from '@/lib/access';import {themeSchema,validateReadableTheme} from '@/lib/theme';import {revalidatePath} from 'next/cache';import type {ActionState} from '@/app/auth/actions';
export async function saveTheme(slug:string,_:ActionState,form:FormData):Promise<ActionState>{
 const {db,clinic}=await requireClinic(slug,['clinic_admin']);
 let raw:unknown;try{raw=JSON.parse(String(form.get('tokens')));}catch{return {error:'Confira as cores informadas.'};}
 const parsed=themeSchema.safeParse(raw);if(!parsed.success)return {error:'Todas as cores precisam estar no formato hexadecimal.'};
 if(!validateReadableTheme(parsed.data))return {error:'A combinação precisa de mais contraste para manter os textos legíveis.'};
 const logo=String(form.get('logo_url')||'').trim();if(logo && !/^https:\/\/[^\s]+$/.test(logo))return {error:'Use um endereço HTTPS para a logo original.'};
 const contact:Record<string,string|null>={};
 for(const key of ['city','slogan','phone','whatsapp','address','instagram','website']){const v=String(form.get(key)||'').trim();if(v.length>(key==='address'?400:200))return {error:'Um dos campos de contato excede o tamanho permitido.'};contact[key]=v||null;}
 if(contact.website && !/^https:\/\/[^\s]+$/.test(contact.website))return {error:'Use HTTPS no endereço do site.'};
 const {error,data}=await db.from('clinic_themes').update({tokens:parsed.data,logo_url:logo||null,...contact}).eq('clinic_id',clinic.id).select('clinic_id');
 if(error||data?.length!==1)return {error:'Não foi possível salvar a identidade.'};
 revalidatePath(`/${slug}`,'layout');redirect(`/${slug}/clinica/tema?identidade=salva`);
}
