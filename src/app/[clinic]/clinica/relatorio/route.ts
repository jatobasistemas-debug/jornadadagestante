import {requireClinic} from '@/lib/access';
import {csvRows} from '@/lib/csv';
import {gestation} from '@/lib/gestation';
import {z} from 'zod';
export async function GET(request:Request,{params}:{params:Promise<{clinic:string}>}){
 const {clinic:slug}=await params;const {db,clinic}=await requireClinic(slug,['clinic_admin','clinic_staff']);
 const query=new URL(request.url).searchParams,from=z.iso.date().safeParse(query.get('de')),to=z.iso.date().safeParse(query.get('ate'));
 const rows:unknown[][]=[['Nome','Situação','Semana estimada','Data de entrada']];
 for(let offset=0;;offset+=500){let q=db.rpc('clinic_roster',{p_clinic:clinic.id}).order('created_at').order('id');if(from.success)q=q.gte('created_at',from.data+'T00:00:00Z');if(to.success)q=q.lte('created_at',to.data+'T23:59:59Z');const r=await q.range(offset,offset+499);if(r.error)return new Response('Não foi possível gerar o relatório.',{status:500});
  for(const p of r.data)rows.push([p.display_name,p.status,p.status==='active'?gestation(p.due_date)?.week??'':'',p.created_at.slice(0,10)]);
  if(r.data.length<500)break;
 }
 return new Response(csvRows(rows),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="relatorio-operacional.csv"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
