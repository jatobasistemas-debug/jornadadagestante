import type { Metadata } from 'next';
import { defaultTheme } from '@/lib/theme';
import { themeModesStyle } from '@/lib/theme-modes';
import { colorModeScript } from '@/lib/color-mode';
import './globals.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{default:'Jornada da Gestante',template:'%s | Jornada da Gestante'},description:'Primeiro cuidar. Depois oferecer. Uma experiência da Jatobá Sistemas.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR" suppressHydrationWarning style={themeModesStyle(defaultTheme)}><head><script dangerouslySetInnerHTML={{__html:colorModeScript}}/></head><body><a className="skip" href="#conteudo">Pular para o conteúdo</a>{children}</body></html>;}
