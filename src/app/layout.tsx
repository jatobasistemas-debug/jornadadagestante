import type { Metadata } from 'next';
import { defaultTheme, themeStyle } from '@/lib/theme';
import './globals.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{default:'Jornada da Gestante',template:'%s | Jornada da Gestante'},description:'Primeiro cuidar. Depois oferecer. Uma experiência da Jatobá Sistemas.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR" style={themeStyle(defaultTheme)}><body><a className="skip" href="#conteudo">Pular para o conteúdo</a>{children}</body></html>;}
