import {requireClinic} from '@/lib/access';
import {BrandShell} from '@/components/brand-shell';
import {FeatureSettings} from '@/components/admin-workspace';
import {ManageForm} from '@/components/manage-form';
import {staff} from '@/app/gestao/actions';
import {gestation} from '@/lib/gestation';
import {z} from 'zod';
export default async function Staff({params,searchParams}:{params:Promise<{clinic:string}>;searchParams:Promise<{de?:string;ate?:string;pagina?:string}>}){
 const {clinic:slug}=await params;const {db,clinic,role}=await requireClinic(slug,['clinic_admin','clinic_staff']);const q=await searchParams;
 const from=z.iso.date().safeParse(q.de),to=z.iso.date().safeParse(q.ate);const page=Math.max(1,Math.min(10000,Number(q.pagina)||1));
 let query=db.rpc('clinic_roster',{p_clinic:clinic.id},{count:'exact'}).order('created_at',{ascending:false});
 if(from.success)query=query.gte('created_at',from.data+'T00:00:00Z');if(to.success)query=query.lte('created_at',to.data+'T23:59:59Z');
 const [patients,active,team]=await Promise.all([query.range((page-1)*50,page*50-1),db.rpc('clinic_roster',{p_clinic:clinic.id},{count:'exact',head:true}).eq('status','active'),db.from('clinic_memberships').select('user_id,role,active').eq('clinic_id',clinic.id).neq('role','patient')]);
 if(patients.error||active.error||team.error)throw new Error('Não foi possível carregar a clínica.');
 return <BrandShell clinic={clinic} signedIn><main id="conteudo" className="content admin-page"><p className="eyebrow">Painel da clínica</p><h1>{clinic.name}</h1><p>{active.count} gestantes ativas · {patients.count} cadastros no período selecionado</p>
 {role==='clinic_admin'&&<nav className="row" aria-label="Gerenciar clínica"><a href={`/${slug}/clinica/tema`}>Identidade e contatos</a>{[['services','Serviços'],['professionals','Profissionais'],['codes','Códigos, links e QR'],['campaigns','Campanhas']].map(([k,t])=><a key={k} href={`/${slug}/clinica/gerenciar/${k}`}>{t}</a>)}</nav>}
 <section><h2>Gestantes vinculadas</h2><p>Informações operacionais. Diários, fotos, cartas e ultrassons permanecem privados.</p><form className="row"><label>De<input type="date" name="de" defaultValue={q.de}/></label><label>Até<input type="date" name="ate" defaultValue={q.ate}/></label><button>Filtrar período</button></form><a href={`/${slug}/clinica/relatorio?de=${from.success?from.data:''}&ate=${to.success?to.data:''}`}>Baixar relatório do período (CSV)</a>
 {!patients.data.length&&<p>Nenhum cadastro neste período.</p>}<ol className="admin-list">{patients.data.map((p:{id:string;display_name:string;status:string;due_date:string;created_at:string})=><li key={p.id}><strong>{p.display_name}</strong><p>{p.status==='active'?`Semana ${gestation(p.due_date)?.week??'não disponível'}`:p.status} · Entrada {new Date(p.created_at).toLocaleDateString('pt-BR')}</p></li>)}</ol><nav className="row">{page>1&&<a href={`?pagina=${page-1}&de=${q.de??''}&ate=${q.ate??''}`}>Anteriores</a>}{(patients.count??0)>page*50&&<a href={`?pagina=${page+1}&de=${q.de??''}&ate=${q.ate??''}`}>Próximos</a>}</nav></section>
 {role==='clinic_admin'&&<><section><h2>Equipe</h2><ul>{team.data.map(m=><li key={m.user_id}>{m.user_id} · {m.role} · {m.active?'ativo':'inativo'}</li>)}</ul><p>Informe o identificador de uma conta já cadastrada para conceder ou revogar acesso.</p><ManageForm action={staff.bind(null,slug)} fields={[{name:'user_id',label:'Identificador da conta',required:true},{name:'role',label:'Papel',options:['clinic_staff','clinic_admin']},{name:'active',label:'Acesso ativo',type:'checkbox'}]}/></section><FeatureSettings scope={slug}/></>}
 </main></BrandShell>;
}
