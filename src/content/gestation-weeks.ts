// Catálogo central da Jatobá. Publicação editorial não equivale a revisão clínica.
// Não há personalização de orientação médica nem edição por clínica.
export type EditorialSource = {id: string; title: string; url: string; consultedAt: string};
export type WeeklyDetail = {
  title: string;
  introduction: string;
  babyTitle: string;
  youTitle: string;
  curiosity: {title: string; text: string; sourceId: string};
  care: {text: string; sourceId: string};
  educationalAlert: {title: string; paragraphs: string[]; sourceId: string};
  sources: EditorialSource[];
  publicationStatus: 'draft' | 'published';
};
export type WeekContent = {
  baby: string;
  you: string;
  question: string;
  services: string[];
  source: string;
  review: 'pending';
  detail?: WeeklyDetail;
};
export type PublishedWeek = WeekContent & {detail: WeeklyDetail};

const week20Source='https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-20/';
export const gestationWeeks: Record<number, WeekContent> = {
  20: {
    baby: 'O bebê se movimenta e pode levar o polegar à boca. Uma camada chamada vérnix ajuda a proteger sua pele.',
    you: 'Algumas gestantes percebem cansaço ou cãibras nesta fase. Sua experiência pode ser diferente. Conte à equipe de pré-natal o que tem sentido.',
    question: 'Qual pequeno momento desta semana você gostaria de lembrar?',
    services: ['Obstetrícia', 'Ultrassonografia'],
    source: week20Source,
    review: 'pending',
    detail: {
      title: 'Pequenos movimentos, uma história inteira.',
      introduction: 'Há espaço para a descoberta, para as dúvidas e para o seu próprio ritmo. Esta leitura é um convite para acompanhar este momento com calma.',
      babyTitle: 'Uma vida em movimento.',
      youTitle: 'Seu tempo também merece cuidado.',
      curiosity: {
        title: 'Um jeito diferente de medir.',
        text: 'Nas referências de desenvolvimento, por volta desta fase o comprimento do bebê passa a ser descrito da cabeça aos pés. Antes, costuma ser medido da cabeça ao bumbum, porque as pernas ficam dobradas.',
        sourceId: 'week20',
      },
      care: {
        text: 'A ultrassonografia do segundo trimestre permite observar o desenvolvimento do bebê e a placenta, mas não identifica todas as condições. Converse com sua equipe sobre o exame, suas dúvidas e o momento indicado para você.',
        sourceId: 'scan',
      },
      educationalAlert: {
        title: 'Perceber, sem se cobrar.',
        paragraphs: [
          'Os primeiros movimentos costumam ser percebidos entre 16 e 24 semanas. Na primeira gestação, isso pode acontecer depois da semana 20. Se chegar à semana 24 sem percebê-los, avise sua equipe de pré-natal.',
          'Se você já percebe um padrão de movimentos e notar redução, ausência ou mudança nesse padrão, entre em contato com sua equipe ou maternidade imediatamente, sem esperar até o dia seguinte.',
        ],
        sourceId: 'movements',
      },
      sources: [
        {id: 'week20', title: 'NHS · Desenvolvimento na semana 20', url: week20Source, consultedAt: '2026-09-18'},
        {id: 'movements', title: 'NHS · Movimentos do bebê', url: 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/', consultedAt: '2026-09-18'},
        {id: 'scan', title: 'NHS · Ultrassonografia do segundo trimestre', url: 'https://www.nhs.uk/pregnancy/your-pregnancy-care/20-week-scan/', consultedAt: '2026-09-18'},
      ],
      publicationStatus: 'published',
    },
  },
  21: {baby:'O bebê alterna períodos de sono e atividade. Pelinhos finos, chamados lanugo, recobrem o corpo, e os cabelos e as sobrancelhas seguem se desenvolvendo.',you:'O crescimento da barriga pode mudar sua sensação de equilíbrio. Cansaço e mudanças no sono também podem aparecer, mas não acontecem da mesma forma para todas.',question:'O que você gostaria de contar ao seu bebê sobre estes dias?',services:['Obstetrícia','Nutrição'],source:'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-21/',review:'pending'},
  22: {baby:'O bebê continua crescendo e seus pulmões seguem em desenvolvimento. Cada semana faz parte desse processo, acompanhado nas consultas de pré-natal.',you:'Algumas gestantes notam estrias na barriga, nas coxas ou nas mamas. Não existe uma única maneira de viver as mudanças do corpo.',question:'Quem ou o que fez você se sentir acolhida nesta semana?',services:['Obstetrícia','Psicologia'],source:'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/2nd-trimester/week-22/',review:'pending'},
};

export function publishedWeek(week: number): PublishedWeek | undefined {
  const content = Object.hasOwn(gestationWeeks, week) ? gestationWeeks[week] : undefined;
  return content?.detail?.publicationStatus === 'published' ? content as PublishedWeek : undefined;
}

export function parseWeek(value: string): number | null {
  if (!/^[1-9]\d?$/.test(value)) return null;
  const week = Number(value);
  return week <= 42 ? week : null;
}
