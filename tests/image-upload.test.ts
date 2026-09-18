import {test} from 'node:test';import assert from 'node:assert/strict';import {validateImage,MAX_IMAGE_BYTES} from '../src/lib/image-upload';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlRMAAAAASUVORK5CYII=','base64');
test('upload preserves original PNG bytes',async()=>{const r=await validateImage(new File([png],'logo.png',{type:'image/png'}));assert.deepEqual(Buffer.from(r.bytes),png);assert.equal(r.type,'image/png');});
test('upload rejects HTML/SVG renamed as PNG',async()=>{await assert.rejects(validateImage(new File(['<svg><script/></svg>'],'image.png',{type:'image/png'})));});
test('upload rejects empty, missing and oversized images',async()=>{await assert.rejects(validateImage(null));await assert.rejects(validateImage(new File([],'empty.png',{type:'image/png'})));await assert.rejects(validateImage(new File([new Uint8Array(MAX_IMAGE_BYTES+1)],'big.png',{type:'image/png'})));});
