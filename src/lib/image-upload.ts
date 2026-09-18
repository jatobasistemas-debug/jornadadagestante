export const MAX_IMAGE_BYTES=2*1024*1024;
export async function validateImage(value:FormDataEntryValue|null){
 if(!(value instanceof File)||value.size===0)throw new Error('Escolha uma imagem.');
 if(value.size>MAX_IMAGE_BYTES)throw new Error('A imagem deve ter no máximo 2 MB.');
 const bytes=new Uint8Array(await value.arrayBuffer());
 const starts=(signature:number[])=>signature.every((n,i)=>bytes[i]===n);
 let type='',extension='';
 if(starts([137,80,78,71,13,10,26,10])){type='image/png';extension='png';}
 else if(starts([255,216,255])){type='image/jpeg';extension='jpg';}
 else if(starts([82,73,70,70])&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'){type='image/webp';extension='webp';}
 if(!type||value.type!==type)throw new Error('Use uma imagem PNG, JPEG ou WebP válida.');
 return {bytes,type,extension};
}
