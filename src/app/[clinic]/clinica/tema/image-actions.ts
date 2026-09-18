'use server';
import {randomUUID} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {requireClinic} from '@/lib/access';
import {validateImage} from '@/lib/image-upload';
import type {ActionState} from '@/app/auth/actions';
function ownedPath(url:string|null,base:string,clinicId:string){
 if(!url?.startsWith(base))return null;
 const path=url.slice(base.length);return path.startsWith(clinicId+'/')&&path.split('/').length===2?path:null;
}
export async function uploadLogo(slug:string,_:ActionState,form:FormData):Promise<ActionState>{
 const {db,clinic}=await requireClinic(slug,['clinic_admin']);
 let image;try{image=await validateImage(form.get('image'));}catch(e){return {error:(e as Error).message};}
 const bucket=db.storage.from('clinic-branding'),path=`${clinic.id}/${randomUUID()}.${image.extension}`;
 const result=await bucket.upload(path,image.bytes,{contentType:image.type,cacheControl:'3600'});
 if(result.error)return {error:'Não foi possível enviar a logo. Tente novamente.'};
 const logo_url=bucket.getPublicUrl(path).data.publicUrl;
 const saved=await db.from('clinic_themes').update({logo_url}).eq('clinic_id',clinic.id).select('clinic_id').single();
 if(saved.error){await bucket.remove([path]);return {error:'Não foi possível associar a logo à clínica.'};}
 const old=ownedPath(clinic.logo_url,bucket.getPublicUrl('').data.publicUrl,clinic.id);
 const cleanup=old?await bucket.remove([old]):null;
 revalidatePath(`/${slug}`,'layout');
 if(cleanup?.error)return {error:'A logo foi atualizada, mas o arquivo anterior não pôde ser removido.'};
 redirect(`/${slug}/clinica/tema?imagem=atualizada`);
}
export async function removeLogo(slug:string,_:ActionState):Promise<ActionState>{
 const {db,clinic}=await requireClinic(slug,['clinic_admin']);const bucket=db.storage.from('clinic-branding');
 const old=ownedPath(clinic.logo_url,bucket.getPublicUrl('').data.publicUrl,clinic.id);
 if(old&&(await bucket.remove([old])).error)return {error:'Não foi possível remover o arquivo da logo.'};
 const saved=await db.from('clinic_themes').update({logo_url:null}).eq('clinic_id',clinic.id).select('clinic_id').single();
 if(saved.error)return {error:'Não foi possível concluir a remoção. Tente novamente.'};
 revalidatePath(`/${slug}`,'layout');redirect(`/${slug}/clinica/tema?imagem=removida`);
}
