import {recordDateLabel,recordLabel,type JourneyRecord} from '@/lib/journey-records';

export function JourneyTimeline({records}:{records:JourneyRecord[]}) {
  return <ol className="journey-timeline" aria-label="Seus registros, do mais recente ao mais antigo">
    {records.map(record=><li key={record.id} className={`journey-entry journey-entry-${record.category}`}>
      <article aria-labelledby={`record-${record.id}`}>
        <div className="journey-entry-date"><time dateTime={record.occurred_on}>{recordDateLabel(record.occurred_on)}</time>
          <span>{record.gestational_week===null?'Semana não estimada':`Semana ${record.gestational_week}`}</span></div>
        <div className="journey-entry-copy"><h2 id={`record-${record.id}`}>{recordLabel(record.category)}</h2>
          <p>{record.body || 'Um momento guardado.'}</p></div>
      </article>
    </li>)}
  </ol>;
}
export function JourneyEmpty({hasActive}:{hasActive:boolean}) {
  return <section className="journey-empty" aria-labelledby="journey-empty-title">
    <p className="eyebrow">No seu tempo</p><h2 id="journey-empty-title">Sua história começa<br/>quando você quiser.</h2>
    <p>Uma lembrança pequena também pode ter um lugar aqui. Você escolhe o que guardar, e quando.</p>
    {!hasActive&&<p className="form-note">Não há uma gestação ativa para novos registros. Quando houver, este espaço estará aqui para você.</p>}
  </section>;
}
