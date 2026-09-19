import { gestationWeeks, type WeekContent, type EditorialSource } from './gestation-weeks';

export type VisualDevelopment = {
  illustration: 'week-20-reference';
  title: string;
  caption: string;
  source: EditorialSource;
  review: { status: 'pending' } | { status: 'reviewed'; reviewer: string; reviewedAt: string };
};
export type DevelopmentWeek = {
  week: number;
  content?: WeekContent;
  visual?: VisualDevelopment;
  publicationStatus: 'unavailable' | 'summary' | 'published';
};

// Central Jatobá catalog. Empty slots are intentional, never fabricated content.
// Existing Home and weekly reading remain the source of medical prose.
export const developmentWeeks: readonly DevelopmentWeek[] = Array.from({ length: 40 }, (_, index) => {
  const week = index + 1;
  const content = gestationWeeks[week];
  return {
    week, content,
    publicationStatus: content?.detail?.publicationStatus === 'published' ? 'published' : content ? 'summary' : 'unavailable',
    visual: week === 20 ? {
      illustration: 'week-20-reference',
      title: 'Pequenos movimentos. Novas descobertas.',
      caption: 'Ilustração esquemática da Semana 20, sem escala. Não representa a aparência ou a posição do seu bebê.',
      source: gestationWeeks[20].detail!.sources[0],
      review: { status: 'pending' },
    } : undefined,
  };
});

export function developmentWeek(week: number): DevelopmentWeek | undefined {
  return Number.isInteger(week) && week >= 1 && week <= 40 ? developmentWeeks[week - 1] : undefined;
}
