import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {gestationWeeks, parseWeek, publishedWeek} from '../src/content/gestation-weeks';
import {homeWeeks} from '../src/content/home-weeks';
import {contextualServices, bookingLink} from '../src/lib/contextual-services';
import {gestation} from '../src/lib/gestation';
import {GestationWeekArticle} from '../src/components/gestation-week-article';
import {ContextualServices} from '../src/components/contextual-services';

test('only the complete published week is available, sharing Home content', () => {
  assert.equal(homeWeeks, gestationWeeks);
  assert.equal(publishedWeek(20), homeWeeks[20]);
  assert.equal(publishedWeek(20)?.review, 'pending');
  for (const week of [1, 19, 21, 22, 42, NaN]) assert.equal(publishedWeek(week), undefined);
  const detail = publishedWeek(20)!.detail;
  for (const id of [detail.curiosity.sourceId, detail.care.sourceId, detail.educationalAlert.sourceId]) {
    assert.ok(detail.sources.some(source => source.id === id && source.url.startsWith('https://www.nhs.uk/')));
  }
});

test('week route accepts only canonical integers in the pregnancy range', () => {
  assert.equal(parseWeek('20'), 20);
  assert.equal(parseWeek('1'), 1);
  assert.equal(parseWeek('42'), 42);
  for (const invalid of ['0', '-1', '43', '020', '20.0', '2e1', 'abc', '20x', '']) assert.equal(parseWeek(invalid), null);
});

test('contextual services require a real editorial match and safe configured destination', () => {
  const services = [{id:'a', name:'Obstetrícia'}, {id:'b', name:'Nutrição'}, {id:'c', name:'Ultrassonografia'}];
  assert.deepEqual(contextualServices(services, publishedWeek(20)!.services).map(s => s.id), ['a','c']);
  assert.deepEqual(contextualServices(services), []);
  assert.equal(bookingLink('https://example.com/agenda'), 'https://example.com/agenda');
  assert.equal(bookingLink('tel:+5511999999999'), 'tel:+5511999999999');
  for (const url of [null, '', 'javascript:alert(1)', '//example.com', 'http://example.com', 'https://user:password@example.com', 'https://example.com/\nx', 'tel:alert(1)']) assert.equal(bookingLink(url), undefined);
  const markup = renderToStaticMarkup(createElement(ContextualServices, {services:[{id:'a', name:'Obstetrícia', booking_url:'javascript:alert(1)'}], emptyMessage:'Sem serviços', showLinks:true}));
  assert.ok(markup.includes('Obstetrícia'));
  assert.ok(!markup.includes('href='));
});

test('week 20 reading preserves actual week 21 progress and optional emotional invitation', () => {
  const age = gestation('2027-01-25', new Date('2026-09-18T12:00:00Z'));
  const markup = renderToStaticMarkup(createElement(GestationWeekArticle, {
    week:20, content:publishedWeek(20)!, slug:'vida-plena', clinicName:'Clínica Vida Plena', name:'Ana',
    age, dueDate:'2027-01-25', hasActive:true, services:[],
  }));
  assert.match(markup, /Você está lendo sobre a semana 20\. Sua gestação está na semana 21/);
  assert.match(markup, /aria-valuetext="21 semanas e 4 dias/);
  assert.match(markup, /href="\/vida-plena\/gestante"/);
  for (const title of ['Seu bebê','Você','Curiosidade','Para observar','Para guardar','Seu cuidado','Revisão profissional pendente']) assert.ok(markup.includes(title));
  assert.ok(!markup.includes('<form') && !markup.includes('<input') && !markup.includes('<textarea'));
  assert.ok(!markup.includes('Memórias</a>'));
});

test('without active pregnancy the reading does not fabricate personal progress', () => {
  const markup = renderToStaticMarkup(createElement(GestationWeekArticle, {
    week:20, content:publishedWeek(20)!, slug:'vida-plena', clinicName:'Clínica Vida Plena', name:'Ana',
    age:null, hasActive:false, services:[],
  }));
  assert.ok(markup.includes('Sem gestação ativa'));
  assert.ok(markup.includes('sem indicação da sua semana atual'));
  assert.ok(!markup.includes('<progress'));
  assert.ok(!markup.includes('Data prevista do parto:'));
});
