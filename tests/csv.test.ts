import {test} from 'node:test';
import assert from 'node:assert/strict';
import {csvCell,csvRows} from '../src/lib/csv';
test('clinic CSV escapes delimiters, quotes and embedded lines',()=>{assert.equal(csvCell('Ana; "Carolina"\nSilva'),'"Ana; ""Carolina""\nSilva"');assert.ok(csvRows([['Nome'],['Ana']]).startsWith('\uFEFF"Nome"\r\n'));});
test('clinic CSV neutralizes spreadsheet formula injection',()=>{for(const value of ['=IMPORTXML("https://example.com")','+123','-123','@SUM(1)','\t=1+1'])assert.ok(csvCell(value).startsWith('"\''));assert.equal(csvCell('Ana Carolina'),'"Ana Carolina"');});
