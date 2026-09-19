export type ColorMode = 'system' | 'light' | 'dark';
export const colorModeKey = 'jornada-color-mode';
export function parseColorMode(value: unknown): ColorMode {
  return value === 'light' || value === 'dark' ? value : 'system';
}
// Runs before first paint. CSS handles system changes, including without JS.
export const colorModeScript = `try{var m=localStorage.getItem('${colorModeKey}');if(m==='light'||m==='dark')document.documentElement.dataset.colorMode=m;}catch{}`;
