import {requireClinic} from '@/lib/access';
import {DeleteAccount} from '@/components/delete-account';
import {BrandShell} from '@/components/brand-shell';
import {ImageUpload} from '@/components/image-upload';
export default async function Account({params,searchParams}:{params:Promise<{clinic:string}>;searchParams:Promise<{imagem?:string}>}){
 const query=await searchParams;
 const notice=query.imagem==='atualizada'?'Foto atualizada.':query.imagem==='removida'?'Foto removida.':undefined;
 const {clinic:slug}=await params;const {db,user,clinic}=await requireClinic(slug,['patient']);
 const [consents,profile]=await Promise.all([
  db.from('consent_records').select('document,version,accepted_at').eq('user_id',user.id).eq('clinic_id',clinic.id),
  db.from('profiles').select('avatar_path').eq('user_id',user.id).single(),
 ]);
 if(consents.error||profile.error)throw new Error('Não foi possível carregar sua conta.');
 let avatar:string|null=null;
 if(profile.data.avatar_path){const signed=await db.storage.from('avatars').createSignedUrl(profile.data.avatar_path,120);if(signed.error)throw new Error('Não foi possível carregar sua foto.');avatar=signed.data.signedUrl;}
 const labels:Record<string,string>={terms:'Termos de uso',privacy:'Política de privacidade',sensitive_data:'Uso dos dados de gestação'};
 return <BrandShell clinic={clinic} signedIn><main id="conteudo" className="content narrow stack"><h1>Privacidade e conta</h1>
  <ImageUpload slug={slug} kind="avatar" current={avatar} notice={notice}/>
  <section className="panel"><p>{user.email}</p><h2>Seus aceites</h2><ul>{consents.data.map(c=><li key={c.document}>{labels[c.document]}, versão {c.version}, aceito em {new Date(c.accepted_at).toLocaleDateString('pt-BR',{timeZone:'UTC'})}.</li>)}</ul><p><a href="/api/conta/exportar">Baixar meus dados</a></p><p><a href="/termos">Termos de uso</a> · <a href="/privacidade">Política de privacidade</a></p></section>
  <DeleteAccount slug={slug}/>
 </main></BrandShell>;
}
