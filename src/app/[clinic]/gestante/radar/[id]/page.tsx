import {requireFeature} from '@/lib/features';
import {PatientShell} from '@/components/patient-shell';
import {EditorialArticle} from '@/components/editorial-article';
import {notFound} from 'next/navigation';
export default async function Page({params}:{params:Promise<{clinic:string;id:string}>}){const {clinic:slug,id}=await params;const {db,clinic}=await requireFeature(slug,'radar');const r=await db.from('editorial_content').select('*').eq('id',id).eq('kind','radar').eq('status','published').eq('review_status','approved').maybeSingle();if(r.error)throw new Error('Não foi possível carregar a leitura.');if(!r.data)notFound();return <PatientShell clinic={clinic} current="gestante"><main id="conteudo"><EditorialArticle entry={r.data}/></main></PatientShell>;}
