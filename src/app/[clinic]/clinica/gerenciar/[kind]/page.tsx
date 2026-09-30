import {AdminWorkspace} from '@/components/admin-workspace';
export default async function Page({params}:{params:Promise<{clinic:string;kind:string}>}){const p=await params;return <AdminWorkspace scope={p.clinic} kind={p.kind}/>;}
