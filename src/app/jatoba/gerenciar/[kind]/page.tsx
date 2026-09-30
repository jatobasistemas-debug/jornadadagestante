import {AdminWorkspace} from '@/components/admin-workspace';
export default async function Page({params}:{params:Promise<{kind:string}>}){return <AdminWorkspace scope="jatoba" kind={(await params).kind}/>;}
