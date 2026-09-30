import 'server-only';
import {requireUser} from './access';
import {notFound} from 'next/navigation';
export async function requireCommunity(){const c=await requireUser();const r=await c.db.rpc('community_access');if(r.error)throw new Error('Não foi possível verificar o acesso à comunidade.');if(!r.data)notFound();return c;}
