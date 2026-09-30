import QRCode from 'qrcode';
import {requireUser} from '@/lib/access';
import {appUrl} from '@/lib/config';
import {z} from 'zod';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;if(!z.uuid().safeParse(id).success)return new Response(null,{status:404});const {db}=await requireUser();const r=await db.from('partner_codes').select('code').eq('id',id).maybeSingle();if(r.error)return new Response(null,{status:500});if(!r.data)return new Response(null,{status:404});const svg=await QRCode.toString(`${appUrl()}/parceiro?codigo=${r.data.code}`,{type:'svg',errorCorrectionLevel:'M',margin:4});return new Response(svg,{headers:{'Content-Type':'image/svg+xml','Content-Disposition':'attachment; filename="acesso-jornada.svg"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
