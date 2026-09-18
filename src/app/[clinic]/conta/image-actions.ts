'use server';
import {randomUUID} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {requireClinic} from '@/lib/access';
import {validateImage} from '@/lib/image-upload';
import type {ActionState} from '@/app/auth/actions';
export async function uploadAvatar(slug:string,_:ActionState,form:FormData):Promise<ActionState>{
 const {db,user}=await requireClinic(slug,['patient']);
 let image;try{image=await validateImage(form.get('image'));}catch(e){return {error:(e as Error).message};}
 const profile=await db.from('profiles').select('avatar_path').eq('user_id',user.id).single();
 if(profile.error)return {error:'Não foi possível carregar seu perfil.'};
 const bucket=db.storage.from('avatars'),path=`${user.id}/${randomUUID()}.${image.extension}`;
 if((await bucket.upload(path,image.bytes,{contentType:image.type})).error)return {error:'Não foi possível enviar sua foto.'};
 const saved=await db.from('profiles').update({avatar_path:path}).eq('user_id',user.id).select('user_id').single();
 if(saved.error){await bucket.remove([path]);return {error:'Não foi possível salvar sua foto no perfil.'};}
 const cleanup=profile.data.avatar_path?await bucket.remove([profile.data.avatar_path]):null;
 revalidatePath(`/${slug}/conta`);
 if(cleanup?.error)return {error:'A foto foi atualizada, mas o arquivo anterior não pôde ser removido.'};
 redirect(`/${slug}/conta?imagem=atualizada`);
}
export async function removeAvatar(slug:string,_:ActionState):Promise<ActionState>{
 const {db,user}=await requireClinic(slug,['patient']);
 const profile=await db.from('profiles').select('avatar_path').eq('user_id',user.id).single();
 if(profile.error)return {error:'Não foi possível carregar seu perfil.'};
 if(profile.data.avatar_path&&(await db.storage.from('avatars').remove([profile.data.avatar_path])).error)return {error:'Não foi possível remover sua foto.'};
 const saved=await db.from('profiles').update({avatar_path:null}).eq('user_id',user.id).select('user_id').single();
 if(saved.error)return {error:'Não foi possível concluir a remoção. Tente novamente.'};
 revalidatePath(`/${slug}/conta`);redirect(`/${slug}/conta?imagem=removida`);
}
