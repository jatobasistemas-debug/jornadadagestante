import {PDFDocument,StandardFonts} from 'pdf-lib';
import sharp from 'sharp';
export type BookEntry={title:string;text:string;file?:{bytes:Uint8Array;type:string}};
// Standard PDF fonts support Portuguese. Unsupported symbols are visibly replaced,
// never executed as markup; the original Unicode text stays in the JSON export.
export function pdfText(text:string){return text.normalize('NFC').replace(/[^\x20-\x7e\xa0-\xff\n\r\t]/gu,'?');}
export async function buildJourneyPdf(title:string,entries:BookEntry[]){
 // Decode locally with a pixel limit. No private image is sent to an external API.
 entries=await Promise.all(entries.map(async entry=>entry.file?.type==='image/webp'?{...entry,file:{type:'image/png',bytes:await sharp(entry.file.bytes,{limitInputPixels:25_000_000}).resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).png().toBuffer()}}:entry));
 const doc=await PDFDocument.create();const font=await doc.embedFont(StandardFonts.Helvetica);doc.setTitle(pdfText(title));
 let page=doc.addPage(),y=page.getHeight()-60;
 const line=(text:string,size=12)=>{if(y<60){page=doc.addPage();y=page.getHeight()-60;}page.drawText(text,{x:50,y,size,font});y-=size*1.6;};
 const write=(text:string,size=12)=>{for(const paragraph of pdfText(text).split(/\r?\n/)){let buffer='';for(const character of paragraph){if(font.widthOfTextAtSize(buffer+character,size)>page.getWidth()-100){line(buffer,size);buffer='';}buffer+=character;}line(buffer,size);}};
 write(title,24);write('Jornada da Gestante · Livro privado',10);
 for(const entry of entries){page=doc.addPage();y=page.getHeight()-60;write(entry.title,18);write(entry.text);if(entry.file){const f=entry.file;if(f.type==='application/pdf'){const source=await PDFDocument.load(f.bytes,{ignoreEncryption:false});if(source.getPageCount()>30)throw new Error('Um dos PDFs tem mais de 30 páginas. Use uma seleção menor.');const pages=await doc.copyPages(source,source.getPageIndices());pages.forEach(p=>doc.addPage(p));}else if(['image/png','image/jpeg'].includes(f.type)){const image=f.type==='image/png'?await doc.embedPng(f.bytes):await doc.embedJpg(f.bytes);const scaled=image.scaleToFit(page.getWidth()-100,500);if(y-scaled.height<50){page=doc.addPage();y=page.getHeight()-60;}page.drawImage(image,{x:50,y:y-scaled.height,width:scaled.width,height:scaled.height});}else throw new Error('Para incluir esta foto no PDF, use PNG ou JPEG. O arquivo original continua preservado.');}}
 const result=await doc.save();if(result.length>4*1024*1024)throw new Error('O livro excedeu 4 MB. Divida os registros em seleções menores.');return result;
}
