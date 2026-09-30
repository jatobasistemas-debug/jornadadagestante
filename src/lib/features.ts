import 'server-only';
import {notFound} from 'next/navigation';
import {requireClinic} from './access';
export async function requireFeature(slug:string,key:string){const c=await requireClinic(slug,['patient']);const f=await c.db.rpc('feature_enabled',{p_key:key,p_clinic:c.clinic.id});if(f.error)throw new Error('Não foi possível verificar este recurso.');if(!f.data)notFound();return c;}
