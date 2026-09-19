import {ownedMemory} from '@/lib/memories-server';
import {ownedMemoryPath} from '@/lib/memories';
export async function GET(_request:Request,{params}:{params:Promise<{clinic:string;id:string}>}){
 const {clinic:slug,id}=await params;
 const {db,user,clinic,memory}=await ownedMemory(slug,id);
 const path=memory.storage_path;
 if(!path||!ownedMemoryPath(path,clinic.id,user.id,memory.pregnancy_id))return new Response(null,{status:404});
 const result=await db.storage.from('private-memories').download(path);
 if(result.error)return new Response('Arquivo indisponível. Tente novamente.',{status:404,headers:{'Cache-Control':'private, no-store'}});
 const extension=path.split('.').pop()!;
 const type:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',pdf:'application/pdf'};
 return new Response(result.data,{headers:{'Content-Type':type[extension],'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Content-Disposition':`${extension==='pdf'?'attachment':'inline'}; filename="memoria.${extension}"`}});
}
