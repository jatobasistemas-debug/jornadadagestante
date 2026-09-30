import 'server-only';
export type ProductEmail={to:string;subject:string;text:string;key:string};
export interface EmailProvider{send(message:ProductEmail):Promise<{id:string}>}
export function emailProvider():EmailProvider|null{
 const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM;if(!key||!from)return null;
 return {async send(message){const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':message.key},body:JSON.stringify({from,to:[message.to],subject:message.subject,text:message.text}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`EMAIL_HTTP_${r.status}`);const data=await r.json();if(typeof data.id!=='string')throw new Error('EMAIL_INVALID_RESPONSE');return {id:data.id};}};
}
export interface WhatsAppProvider{send(input:{to:string;text:string;key:string}):Promise<{id:string}>}
export function whatsappProvider():WhatsAppProvider|null{return null;}
