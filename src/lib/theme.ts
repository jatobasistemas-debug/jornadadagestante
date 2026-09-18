import { z } from 'zod';
import type { CSSProperties } from 'react';
export const themeKeys = ['primary','primarySoft','secondary','accent','background','surface','text','muted','border','onPrimary','danger','focus'] as const;
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const themeSchema = z.object(Object.fromEntries(themeKeys.map(k=>[k,hex])) as Record<typeof themeKeys[number],typeof hex>).strict();
export type Theme = z.infer<typeof themeSchema>;
export const defaultTheme: Theme = {"primary": "#805044", "primarySoft": "#F0E2DA", "secondary": "#526758", "accent": "#A17440", "background": "#FAF7F2", "surface": "#FFFFFF", "text": "#302D29", "muted": "#68615A", "border": "#D7CBC2", "onPrimary": "#FFFFFF", "danger": "#A12B30", "focus": "#66532D"};
export function themeStyle(value: unknown): CSSProperties {
 const tokens = themeSchema.parse(value);
 return Object.fromEntries(themeKeys.map(key=>[`--${key}`, tokens[key]])) as CSSProperties;
}
export function contrastRatio(a: string,b: string) {
 const lum=(s:string)=>{const c=s.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722;};
 const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function validateReadableTheme(t: Theme) {
 return contrastRatio(t.text,t.background)>=4.5 && contrastRatio(t.text,t.surface)>=4.5 && contrastRatio(t.onPrimary,t.primary)>=4.5 && contrastRatio(t.muted,t.background)>=4.5;
}
