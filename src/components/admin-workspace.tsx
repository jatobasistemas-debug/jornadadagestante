import {requireClinic,requireSuperadmin} from '@/lib/access';
import {adminCatalog,AdminKind,Field} from '@/lib/admin-catalog';
import {manage,setFlag} from '@/app/gestao/actions';
import {ManageForm} from './manage-form';
import {BrandShell} from './brand-shell';
import {notFound} from 'next/navigation';
import {appUrl} from '@/lib/config';
export async function AdminWorkspace({scope,kind}:{scope:string;kind:string}){
 if(!Object.hasOwn(adminCatalog,kind))notFound();const k=kind as AdminKind,def=adminCatalog[k];
 const ctx=scope==='jatoba'?{...await requireSuperadmin(),clinic:undefined}:await requireClinic(scope,['clinic_admin']);
 if(def.superOnly&&scope!=='jatoba')notFound();
 let query=ctx.db.from(def.table).select('*').order('id').limit(200);
 const clinic=ctx.clinic;if(clinic)query=query.eq('clinic_id',clinic.id);
 const result=await query;if(result.error)throw new Error('Não foi possível carregar esta área.');
 const clinics=scope==='jatoba'&&!def.superOnly?await ctx.db.from('clinics').select('id,name').order('name'):null;
 let serviceQuery=ctx.db.from('clinic_services').select('id,name,clinic_id').order('name');if(clinic)serviceQuery=serviceQuery.eq('clinic_id',clinic.id);
 const services=k==='campaigns'?await serviceQuery:null;
 if(clinics?.error||services?.error)throw new Error('Não foi possível carregar os vínculos.');
 const fields:Field[]=[...(!def.superOnly&&scope==='jatoba'?[{name:'clinic_id',label:'Clínica',required:true}]:[]),...def.fields];
 const choices={clinic_id:clinics?.data?.map(c=>({value:c.id,label:c.name}))??[],...(services?{service_id:services.data!.map(s=>({value:s.id,label:s.name}))}:{})};
 const base=scope==='jatoba'?'/jatoba':`/${scope}/clinica`;
 return <BrandShell signedIn clinic={clinic}><main id="conteudo" className="content admin-page"><a href={base}>Voltar ao painel</a><h1>{def.title}</h1><details className="panel"><summary>Novo registro</summary><ManageForm action={manage.bind(null,scope,k,null)} fields={fields} choices={choices} values={{starts_at:new Date().toISOString(),trial_days:0,priority:0,week_from:1,week_to:40}}/></details>
 {!result.data.length&&<p>Nenhum registro cadastrado.</p>}{result.data.map(row=><section className="panel" key={row.id}><h2>{row.name??row.label??row.title}</h2>{k==='codes'&&<><p>Código: <strong>{row.code}</strong> · {row.uses} uso(s)</p><p><a href={`${appUrl()}/parceiro?codigo=${row.code}`}>{`${appUrl()}/parceiro?codigo=${row.code}`}</a></p><a href={`/api/parceiro/qr/${row.id}`}>Baixar QR Code</a></>}<details><summary>Editar configurações</summary><ManageForm action={manage.bind(null,scope,k,row.id)} fields={fields} values={row} choices={choices} deletable/></details></section>)}{result.data.length===200&&<p>Exibindo os primeiros 200 registros.</p>}</main></BrandShell>;
}
export async function FeatureSettings({scope}:{scope:string}){const ctx=scope==='jatoba'?{...await requireSuperadmin(),clinic:undefined}:await requireClinic(scope,['clinic_admin']);const flags=await ctx.db.from('feature_flags').select('key,enabled').order('key');const overrides=scope==='jatoba'?null:await ctx.db.from('clinic_feature_flags').select('key,enabled').eq('clinic_id',ctx.clinic?.id??null);if(flags.error||overrides?.error)throw new Error('Não foi possível carregar módulos.');return <section><h2>Módulos</h2>{flags.data.map(f=><details key={f.key}><summary>{f.key} · plataforma {f.enabled?'ativa':'desativada'}</summary><ManageForm action={setFlag.bind(null,scope)} fields={[{name:'key',label:'Módulo',options:[f.key]},{name:'enabled',label:'Habilitado',type:'checkbox'}]} values={{key:f.key,enabled:scope==='jatoba'?f.enabled:overrides?.data?.find(o=>o.key===f.key)?.enabled??true}}/></details>)}</section>;}
