import {NextResponse} from 'next/server';
import {isConfigured} from '@/lib/config';
import {supabaseServer} from '@/lib/supabase/server';
export async function GET(){
 if(!isConfigured())return NextResponse.json({error:'Serviço indisponível'},{status:503});
 const db=await supabaseServer();const {data:{user},error}=await db.auth.getUser();
 if(error||!user)return NextResponse.json({error:'Acesso necessário'},{status:401});
 // Owner-scoped reads use the caller's JWT and RLS, never the service key.
 const tables=['profiles','clinic_memberships','pregnancies','private_memories','consent_records','subscriptions','subscription_events','time_capsules','birth_records','memory_shares','journey_books','communication_preferences','communication_consent_history','email_deliveries','referral_codes','community_posts','community_comments','community_reactions','community_reports'] as const;
 try{
  const data:Record<string,unknown[]>={};
  for(const table of tables){const rows:unknown[]=[];for(let offset=0;;offset+=500){const r=await db.from(table).select('*').eq('user_id',user.id).range(offset,offset+499);if(r.error)throw r.error;rows.push(...r.data);if(r.data.length<500)break;}data[table]=rows;}
  const invitations=await db.from('companion_invites').select('id,pregnancy_id,email,status,expires_at,created_at').eq('user_id',user.id);
  if(invitations.error)throw invitations.error;data.companion_invites=invitations.data;
  data.journey_book_items=[];
  for(const book of data.journey_books as {id:string}[]){const r=await db.from('journey_book_items').select('*').eq('book_id',book.id).order('position');if(r.error)throw r.error;data.journey_book_items.push(...r.data);}
  return new NextResponse(JSON.stringify({exported_at:new Date().toISOString(),email:user.email,...data},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="minha-conta-jornada.json"','Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'Não foi possível exportar seus dados.'},{status:500});}
}
