import type { CSSProperties } from 'react';
import { z } from 'zod';
import { themeKeys, themeSchema, type Theme } from './theme';

export const themeModesSchema = z.object({ light: themeSchema, dark: themeSchema }).strict();
export type ThemeModes = z.infer<typeof themeModesSchema>;

function mix(from: string, to: string, amount: number) {
  const channels = [1, 3, 5].map(i => Math.round(
    parseInt(from.slice(i, i + 2), 16) * (1 - amount) + parseInt(to.slice(i, i + 2), 16) * amount,
  ).toString(16).padStart(2, '0'));
  return '#' + channels.join('');
}

// Compatibility adapter: the approved database palette remains unchanged.
// Every clinic gets its own dark tokens, derived from its existing identity.
export function resolveThemeModes(value: unknown): ThemeModes {
  const explicit = themeModesSchema.safeParse(value);
  if (explicit.success) return explicit.data;
  const light = themeSchema.parse(value);
  const ink = '#151819', paper = '#F7F4EF';
  const dark: Theme = {
    primary: mix(light.primary, paper, .72),
    primarySoft: mix(ink, light.primary, .16),
    secondary: mix(light.secondary, paper, .72),
    accent: mix(light.accent, paper, .65),
    background: mix(ink, light.primary, .05),
    surface: mix(ink, light.primary, .12),
    text: paper,
    muted: '#C2BCB5',
    border: mix(ink, paper, .32),
    onPrimary: ink,
    danger: '#FFB4AD',
    focus: '#F2D59C',
  };
  return { light, dark };
}

export function themeModesStyle(value: unknown): CSSProperties {
  const modes = resolveThemeModes(value);
  return Object.fromEntries((['light', 'dark'] as const).flatMap(mode =>
    themeKeys.map(key => [`--${mode}-${key}`, modes[mode][key]]),
  )) as CSSProperties;
}
