import { themeModesStyle } from '@/lib/theme-modes';
import { ColorModePicker } from './color-mode-picker';
import type { Clinic } from '@/lib/access';
import { signOut } from '@/app/auth/actions';
export function BrandShell({clinic,children,signedIn=false}:{clinic?:Clinic;children:React.ReactNode;signedIn?:boolean}){
 return <div className="shell theme-scope" style={clinic?themeModesStyle(clinic.tokens):undefined}><header><div><a className="brand" href={clinic?`/${clinic.slug}`:'/'}>Jornada da Gestante</a><p className="co-brand">{clinic?`com ${clinic.name}`:'Jatobá Sistemas'}</p></div><div className="row">{clinic?.logo_url&&<img className="clinic-logo" src={clinic.logo_url} alt={clinic.name} referrerPolicy="no-referrer"/>}<ColorModePicker/>{signedIn&&<form action={signOut}><button className="secondary">Sair</button></form>}</div></header>{children}<footer>Primeiro cuidar. Depois oferecer. <span aria-hidden="true">·</span> Jatobá Sistemas</footer></div>;
}
