import {requireSuperadmin} from '@/lib/access';
import {BrandShell} from '@/components/brand-shell';
import {ManageForm} from '@/components/manage-form';
import {FeatureSettings} from '@/components/admin-workspace';
import {createClinic,updateClinic,setSubscription} from '@/app/gestao/actions';
export default async function Jatoba(){
 const {db}=await requireSuperadmin();const [clinics,metrics,subscriptions,plans]=await Promise.all([db.from('clinics').select('*').order('name'),db.rpc('platform_metrics'),db.from('subscriptions').select('*').order('starts_at',{ascending:false}).limit(200),db.from('access_plans').select('id,name').order('name')]);
 if(clinics.error||metrics.error||subscriptions.error||plans.error)throw new Error('Não foi possível carregar a plataforma.');
 return <BrandShell signedIn><main id="conteudo" className="content admin-page"><p className="eyebrow">Jatobá Sistemas</p><h1>Gestão da plataforma</h1><dl className="admin-metrics"><div><dt>Contas</dt><dd>{metrics.data.users}</dd></div><div><dt>Clínicas ativas</dt><dd>{metrics.data.active_clinics}</dd></div><div><dt>Gestações</dt><dd>{metrics.data.pregnancies}</dd></div><div><dt>Acessos patrocinados</dt><dd>{metrics.data.sponsored}</dd></div></dl>
 <nav className="row" aria-label="Gestão">{[['plans','Planos'],['codes','Códigos e QR'],['campaigns','Campanhas'],['professionals','Profissionais'],['services','Serviços']].map(([k,t])=><a key={k} href={`/jatoba/gerenciar/${k}`}>{t}</a>)}</nav>
 <details className="panel"><summary>Criar clínica</summary><ManageForm action={createClinic} fields={[{name:'name',label:'Nome',required:true},{name:'slug',label:'Endereço da clínica',required:true}]}/></details>
 <h2>Clínicas</h2>{clinics.data.map(c=><section key={c.id} className="panel"><h3>{c.name}</h3><p>{c.status} · /{c.slug}</p><a href={`/${c.slug}`}>Página pública</a> · <a href={`/${c.slug}/clinica/tema`}>Logo, tema e contatos</a><details><summary>Configuração administrativa</summary><ManageForm action={updateClinic.bind(null,c.id)} values={c} fields={[{name:'name',label:'Nome',required:true},{name:'status',label:'Status',options:['pending','active','suspended']},{name:'cnpj',label:'CNPJ'},{name:'monthly_cents',label:'Mensalidade da clínica em centavos',type:'number',required:true},{name:'payment_status',label:'Status financeiro cadastrado',options:['paid','pending','suspended']},{name:'renewal_date',label:'Renovação',type:'date'}]}/></details></section>)}
 <nav className="product-links"><a href="/jatoba/editorial">Conteúdo e Radar</a><a href="/jatoba/moderacao">Moderação</a></nav><FeatureSettings scope="jatoba"/>
 <h2>Assinaturas e acessos</h2><p>Alterações aqui são administrativas e ficam registradas. Não processam nem comprovam pagamentos.</p><ManageForm action={setSubscription} choices={{plan_id:plans.data.map(p=>({value:p.id,label:p.name})),sponsor_id:clinics.data.map(c=>({value:c.id,label:c.name}))}} fields={[{name:'user_id',label:'Identificador da conta existente',required:true},{name:'status',label:'Estado do acesso',options:['trial','active','sponsored','past_due','cancelled','expired']},{name:'plan_id',label:'Plano'},{name:'sponsor_id',label:'Patrocinador (somente acesso patrocinado)'},{name:'ends_at',label:'Fim do acesso',type:'date'}]}/>
 <ul>{subscriptions.data.map(s=><li key={s.id}>{s.user_id} · {s.status} · origem: {s.origin}</li>)}</ul>
 </main></BrandShell>;
}
