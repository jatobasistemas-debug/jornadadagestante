import {BrandShell} from '@/components/brand-shell';
import {EnrollmentForm} from '@/components/enrollment-form';
import {supabaseServer} from '@/lib/supabase/server';
export default async function Partner({searchParams}:{searchParams:Promise<{codigo?:string}>}){
 const code=(await searchParams).codigo?.trim().toUpperCase();const db=await supabaseServer();
 const result=code&&/^[A-Z0-9]{8,32}$/.test(code)?await db.rpc('resolve_partner',{p_code:code}):null;
 if(result?.error)throw new Error('Não foi possível conferir o código.');
 return <BrandShell><main id="conteudo" className="content narrow"><h1>Acesso por parceiro</h1>
 {result?.data?<><h2>Com {result.data.name}</h2><p>Seu acesso será patrocinado por esta clínica. Seus registros pessoais continuam privados.</p><EnrollmentForm code={code}/><p>Já tem conta? <a href="/assinatura">Entre para ativar este código</a>.</p></>:<><p>Digite o código enviado pela sua clínica. Você também pode abrir o link ou o QR Code que recebeu.</p>{code&&<p role="alert">Código indisponível, expirado ou sem vagas.</p>}<form className="form"><label>Código<input name="codigo" autoCapitalize="characters" required minLength={8} maxLength={32}/></label><button>Conferir acesso</button></form></>}
 </main></BrandShell>;
}
