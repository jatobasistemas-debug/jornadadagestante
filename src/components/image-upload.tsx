'use client';
import {useActionState} from 'react';
import {Submit} from './submit';
import {uploadLogo,removeLogo} from '@/app/[clinic]/clinica/tema/image-actions';
import {uploadAvatar,removeAvatar} from '@/app/[clinic]/conta/image-actions';
export function ImageUpload({slug,kind,current,notice}:{slug:string;kind:'logo'|'avatar';current:string|null;notice?:string}){
 const [state,action]=useActionState((kind==='logo'?uploadLogo:uploadAvatar).bind(null,slug),{});
 const [removed,remove]=useActionState((kind==='logo'?removeLogo:removeAvatar).bind(null,slug),{});
 return <section className="panel stack"><h2>{kind==='logo'?'Logo da clínica':'Sua foto de perfil'}</h2>
  {notice&&<p role="status" className="message">{notice}</p>}
  {current&&<img src={current} alt={kind==='logo'?'Logo atual da clínica':'Sua foto de perfil'} className={kind==='logo'?'clinic-logo':'avatar'} referrerPolicy="no-referrer"/>}
  <form action={action} className="form"><label>{kind==='logo'?'Arquivo da logo original':'Foto de perfil, opcional'}<input type="file" name="image" accept="image/png,image/jpeg,image/webp" required/></label><p className="form-note">PNG, JPEG ou WebP, até 2 MB. {kind==='logo'?'O arquivo será preservado sem alterações.':'A foto é privada.'}</p>
  {state.error&&<p role="alert" className="error">{state.error}</p>}{state.success&&<p role="status" className="message">{state.success}</p>}<Submit>{kind==='logo'?'Enviar logo':'Enviar foto'}</Submit></form>
  {current&&<form action={remove}><Submit>{kind==='logo'?'Remover logo':'Remover foto'}</Submit></form>}
  {removed.error&&<p role="alert" className="error">{removed.error}</p>}{removed.success&&<p role="status" className="message">{removed.success}</p>}
 </section>;
}
