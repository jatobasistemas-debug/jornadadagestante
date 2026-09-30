'use client';
import {useActionState} from 'react';
import {Submit} from './submit';
import type {Field} from '@/lib/admin-catalog';
import type {ManageState} from '@/app/gestao/actions';
export function ManageForm({action,fields,values={},label='Salvar',deletable=false,choices={}}:{action:(s:ManageState,f:FormData)=>Promise<ManageState>;fields:Field[];values?:Record<string,unknown>;label?:string;deletable?:boolean;choices?:Record<string,{value:string;label:string}[]>}){
 const [state,submit]=useActionState(action,{});
 return <form action={submit} className="form manage-form">{fields.map(f=>{
  const raw=values[f.name];const value=raw==null?'':String(raw);const options=choices[f.name]??f.options?.map(value=>({value,label:value}));
  return <label key={f.name} className={f.type==='checkbox'?'check':undefined}>{f.type==='checkbox'?<><input type="checkbox" name={f.name} defaultChecked={raw===true}/>{f.label}</>:<>{f.label}{options?<select name={f.name} defaultValue={value} required={f.required}>{!f.required&&<option value="">Não definido</option>}{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:f.type==='textarea'?<textarea name={f.name} defaultValue={value} required={f.required} rows={6} maxLength={f.max??2000}/>:<input name={f.name} type={f.type??'text'} defaultValue={f.type==='datetime-local'?value.slice(0,16):value} required={f.required} maxLength={f.max??160} min={f.type==='number'?0:undefined}/>}</>}</label>;
 })}{state.error&&<p className="error" role="alert">{state.error}</p>}{state.success&&<p className="message" role="status">{state.success}</p>}<Submit>{label}</Submit>{deletable&&<details><summary>Excluir registro</summary><p>Esta ação é permanente. Registros com vínculos podem precisar ser desativados.</p><label className="check"><input name="confirm" type="checkbox"/>Confirmo a exclusão deste registro</label><button name="operation" value="delete" className="secondary" formNoValidate>Excluir</button></details>}</form>;
}
