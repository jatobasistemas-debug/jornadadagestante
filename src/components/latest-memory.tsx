import Link from 'next/link';
import {requireClinic} from '@/lib/access';
import {memoryKinds,type MemoryKind} from '@/lib/memories';
import {recordDateLabel} from '@/lib/journey-records';
export async function LatestMemory({slug}:{slug:string}){
 const {db,user,clinic}=await requireClinic(slug,['patient']);
 const result=await db.from('private_memories').select('id,category,occurred_on').eq('user_id',user.id).eq('clinic_id',clinic.id).order('occurred_on',{ascending:false}).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(1).maybeSingle();
 if(result.error)throw new Error('Não foi possível carregar sua última memória.');
 if(!result.data)return null;
 return <section className="memory-latest" aria-label="Sua última memória"><p className="eyebrow">Um instante que ficou</p><h2>Sua história tem um lugar aqui.</h2><p>{memoryKinds[result.data.category as MemoryKind]} · {recordDateLabel(result.data.occurred_on)}</p><Link href={`/${slug}/gestante/memorias/${result.data.id}`}>Revisitar sua última memória</Link></section>;
}
