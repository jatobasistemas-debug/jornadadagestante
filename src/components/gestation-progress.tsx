import type {gestation} from '@/lib/gestation';
export type GestationalAge = NonNullable<ReturnType<typeof gestation>>;

export function GestationProgress({age, dueDate, hasActive, compact = false}: {
  age: GestationalAge | null; dueDate?: string; hasActive: boolean; compact?: boolean;
}) {
  return <section className={`home-progress${compact ? ' week-progress' : ''}`} aria-label="Sua gestação hoje">
    {age ? <>
      <div className="progress-heading">
        <div><p className="eyebrow">Sua gestação hoje</p><p className="week-number"><strong>{age.week}</strong> {age.week === 1 ? 'semana' : 'semanas'} <small>e {age.day} {age.day === 1 ? 'dia' : 'dias'}</small></p></div>
        <span className="trimester">{age.trimester}º trimestre</span>
      </div>
      <div className="progress-label"><span>{age.week} de 40 semanas</span><span>Cada história tem seu tempo</span></div>
      <progress value={age.progress} max={100} aria-label="Progresso estimado da gestação" aria-valuetext={`${age.week} semanas e ${age.day} dias, referência de 40 semanas`}/>
      {dueDate && <p className="form-note">Data prevista do parto: {new Date(dueDate + 'T12:00:00Z').toLocaleDateString('pt-BR', {timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric'})}. Uma estimativa, não um prazo.</p>}
    </> : <><h2>Um espaço para o seu momento.</h2><p>{hasActive ? 'Converse com sua clínica para conferir a data registrada. Não foi possível calcular a semana com segurança.' : 'Sem gestação ativa no momento. Seu perfil e suas informações de privacidade continuam disponíveis.'}</p></>}
  </section>;
}
