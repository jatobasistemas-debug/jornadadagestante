'use client';
import Link from 'next/link';
import {useActionState,useState} from 'react';
import {createJourneyRecord} from '@/app/[clinic]/gestante/jornada/actions';
import {recordKinds,recordWeek,RECORD_TEXT_LIMIT,type RecordFormState} from '@/lib/journey-records';

export function JourneyRecordForm({slug,dueDate,today,recordId}:{slug:string;dueDate:string;today:string;recordId:string}) {
  const [date,setDate]=useState(today);
  const [text,setText]=useState('');
  const [kind,setKind]=useState('diary');
  const [state,action,pending]=useActionState(createJourneyRecord.bind(null,slug),{} as RecordFormState);
  const week=recordWeek(dueDate,date);
  return <form action={action} className="journey-form" aria-busy={pending}>
    <input type="hidden" name="id" value={recordId}/>
    <div className="journey-form-meta">
      <label htmlFor="record-kind">Tipo do registro<select id="record-kind" name="kind" value={kind} onChange={event=>setKind(event.target.value)}>{Object.entries(recordKinds).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <div><label htmlFor="record-date">Data<input id="record-date" type="date" name="date" value={date} max={today} required onChange={event=>setDate(event.target.value)} aria-describedby="record-week"/></label>
        <p id="record-week" className="form-note" aria-live="polite">{week===null?'Semana não estimada para esta data.':`Semana ${week}, calculada pela sua data prevista do parto.`}</p></div>
    </div>
    <div><label htmlFor="record-text">O que você gostaria de lembrar desta fase?</label>
      <textarea id="record-text" name="text" rows={8} required maxLength={RECORD_TEXT_LIMIT} value={text} onChange={event=>setText(event.target.value)} aria-describedby="record-length record-private" placeholder="Pode ser só uma frase."/>
      <p id="record-length" className="form-note">Até 2.000 caracteres. Escreva o quanto fizer sentido para você.</p></div>
    <p id="record-private" className="journey-privacy">Privado para você. A clínica não tem acesso a este registro.</p>
    {state.error&&<p role="alert" className="message error">{state.error}</p>}
    <div className="journey-form-actions"><button type="submit" disabled={pending}>{pending?'Guardando…':'Guardar registro'}</button><Link href={`/${slug}/gestante/jornada`}>Voltar sem guardar</Link></div>
  </form>;
}
