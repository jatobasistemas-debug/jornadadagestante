import {timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {publicConfig,appUrl} from '@/lib/config';
import {emailProvider} from '@/lib/email-provider';
import {weeklyEmail} from '@/lib/email-templates';
import {shouldScheduleWeekly,transactionalEmail} from '@/lib/email-jobs';
export const maxDuration=60;
export async function GET(request:Request){
 const expected=process.env.CRON_SECRET,actual=request.headers.get('authorization')??'';
 if(!expected||actual.length!==`Bearer ${expected}`.length||!timingSafeEqual(Buffer.from(actual),Buffer.from(`Bearer ${expected}`)))return new Response(null,{status:401});
 const provider=emailProvider(),key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!provider||!key)return Response.json({error:'EMAIL_NOT_CONFIGURED'},{status:503});
 const db=createClient(publicConfig().url,key,{auth:{persistSession:false,autoRefreshToken:false}});const scheduled=shouldScheduleWeekly()?await db.rpc('schedule_weekly'):{data:0,error:null};if(scheduled.error)return Response.json({error:'SCHEDULE_FAILED'},{status:500});const batch=await db.rpc('claim_emails');if(batch.error)return Response.json({error:'QUEUE_FAILED'},{status:500});let sent=0,failed=0;
 for(const job of batch.data){try{
  const transactional=transactionalEmail(job.kind,appUrl());
  if(transactional){const account=await db.auth.admin.getUserById(job.user_id);if(account.error)throw new Error('EMAIL_CONTEXT_FAILED');if(!account.data.user?.email_confirmed_at||!account.data.user.email){await db.from('email_deliveries').update({status:'cancelled'}).eq('id',job.id);continue;}const delivered=await provider.send({to:account.data.user.email,...transactional,key:`product-${job.id}`});const receipt=await db.from('email_deliveries').update({status:'sent',provider_id:delivered.id,sent_at:new Date().toISOString(),error_code:null}).eq('id',job.id);if(receipt.error)throw new Error('EMAIL_RECEIPT_FAILED');sent++;continue;}
  const [preference,account,pregnancy]=await Promise.all([db.from('communication_preferences').select('weekly_email').eq('user_id',job.user_id).maybeSingle(),db.auth.admin.getUserById(job.user_id),db.from('pregnancies').select('clinic_id,status').eq('id',job.pregnancy_id).eq('user_id',job.user_id).maybeSingle()]);
  if(preference.error||account.error||pregnancy.error)throw new Error('EMAIL_CONTEXT_FAILED');
  if(!preference.data?.weekly_email||!account.data.user?.email_confirmed_at||!pregnancy.data||pregnancy.data.status!=='active'){await db.from('email_deliveries').update({status:'cancelled'}).eq('id',job.id);continue;}
  const clinic=pregnancy.data.clinic_id?await db.from('clinics').select('slug,name,status').eq('id',pregnancy.data.clinic_id).single():null;
  if(clinic?.error)throw new Error('EMAIL_CONTEXT_FAILED');if(clinic&&clinic.data?.status!=='active'){await db.from('email_deliveries').update({status:'cancelled'}).eq('id',job.id);continue;}
  const editorial=await db.from('editorial_content').select('phrase,baby,care').eq('kind','week').eq('week',job.week).eq('status','published').eq('review_status','approved').maybeSingle();if(editorial.error)throw new Error('EMAIL_CONTENT_FAILED');const slug=clinic?.data?.slug??'pessoal';
  const message=weeklyEmail({week:job.week,...editorial.data,url:`${appUrl()}/${slug}/gestante/semana/${job.week}`,preferencesUrl:`${appUrl()}/${slug}/gestante/comunicacoes`,clinic:clinic?.data?.name});
  const r=await provider.send({to:account.data.user.email!,...message,key:`weekly-${job.id}`});const saved=await db.from('email_deliveries').update({status:'sent',provider_id:r.id,sent_at:new Date().toISOString(),error_code:null}).eq('id',job.id);if(saved.error)throw new Error('EMAIL_RECEIPT_FAILED');sent++;
 }catch(error){failed++;const code=error instanceof Error&&/^EMAIL_[A-Z0-9_]+$/.test(error.message)?error.message:'EMAIL_DELIVERY_FAILED';await db.from('email_deliveries').update({status:'failed',error_code:code,available_at:new Date(Date.now()+3600000).toISOString()}).eq('id',job.id);console.error({event:'product_email_failed',code});}}
 return Response.json({scheduled:scheduled.data,sent,failed});
}
