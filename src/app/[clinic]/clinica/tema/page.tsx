import {requireClinic} from '@/lib/access';
import {BrandShell} from '@/components/brand-shell';
import {ThemeEditor} from '@/components/theme-editor';
import {ImageUpload} from '@/components/image-upload';
export default async function ThemePage({params,searchParams}:{params:Promise<{clinic:string}>;searchParams:Promise<{imagem?:string;identidade?:string}>}){
 const query=await searchParams;
 const notice=query.imagem==='atualizada'?'Logo atualizada.':query.imagem==='removida'?'Logo removida.':undefined;
 const {clinic:slug}=await params;const {clinic}=await requireClinic(slug,['clinic_admin']);
 return <BrandShell clinic={clinic} signedIn><main id="conteudo" className="content narrow stack"><a href={`/${slug}/clinica`}>Voltar para a clínica</a><h1>A identidade da sua clínica.</h1><p>Escolha suas cores e preserve a mesma experiência em todos os acessos.</p>
 <ImageUpload slug={slug} kind="logo" current={clinic.logo_url} notice={notice}/>
 {query.identidade==='salva'&&<p role="status" className="message">Identidade salva. Ela já está aplicada aos acessos desta clínica.</p>}
 <ThemeEditor slug={slug} initial={clinic.tokens} logo={clinic.logo_url} identity={clinic}/>
 </main></BrandShell>;
}
