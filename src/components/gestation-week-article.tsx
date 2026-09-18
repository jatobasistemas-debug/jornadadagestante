import Link from 'next/link';
import type {PublishedWeek} from '@/content/gestation-weeks';
import type {ClinicService} from '@/lib/contextual-services';
import {GestationProgress, type GestationalAge} from './gestation-progress';
import {ContextualServices} from './contextual-services';

export function GestationWeekArticle({week, content, slug, clinicName, name, age, dueDate, hasActive, services}: {
  week: number; content: PublishedWeek; slug: string; clinicName: string; name: string;
  age: GestationalAge | null; dueDate?: string; hasActive: boolean; services: ClinicService[];
}) {
  const detail = content.detail;
  return <main id="conteudo" className="week-page">
    <Link className="week-back" href={`/${slug}/gestante`}><span aria-hidden="true">← </span>Voltar ao início</Link>
    <article aria-labelledby="week-title">
      <div className="week-hero">
        <div className="week-opening">
          <p className="week-edition">Semana <span>{week}</span><span className="week-edition-caption">Leitura da semana</span></p>
          <h1 id="week-title">{detail.title}</h1>
          <p className="week-introduction">{detail.introduction}</p>
        </div>
        <div className="week-current">
          <p className="week-personal">{name}, este é o seu momento.</p>
          <GestationProgress age={age} dueDate={dueDate} hasActive={hasActive} compact/>
          {age && age.week !== week && <p className="week-current-note">Você está lendo sobre a semana {week}. Sua gestação está na semana {age.week}, conforme a data prevista do parto.</p>}
          {!age && <p className="week-current-note">Esta é uma leitura sobre a semana {week}, sem indicação da sua semana atual.</p>}
        </div>
      </div>

      <section className="week-baby" aria-labelledby="baby-title">
        <div className="week-section-heading"><p className="week-label">Seu bebê</p><h2 id="baby-title">{detail.babyTitle}</h2></div>
        <div className="week-prose"><p>{content.baby}</p><a className="week-reference" href="#source-week20">Fonte: desenvolvimento na semana {week}</a></div>
      </section>

      <div className="week-pair">
        <section className="week-you" aria-labelledby="you-title">
          <p className="week-label">Você</p><h2 id="you-title">{detail.youTitle}</h2>
          <p>{content.you}</p><p className="week-small">Não há uma lista de sensações que você precise cumprir.</p>
        </section>
        <aside className="week-curiosity" aria-labelledby="curiosity-title">
          <p className="week-label">Curiosidade</p><h2 id="curiosity-title">{detail.curiosity.title}</h2>
          <p>{detail.curiosity.text}</p><a className="week-reference" href={`#source-${detail.curiosity.sourceId}`}>Fonte desta curiosidade</a>
        </aside>
      </div>

      <section className="week-observe" aria-labelledby="observe-title">
        <div className="week-section-heading"><p className="week-label">Para observar</p><h2 id="observe-title">{detail.educationalAlert.title}</h2></div>
        <div className="week-prose">{detail.educationalAlert.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<a className="week-reference" href={`#source-${detail.educationalAlert.sourceId}`}>Fonte: movimentos do bebê</a><p className="week-small">Informação educativa. Não é um diagnóstico e não substitui o acompanhamento da sua equipe.</p></div>
      </section>

      <section className="week-keep" aria-labelledby="keep-title">
        <p className="week-label">Para guardar</p><h2 id="keep-title">{content.question}</h2>
        <p>Uma frase, um gesto, um instante. Ou apenas viver o momento. Você não precisa escrever nem responder agora.</p>
      </section>

      <section className="week-care" aria-labelledby="care-title">
        <div><p className="week-label">Seu cuidado</p><h2 id="care-title">Espaço para conversar.</h2><p>{detail.care.text}</p><a className="week-reference" href={`#source-${detail.care.sourceId}`}>Fonte deste cuidado</a></div>
        <div className="week-clinic"><h3>Com {clinicName}</h3><ContextualServices services={services} emptyMessage="Não há serviços relacionados para exibir nesta semana." showLinks/></div>
      </section>

      <section className="week-sources" aria-labelledby="sources-title">
        <h2 id="sources-title">Sobre esta leitura</h2>
        <p>Conteúdo educativo central da Jatobá, baseado nas fontes abaixo. Revisão profissional pendente.</p>
        <ul>{detail.sources.map(source => <li id={`source-${source.id}`} key={source.id}><a href={source.url}>{source.title} <span className="week-small">(em inglês)</span></a><span className="week-source-date">Consultado em {source.consultedAt.split('-').reverse().join('/')}</span></li>)}</ul>
        <Link className="week-back" href={`/${slug}/gestante`}>Voltar para o seu início <span aria-hidden="true">↗</span></Link>
      </section>
    </article>
  </main>;
}
