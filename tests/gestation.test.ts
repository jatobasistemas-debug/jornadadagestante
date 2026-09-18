import {test} from 'node:test';import assert from 'node:assert/strict';
import {gestation} from '../src/lib/gestation';
import {homeWeeks} from '../src/content/home-weeks';
test('real demo DPP yields 21 weeks and four days on September 18',()=>{const a=gestation('2027-01-25',new Date('2026-09-18T12:00:00Z'))!;assert.equal(a.week,21);assert.equal(a.day,4);assert.equal(a.trimester,2);});
test('calendar uses Brazil date around midnight UTC',()=>{assert.equal(gestation('2027-01-25',new Date('2026-09-18T01:00:00Z'))!.day,3);});
test('40 and 41 weeks never overflow progress or change actual week',()=>{assert.equal(gestation('2026-09-18',new Date('2026-09-25T12:00:00Z'))!.week,41);assert.equal(gestation('2026-09-18',new Date('2026-09-25T12:00:00Z'))!.progress,100);});
test('invalid and out-of-range dates do not fabricate progress',()=>{for(const d of ['bad','2026-02-31','2030-01-01','2020-01-01'])assert.equal(gestation(d,new Date('2026-09-18T12:00:00Z')),null);});
test('central editorial entries retain sources and truthful review status',()=>{for(const c of Object.values(homeWeeks)){assert.match(c.source,/^https:\/\/www.nhs.uk\//);assert.equal(c.review,'pending');assert.ok(c.baby&&c.you&&c.question);}assert.equal(homeWeeks[19],undefined);});
