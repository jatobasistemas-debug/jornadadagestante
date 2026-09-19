'use client';
import {useActionState,useState} from 'react';
import {saveProfile} from '@/app/[clinic]/conta/profile-actions';
export function ProfileForm({slug,name,preferred}:{slug:string;name:string;preferred:string|null}){
 const [full,setFull]=useState(name),[nickname,setNickname]=useState(preferred??'');
 const [state,action,pending]=useActionState(saveProfile.bind(null,slug),{} as {error?:string;success?:string});
 return <form action={action} className="journey-form"><label>Seu nome<input name="full_name" value={full} onChange={e=>setFull(e.target.value)} required maxLength={160} autoComplete="name"/></label><label>Como gostaria de ser chamada, se quiser<input name="preferred_name" value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={80} autoComplete="nickname"/></label>{state.error&&<p role="alert">{state.error}</p>}{state.success&&<p role="status">{state.success}</p>}<button disabled={pending}>{pending?'Salvando…':'Salvar nome'}</button></form>;
}
