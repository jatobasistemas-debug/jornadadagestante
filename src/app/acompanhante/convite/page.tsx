import {BrandShell} from '@/components/brand-shell';
import {ManageForm} from '@/components/manage-form';
import {accept} from '../actions';
export default async function Page({searchParams}:{searchParams:Promise<{token?:string}>}){const token=(await searchParams).token??'';return <BrandShell><main id="conteudo" className="content narrow"><h1>Um convite para acompanhar</h1><p>Entre com o e-mail que recebeu o convite. Você verá a fase da gestação e somente os registros que forem compartilhados com você.</p><p><a href="/auth/entrar">Entrar na minha conta</a> · <a href="/acompanhante/cadastro">Criar conta gratuita</a></p><ManageForm action={accept.bind(null,token)} fields={[]} label="Aceitar convite"/></main></BrandShell>;}
