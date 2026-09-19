'use client';
import { useEffect, useId, useState } from 'react';
import { colorModeKey, parseColorMode, type ColorMode } from '@/lib/color-mode';

export function ColorModePicker() {
  const id = useId();
  const [mode, setMode] = useState<ColorMode>('system');
  const [persisted, setPersisted] = useState(true);
  function apply(next: ColorMode) {
    setMode(next);
    if (next === 'system') delete document.documentElement.dataset.colorMode;
    else document.documentElement.dataset.colorMode = next;
  }
  useEffect(() => {
    try { apply(parseColorMode(localStorage.getItem(colorModeKey))); } catch { /* System remains usable. */ }
    const sync = (event: StorageEvent) => {
      if (event.key === colorModeKey || event.key === null) apply(parseColorMode(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function change(value: string) {
    const next = parseColorMode(value);
    apply(next);
    try { localStorage.setItem(colorModeKey, next); setPersisted(true); }
    catch { setPersisted(false); }
  }
  return <div className="color-mode-picker">
    <label htmlFor={id}>Aparência</label>
    <select id={id} value={mode} onChange={event => change(event.target.value)}>
      <option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Escuro</option>
    </select>
    {!persisted && <small role="status">Escolha aplicada. Este navegador não permitiu salvá-la.</small>}
  </div>;
}
