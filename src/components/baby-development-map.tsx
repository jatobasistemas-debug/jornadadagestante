import { useId } from 'react';
import { developmentWeek, developmentWeeks } from '@/content/development-map';

function Week20Illustration() {
  return <svg viewBox="0 0 320 320" className="baby-illustration" aria-hidden="true" focusable="false">
    <ellipse className="baby-halo" cx="160" cy="160" rx="139" ry="145" />
    <path className="baby-orbit" d="M76 55C14 103 18 228 94 273M253 65C300 115 296 230 237 269" />
    <g className="baby-line" strokeLinecap="round" strokeLinejoin="round">
      <path className="baby-body" d="M191 139C217 145 236 169 233 196C230 228 206 253 177 252C155 252 139 240 132 224C125 207 132 189 147 185C134 175 134 164 143 154Z" />
      <path className="baby-body" d="M196 139C210 123 209 99 195 83C181 67 155 64 139 75C123 85 118 100 121 114L113 129L124 134C125 146 137 157 151 160C169 164 184 154 196 139Z" />
      <path d="M128 117Q135 121 141 117M124 139L133 140M177 105C192 101 195 123 181 128" />
      <path d="M190 167C178 166 171 179 166 190L149 161C145 153 136 155 137 163L147 198C152 211 165 211 174 203L193 184" />
      <path d="M207 217C196 215 184 225 175 231L156 216C148 211 143 218 149 225L170 244M151 161L146 150" />
    </g>
  </svg>;
}

export function BabyDevelopmentMap({ currentWeek, referenceWeek = 20 }: { currentWeek: number | null; referenceWeek?: number }) {
  const titleId = useId();
  const reference = developmentWeek(referenceWeek);
  if (!reference?.visual || !reference.content) return null;
  const visual = reference.visual;
  const actualWeek = currentWeek !== null && Number.isInteger(currentWeek) && currentWeek > 0 ? currentWeek : null;
  return <section className="development-map" aria-labelledby={titleId}>
    <div className="development-heading"><p className="eyebrow">Mapa do desenvolvimento</p><span>Uma semana de cada vez</span></div>
    <div className="development-editorial">
      <figure><Week20Illustration/><figcaption>{visual.caption}</figcaption></figure>
      <div className="development-copy">
        <p className="development-edition">Referência · Semana {referenceWeek}</p>
        <h2 id={titleId}>{visual.title}</h2>
        <p>{reference.content.baby}</p>
        <p className="development-current">{actualWeek === null ? 'Sua semana atual ainda não está disponível.' : `Sua gestação está na semana ${actualWeek}.`}</p>
        {actualWeek !== referenceWeek && <p className="form-note">A ilustração disponível é da semana {referenceWeek}. Ela não altera a semana da sua gestação.</p>}
        <a className="home-source" href={visual.source.url}>Fonte: NHS · Semana {referenceWeek} (em inglês)</a>
        <p className="form-note">{visual.review.status === 'pending' ? 'Referência educativa. Revisão profissional pendente.' : `Revisado por ${visual.review.reviewer}.`}</p>
      </div>
    </div>
    <ol className="development-scale" aria-label="Semanas de gestação, de 1 a 40">
      {developmentWeeks.map(entry => <li key={entry.week} aria-current={actualWeek === entry.week ? 'step' : undefined}
        data-reference={entry.week === referenceWeek ? 'true' : undefined}
        aria-label={`Semana ${entry.week}${actualWeek === entry.week ? ', sua semana atual' : ''}${entry.week === referenceWeek ? ', referência ilustrada' : ''}`}>
        <span>{entry.week}</span>
      </li>)}
    </ol>
    <p className="development-legend">Semana {referenceWeek}: referência ilustrada.{actualWeek && actualWeek <= 40 ? ` Semana ${actualWeek}: seu momento, marcado com contorno.` : ''} A exploração das outras semanas ficará disponível mais adiante.</p>
  </section>;
}
