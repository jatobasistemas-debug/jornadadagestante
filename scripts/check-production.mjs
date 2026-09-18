import {spawn} from 'node:child_process';
const port=3133;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe']});
let logs='';
try {
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Servidor não iniciou em 30 segundos.')),30000);server.stdout.on('data',chunk=>{const message=chunk.toString();logs+=message;if(message.includes('Ready in')){clearTimeout(timeout);resolve();}});server.stderr.on('data',chunk=>{logs+=chunk.toString();});server.on('exit',code=>{clearTimeout(timeout);reject(new Error(`Servidor encerrou: ${code}. ${logs}`));});});
 process.env.SMOKE_ORIGIN=`http://127.0.0.1:${port}`;
 await import('./smoke-runtime.mjs');
}finally{server.kill('SIGTERM');}
