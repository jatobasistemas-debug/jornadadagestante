import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isConfigured, publicConfig } from '@/lib/config';
export async function proxy(request: NextRequest) {
 let response=NextResponse.next({request});
 response.headers.set('Cache-Control','private, no-store');
 if(!isConfigured()) return response;
 const {url,key}=publicConfig();
 const db=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll:values=>{
  values.forEach(({name,value})=>request.cookies.set(name,value));
  response=NextResponse.next({request});
  response.headers.set('Cache-Control','private, no-store');
  values.forEach(({name,value,options})=>response.cookies.set(name,value,{...options,sameSite:'lax',secure:process.env.NODE_ENV==='production'}));
 }}});
 await db.auth.getUser();
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|api/health).*)']};
