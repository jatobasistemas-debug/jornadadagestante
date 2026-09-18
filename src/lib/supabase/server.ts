import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicConfig } from '@/lib/config';
export async function supabaseServer() {
 const jar=await cookies(); const {url,key}=publicConfig();
 return createServerClient(url,key,{cookies:{getAll:()=>jar.getAll(),setAll:values=>{
  try { values.forEach(({name,value,options})=>jar.set(name,value,{...options,sameSite:'lax',secure:process.env.NODE_ENV==='production'})); }
  catch { /* Server Components cannot write cookies; proxy refreshes sessions. */ }
 }}});
}
