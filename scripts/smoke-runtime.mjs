import assert from 'node:assert/strict';
const origin=process.env.SMOKE_ORIGIN||'http://localhost:3000';
const checks=[];
const health=await fetch(origin+'/api/health');assert.equal(health.status,200);const state=await health.json();assert.equal(state.status,'running');checks.push('Servidor de produção e endpoint de saúde: HTTP 200');
const home=await fetch(origin+'/');assert.equal(home.status,200);const html=await home.text();assert.ok(html.includes('Jornada da Gestante'));assert.ok(html.includes('lang="pt-BR"'));assert.ok(html.includes('viewport'));assert.equal(home.headers.get('x-content-type-options'),'nosniff');checks.push('Página inicial renderizada em português, viewport e cabeçalho de segurança');
const styles=[...html.matchAll(/href="([^\"]+\.css[^\"]*)"/g)].map(m=>m[1].replaceAll('&amp;','&'));assert.ok(styles.length);for(const path of styles){const response=await fetch(new URL(path,origin));assert.equal(response.status,200);}checks.push('Arquivos CSS da compilação carregam sem erro');
for(const path of ['/termos','/privacidade','/auth/recuperar']){const response=await fetch(origin+path);assert.equal(response.status,200);}checks.push('Termos, privacidade e recuperação: HTTP 200');
if(state.backend==='not-configured'){
 for(const path of ['/acesso','/jatoba','/auth/nova-senha']){const response=await fetch(origin+path,{redirect:'manual'});assert.equal(response.status,307);assert.equal(response.headers.get('location'),'/');}
 checks.push('Áreas protegidas bloqueadas sem backend configurado');
 const exported=await fetch(origin+'/api/conta/exportar');assert.equal(exported.status,503);checks.push('Exportação indisponível de forma explícita, sem dados de demonstração simulando uma sessão');
}
console.log(JSON.stringify({result:'passed',backend:state.backend,checks},null,2));
