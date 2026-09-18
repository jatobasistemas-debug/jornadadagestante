import Link from 'next/link';
import type {Clinic} from '@/lib/access';
import {themeStyle} from '@/lib/theme';
import {signOut} from '@/app/auth/actions';
export function Shell({children,clinic,signedIn=false}:{children:React.ReactNode;clinic?:Clinic;signedIn?:boolean}) {return <div className="tenant" style={clinic?themeStyle(clinic.tokens):undefined}>
<a className="skip" href="#main">Ir para o conteúdo</a>
<header className="masthead"><div className="identity">{clinic?.logo_url&&<img className="brand-logo" src={clinic.logo_url} alt={clinic.name}/>}<div><Link className="brand" href={clinic?`/${clinic.slug}`:'/'}>Jornada da Gestante</Link>{clinic&&<small>com {clinic.name}</small>}</div></div>{signedIn&&<nav><Link href="/acesso">Meus acessos</Link><form action={signOut}><button className="secondary">Sair</button></form></nav>}</header>
<main id="main">{children}</main><footer className="footer"><span>Jornada da Gestante · Jatobá Sistemas</span><nav><Link href="/termos">Termos</Link><Link href="/privacidade">Privacidade</Link></nav></footer></div>;}
