import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { runInNewContext } from 'node:vm';
import { defaultTheme, contrastRatio, validateReadableTheme, themeKeys } from '../src/lib/theme';
import { resolveThemeModes, themeModesStyle } from '../src/lib/theme-modes';
import { colorModeScript, parseColorMode } from '../src/lib/color-mode';
import { developmentWeeks, developmentWeek } from '../src/content/development-map';
import { gestationWeeks } from '../src/content/gestation-weeks';
import { BabyDevelopmentMap } from '../src/components/baby-development-map';
import { PublicEntry } from '../src/components/public-entry';

test('clinic themes remain independent in light and dark without mutating the saved palette', () => {
  const horizon = {...defaultTheme, primary:'#315D58', secondary:'#675980'};
  const before = JSON.stringify(horizon);
  const vida = resolveThemeModes(defaultTheme), other = resolveThemeModes(horizon);
  assert.deepEqual(vida.light, defaultTheme);
  assert.deepEqual(other.light, horizon);
  assert.notEqual(vida.dark.primary, other.dark.primary);
  assert.notEqual(vida.dark.background, other.dark.background);
  assert.equal(JSON.stringify(horizon), before);
  for (const pair of [vida, other]) {
    for (const mode of ['light', 'dark'] as const) {
      assert.ok(validateReadableTheme(pair[mode]));
      assert.ok(contrastRatio(pair[mode].text, pair[mode].primarySoft) >= 4.5);
    }
    for (const token of ['primary', 'secondary', 'muted', 'danger', 'focus'] as const) {
      assert.ok(contrastRatio(pair.dark[token], pair.dark.surface) >= 4.5, token);
    }
  }
  assert.equal(Object.keys(themeModesStyle(horizon)).length, themeKeys.length * 2);
  assert.deepEqual(resolveThemeModes(vida), vida);
  assert.throws(() => resolveThemeModes({...defaultTheme, primary:'url(unsafe)'}));
});

test('pre-paint preference respects explicit choice and leaves system CSS in charge by default', () => {
  for (const value of [null, 'system', 'light', 'dark', 'invalid']) {
    const document = {documentElement:{dataset:{} as Record<string,string>}};
    runInNewContext(colorModeScript, {document, localStorage:{getItem:()=>value}});
    assert.equal(document.documentElement.dataset.colorMode, value === 'light' || value === 'dark' ? value : undefined);
    assert.equal(parseColorMode(value), value === 'light' || value === 'dark' ? value : 'system');
  }
  assert.doesNotThrow(() => runInNewContext(colorModeScript, {localStorage:{getItem:()=>{throw new Error('blocked');}}}));
});

test('all 40 editorial slots exist, only week 20 has a visual, and no medical copy is fabricated', () => {
  assert.equal(developmentWeeks.length, 40);
  assert.deepEqual(developmentWeeks.map(w=>w.week), Array.from({length:40},(_,i)=>i+1));
  assert.deepEqual(developmentWeeks.filter(w=>w.visual).map(w=>w.week), [20]);
  assert.deepEqual(developmentWeeks.filter(w=>w.publicationStatus==='published').map(w=>w.week), [20]);
  assert.equal(developmentWeek(20)?.content, gestationWeeks[20]);
  assert.equal(developmentWeek(20)?.visual?.review.status, 'pending');
  assert.equal(developmentWeek(1)?.content, undefined);
  for (const invalid of [0, 41, 20.5, NaN]) assert.equal(developmentWeek(invalid), undefined);
});

test('map distinguishes illustrated week and actual pregnancy, without forced progress or dead links', () => {
  for (const current of [20, 21, 41, null]) {
    const html = renderToStaticMarkup(createElement(BabyDevelopmentMap, {currentWeek:current}));
    assert.match(html, /Referência · Semana 20/);
    assert.equal((html.match(/aria-current="step"/g)||[]).length, current && current <= 40 ? 1 : 0);
    if (current) assert.ok(html.includes(`Sua gestação está na semana ${current}`));
    else assert.ok(html.includes('Sua semana atual ainda não está disponível'));
    assert.ok(!html.includes('<button') && !html.includes('<input') && !html.includes('href="#"'));
    assert.ok(html.includes('Revisão profissional pendente'));
  }
  assert.equal(renderToStaticMarkup(createElement(BabyDevelopmentMap,{currentWeek:21,referenceWeek:21})), '');
});

test('public entry prepares both paths and only links to the existing login anchor', () => {
  const html = renderToStaticMarkup(createElement(PublicEntry));
  assert.ok(html.includes('Começar minha Jornada'));
  assert.ok(html.includes('Tenho acesso por uma clínica/parceiro'));
  assert.ok(html.includes('assinatura individual estará disponível em breve'));
  assert.deepEqual([...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]), ['#acesso-existente']);
  assert.ok(!html.includes('<form') && !html.includes('<button'));
});
