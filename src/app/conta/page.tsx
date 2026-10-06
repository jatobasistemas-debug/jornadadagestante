import {requireUser} from '@/lib/access';
import {BrandShell} from '@/components/brand-shell';
import {ProfileForm} from '@/components/profile-form';
import {ImageUpload} from '@/components/image-upload';
import {DeleteAccount} from '@/components/delete-account';
export const metadata={title:'Minha conta e privacidade'};
export default async function Account({searchParams}:{searchParams:Promise<{imagem?:string}>}){
 const {db,user}=await requireUser();const query=await searchParams;
 const [profile,consents]=await Promise.all([
  db.from('profiles').select('full_name,preferred_name,avatar_path').eq('user_id',user.id).single(),
  db.from('consent_records').select('id,document,version,accepted_at').eq('user_id',user.id).order('accepted_at'),
 ]);
 if(profile.error||consents.error)throw new Error('Não foi possível carregar sua conta.');
 const avatar=profile.data.avatar_path?await db.storage.from('avatars').createSignedUrl(profile.data.avatar_path,120):null;
 if(avatar?.error)throw new Error('Não foi possível carregar a foto.');
 return <BrandShell signedIn><main id="conteudo" className="content narrow stack">
  <a href="/acesso">Voltar ao meu espaço</a><h1>Minha conta e privacidade</h1>
  <ProfileForm slug="" name={profile.data.full_name} preferred={profile.data.preferred_name}/>
  <ImageUpload slug="" kind="avatar" current={avatar?.data?.signedUrl??null} notice={query.imagem==='atualizada'?'Foto atualizada.':query.imagem==='removida'?'Foto removida.':undefined}/>
  <section><h2>Acesso e aparência</h2><p>{user.email}</p><a href="/auth/recuperar">Recuperar ou trocar minha senha</a><p>Escolha Claro, Escuro ou Sistema no seletor Aparência. Sua preferência é salva neste navegador.</p></section>
  <section><h2>Seus aceites</h2><ul>{consents.data.map(c=><li key={c.id}>{({terms:'Termos de uso',privacy:'Privacidade',sensitive_data:'Dados da gestação'} as Record<string,string>)[c.document]??c.document} · versão {c.version} · {new Date(c.accepted_at).toLocaleDateString('pt-BR')}</li>)}</ul><a href="/api/conta/exportar">Baixar meus dados</a></section>
  <DeleteAccount slug=""/>
 </main></BrandShell>;
}
