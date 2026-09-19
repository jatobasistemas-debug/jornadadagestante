'use client';
import {useActionState,useState} from 'react';
import Link from 'next/link';
import {saveMemory,deleteMemory,type MemoryState} from '@/app/[clinic]/gestante/memorias/actions';
import {memoryKinds,hasAttachment,type MemoryKind,type MemoryRecord} from '@/lib/memories';
import {recordWeek} from '@/lib/journey-records';
export function MemoryForm({slug,id,today,dueDate,initial,kind='memory'}:{slug:string;id:string;today:string;dueDate:string;initial?:MemoryRecord;kind?:MemoryKind}){
 const [category,setCategory]=useState<MemoryKind>(initial?.category??kind);
 const [date,setDate]=useState(initial?.occurred_on??today);
 const [body,setBody]=useState(initial?.body??'');
 const [state,action,pending]=useActionState(saveMemory.bind(null,slug,initial?.id??null),{} as MemoryState);
 const week=recordWeek(dueDate,date),attachment=hasAttachment(category);
 return <form action={action} className="journey-form" aria-busy={pending}>
  <input type="hidden" name="id" value={id}/>
  <label>Tipo do registro{initial?<><input type="hidden" name="category" value={category}/><p>{memoryKinds[category]}</p></>:<select name="category" value={category} onChange={e=>setCategory(e.target.value as MemoryKind)}>{Object.entries(memoryKinds).filter(([k])=>k!=='moment').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>}</label>
  {!initial&&attachment&&<label>Arquivo privado<input key={category} type="file" name="file" accept={category==='ultrasound'?'image/png,image/jpeg,image/webp,application/pdf':'image/png,image/jpeg,image/webp'} required/><span className="form-note">PNG, JPEG ou WebP{category==='ultrasound'?' e PDF':''}, até 2 MB. {category==='ultrasound'?'Este espaço apenas guarda o exame, sem interpretação.':''}</span></label>}
  <label>{category==='ultrasound'?'Data do exame':'Data'}<input type="date" name="date" value={date} max={today} required onChange={e=>setDate(e.target.value)} aria-describedby="memory-week"/></label>
  <p id="memory-week" className="form-note" aria-live="polite">{week===null?'Semana não estimada para esta data.':`Semana ${week}, calculada pela sua data prevista do parto.`}</p>
  <label>{category==='letter'?'Palavras para o seu bebê':attachment?'Legenda ou observação, se quiser':'O que você gostaria de lembrar?'}<textarea name="body" value={body} onChange={e=>setBody(e.target.value)} required={!attachment} rows={category==='letter'?14:8} maxLength={category==='letter'?20000:2000}/></label>
  <p className="journey-privacy">Só você tem acesso. A clínica não pode ler suas memórias. {category==='letter'?'Escreva quando fizer sentido, no seu tempo.':''}</p>
  {state.error&&<p role="alert" className="message error">{state.error}</p>}
  <div className="journey-form-actions"><button disabled={pending}>{pending?'Guardando…':'Guardar'}</button><Link href={initial?`/${slug}/gestante/memorias/${id}`:`/${slug}/gestante/memorias`}>Voltar sem guardar</Link></div>
 </form>;
}
export function DeleteMemory({slug,id}:{slug:string;id:string}){
 const [state,action,pending]=useActionState(deleteMemory.bind(null,slug,id),{} as MemoryState);
 return <details className="memory-delete"><summary>Excluir este registro</summary><form action={action} className="stack"><p>O texto e o arquivo deste registro serão excluídos permanentemente.</p><label className="check"><input type="checkbox" name="confirm" required/> Quero excluir este registro.</label>{state.error&&<p role="alert">{state.error}</p>}<button disabled={pending}>{pending?'Excluindo…':'Excluir definitivamente'}</button></form></details>;
}
