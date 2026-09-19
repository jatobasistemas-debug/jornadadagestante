import {requireClinic} from '@/lib/access';
import {DeleteAccount} from '@/components/delete-account';
import {PatientShell} from '@/components/patient-shell';
import {ImageUpload} from '@/components/image-upload';
import {ProfileForm} from '@/components/profile-form';
import {recordDateLabel} from '@/lib/journey-records';
import {gestation} from '@/lib/gestation';
export const metadata={title:'Perfil'};
export default async function Account({params,searchParams}:{params:Promise<{clinic:string}>;searchParams:Promise<{imagem?:string}>}){
 const query=await searchParams;
 const notice=query.imagem==='atualizada'?'Foto atualizada.':query.imagem==='removida'?'Foto removida.':undefined;
 const {clinic:slug}=await params;const {db,user,clinic}=await requireClinic(slug,['patient']);
 const [consents,profile,pregnancies]=await Promise.all([
  db.from('consent_records').select('document,version,accepted_at').eq('user_id',user.id).eq('clinic_id',clinic.id),
  db.from('profiles').select('avatar_path,full_name,preferred_name').eq('user_id',user.id).single(),
  db.from('pregnancies').select('id,due_date,last_menstrual_period,status').eq('user_id',user.id).eq('clinic_id',clinic.id).order('created_at',{ascending:false}),
 ]);
 if(consents.error||profile.error||pregnancies.error)throw new Error('Não foi possível carregar sua conta.');
 let avatar:string|null=null;
 if(profile.data.avatar_path){const signed=await db.storage.from('avatars').createSignedUrl(profile.data.avatar_path,120);if(signed.error)throw new Error('Não foi possível carregar sua foto.');avatar=signed.data.signedUrl;}
 const labels:Record<string,string>={terms:'Termos de uso',privacy:'Política de privacidade',sensitive_data:'Uso dos dados de gestação'};
 return <PatientShell clinic={clinic} current="conta"><main id="conteudo" className="content narrow stack"><p className="eyebrow">Seu espaço</p><h1>Perfil</h1>
  <ProfileForm slug={slug} name={profile.data.full_name} preferred={profile.data.preferred_name}/>
  <ImageUpload slug={slug} kind="avatar" current={avatar} notice={notice}/>
  <section><h2>Sua gestação</h2>{pregnancies.data.length?pregnancies.data.map(p=><dl className="profile-data" key={p.id}><dt>Situação</dt><dd>{({active:'Em andamento',paused:'Pausada',completed:'Concluída',closed:'Encerrada'} as Record<string,string>)[p.status]??'Encerrada'}</dd><dt>Data prevista do parto</dt><dd>{recordDateLabel(p.due_date)}</dd>{p.last_menstrual_period&&<><dt>Data da última menstruação</dt><dd>{recordDateLabel(p.last_menstrual_period)}</dd></>}{p.status==='active'&&gestation(p.due_date)&&<><dt>Semana atual</dt><dd>{gestation(p.due_date)!.week}</dd></>}</dl>):<p>Nenhuma gestação cadastrada.</p>}<p className="form-note">Datas informadas no cadastro. A semana é uma estimativa, não substitui a avaliação do pré-natal.</p></section>
  <section><h2>Aparência</h2><p>Use o seletor Aparência no topo para escolher Claro, Escuro ou Sistema. Sua escolha fica salva neste navegador.</p></section>
  <section><h2>Acesso à conta</h2><p>E-mail: {user.email}</p><a href="/auth/recuperar">Recuperar ou trocar minha senha</a></section>
  <section className="panel"><p>{user.email}</p><h2>Seus aceites</h2><ul>{consents.data.map(c=><li key={c.document}>{labels[c.document]}, versão {c.version}, aceito em {new Date(c.accepted_at).toLocaleDateString('pt-BR',{timeZone:'UTC'})}.</li>)}</ul><p><a href="/api/conta/exportar">Baixar meus dados</a></p><p><a href="/termos">Termos de uso</a> · <a href="/privacidade">Política de privacidade</a></p></section>
  <DeleteAccount slug={slug}/>
 </main></PatientShell>;
}
