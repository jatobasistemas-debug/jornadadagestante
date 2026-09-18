export function isConfigured() { return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); }
export function publicConfig() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url || !key) throw new Error('Supabase não configurado.');
 return {url,key};
}
export function appUrl() { const url=process.env.APP_URL; if(!url) throw new Error('APP_URL não configurada.'); const parsed=new URL(url); if(!['https:','http:'].includes(parsed.protocol)) throw new Error('APP_URL inválida.'); return parsed.origin; }
