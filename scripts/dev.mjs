import {spawn} from 'node:child_process';
try{process.loadEnvFile('.env.local');}catch(e){if(e.code!=='ENOENT')throw e;}
if(process.env.HTTP_PROXY||process.env.HTTPS_PROXY)process.env.NODE_USE_ENV_PROXY='1';
const args=process.argv.slice(2);let port='3000',host='0.0.0.0';
for(let i=0;i<args.length;i++){if(args[i]==='--port')port=args[++i];else if(args[i]==='--host'||args[i]==='--hostname')host=args[++i];else if(args[i]!=='--strictPort')throw new Error('Argumento de desenvolvimento desconhecido');}
if(!/^\d{2,5}$/.test(port))throw new Error('Porta inválida');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname',host,'--port',port],{stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>{process.exitCode=code??0;});
