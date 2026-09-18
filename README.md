# Jornada da Gestante · Etapa 1

Implementação da base em **Next.js + TypeScript + Tailwind + Supabase/PostgreSQL**, compatível com Vercel. Uma instalação para várias clínicas. Exclusivamente a Etapa 1 do Prompt-Mestre.

**Estado: Supabase real conectado e quatro migrações já aplicadas. Etapa 1 em validação final. Não recriar o projeto, não reaplicar migrações e não reexecutar o seed no projeto existente. Consulte `docs/VALIDACAO_ETAPA_1.md` e `docs/test-results/` para o ponto de retomada.**

As cinco especificações originais estão em `docs/especificacao/`, sem alterações. A logo oficial não foi fornecida; o nome da marca aparece como texto, sem símbolo inventado.

## O que existe

- App Router, formulários com Server Actions e sessões Supabase SSR em cookies; validação de identidade no servidor com `getUser()`.
- Login, cadastro curto DPP/DUM, confirmação por e-mail, recuperação de senha, alteração de senha e logout implementados para Supabase Auth.
- Áreas de acesso independentes da gestante, clínica e Jatobá. São telas da fundação, sem implementar os módulos das etapas seguintes.
- Migrações versionadas, relações compostas, índices, RLS e permissões explícitas.
- Gestante, administrador da clínica, equipe e superadmin. Nenhum privilégio é aceito a partir dos metadados editáveis do usuário.
- Isolamento por `clinic_id` e proprietário. Suspensão de clínica ou revogação de vínculo afeta imediatamente as consultas.
- Temas por URL da clínica, upload/remover logo original, avatar privado, contatos e 12 tokens. Editor do administrador com prévia, persistência no banco e validação de contraste.
- Estrutura de memórias e bucket privado preparada e testada no banco, sem interface de memórias, diário ou livro nesta etapa.
- Consentimentos versionados, auditoria administrativa sem cópia de dados sensíveis, exportação JSON e exclusão de conta implementada com nova verificação de senha.
- Seeds para Clínica Vida Plena, Barueri/SP, segunda clínica de teste, equipe, administrador Jatobá e três gestantes fictícias. Ana Carolina tem DPP calculada para aproximadamente 20 semanas na execução do seed.

## Executar

Requisitos: Node.js 22.9+ (validado com Node 24), npm e um projeto Supabase. Para Supabase local, instalar também Supabase CLI e Docker na máquina de execução. Esses dois últimos não estão disponíveis no ambiente desta entrega.

```bash
npm ci
cp .env.example .env.local
```

Preencher em `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave pública de cliente.
- `APP_URL`: origem confiável, como `http://localhost:3000` no desenvolvimento. Em produção, `https://jornadadagestante.online` após configurar o domínio.
- `SUPABASE_SERVICE_ROLE_KEY`: somente servidor, para seed e exclusão autenticada da própria conta. Nunca colocar essa chave em variáveis `NEXT_PUBLIC_`, no navegador ou em Git.

### Supabase local

```bash
npx supabase start
npx supabase db reset
```

`db reset` apaga o banco local e reaplica as migrações; usar somente no ambiente de desenvolvimento descartável. O seed SQL contém apenas dados fictícios. Copiar as chaves e URL informadas pelo Supabase CLI para `.env.local`.

### Projeto Supabase remoto novo

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

As quatro migrações já estão aplicadas no projeto autorizado. Os comandos acima destinam-se exclusivamente a um ambiente novo e vazio, nunca à retomada deste projeto.

Configurar no Supabase Auth a Site URL, os redirects exatos `/auth/callback` e `/auth/callback?next=/auth/nova-senha`, confirmação de e-mail e remetente SMTP. O cadastro e a recuperação utilizam o fluxo PKCE do Supabase SSR, com troca do código na rota de callback. A recuperação de senha pertence à autenticação; e-mails semanais e automações continuam fora desta etapa.

As rotas normais utilizam apenas a chave pública + sessão do usuário e passam pela RLS. A única operação web com chave de serviço é a exclusão da conta, após reautenticação e checagem de que ela não possui vínculos administrativos. Não existe uma API genérica que receba um ID de usuário para excluir.

### Dados de demonstração

Vida Plena, Horizonte e as sete contas abaixo já existem. Não executar o seed novamente durante a retomada.

```bash
# Definir ALLOW_DEMO_SEED=true e DEMO_PASSWORD em .env.local.
npm run seed:demo
```

Usar uma senha forte exclusiva para o ambiente de demonstração. O script não imprime nem embute a senha. Contas existentes mantêm a senha anterior ao reexecutar o seed.

| Conta fictícia | Papel | Clínica |
| --- | --- | --- |
| ana@jornada.example.com | Gestante, Ana Carolina | Vida Plena |
| beatriz@jornada.example.com | Gestante | Vida Plena |
| luisa@jornada.example.com | Gestante | Horizonte |
| admin.vida@jornada.example.com | Administrador | Vida Plena |
| equipe.vida@jornada.example.com | Equipe | Vida Plena |
| admin.horizonte@jornada.example.com | Administrador | Horizonte |
| jatoba@jornada.example.com | Superadmin | Jatobá |

O seed usa a API administrativa do Supabase Auth, sem gravar hashes de senha manualmente. Aceites fictícios são identificados por `demo-2026-09-06`, não representam consentimento de pessoas reais. Os módulos futuros permanecem desativados.

### Liberação de novos cadastros

As fontes não contêm documentos jurídicos finais. As páginas de termos e privacidade estão explicitamente marcadas como **minutas**. A liberação exige publicar as versões revisadas e manter o versionamento coerente no formulário e na migração do cadastro. Em seguida, configurar `REGISTRATION_ENABLED=true` e, com acesso administrativo ao banco, executar:

```sql
update private.registration_settings set enabled=true where singleton=true;
```

A trava no banco impede contornar o formulário usando diretamente a API de cadastro. Ela não impede o seed administrativo de contas fictícias, que cria perfis e vínculos de forma explícita. Não anunciar conformidade jurídica apenas pela existência dessas telas.

### Aplicação

```bash
npm run dev
# Ou produção:
npm run build
npm start
```

Acessos principais: `/vida-plena`, `/clinica-horizonte` e `/` para entrada geral. Após login, `/acesso` resolve vínculos reais e encaminha ao ambiente permitido. Não é necessário escolher um papel no formulário.

Sem variáveis Supabase, a aplicação renderiza um estado de configuração pendente e bloqueia as áreas protegidas. Isso permite executar e inspecionar o projeto, mas **não significa que o backend ou a autenticação estejam funcionais**.

## Testar

```bash
npm test
npm run build
node scripts/check-production.mjs
npm run test:integration
npm run test:http
```

- `npm test`: 35 testes de SQL/RLS, relações, temas e validações de imagem. Migrações executadas em PostgreSQL via PGlite, exclusivo de testes. Schemas mínimos de Auth/Storage e contexto de usuário são simulados; não há simulação de um Supabase Auth real.
- `npm run build`: compilação Next.js e verificação TypeScript.
- `check-production.mjs`: inicia um servidor Next.js real, verifica respostas HTTP, arquivos CSS e bloqueios básicos, depois encerra o processo de teste.
- `test:http`: usa o build de produção e formulários reais por HTTP. É independente da homologação no navegador. Requer as contas demo configuradas.
- `test:integration`: usa um Supabase verdadeiro e as contas do seed. Sem configuração, informa explicitamente os testes ignorados. Esses testes ignorados não são aprovação de autenticação.

Ver `docs/VALIDACAO_ETAPA_1.md` para resultados, limitações e critério de conclusão.

## Estrutura principal

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/` | Rotas, layouts e ações do servidor |
| `src/lib/supabase/server.ts` | Cliente Supabase restrito à sessão |
| `src/proxy.ts` | Renovação e propagação de cookies |
| `src/lib/access.ts` | Verificação de usuário, clínica e papel |
| `src/lib/theme.ts` | Tokens, validação e contraste |
| `src/components/theme-editor.tsx` | Personalização da clínica |
| `supabase/migrations/` | Esquema, RLS, Storage e funções de acesso |
| `supabase/seed.sql` | Clínicas e catálogos fictícios |
| `scripts/seed-demo.ts` | Contas Supabase Auth e vínculos fictícios |
| `tests/` | Testes de banco, validação e integração real |
| `docs/ARQUITETURA.md` | Modelo de dados e limites de permissão |

## Limites desta entrega

Não há home semanal, linha do tempo, telas de memórias, conteúdo médico, painel operacional da clínica, gestão completa da Jatobá, PDFs, cartas, revista, cobrança ou automações. Eles pertencem às etapas seguintes. A estrutura de banco prepara as fronteiras necessárias, sem afirmar que esses módulos estão prontos.

A hospedagem pública e a configuração do domínio não foram feitas. Preservou-se a stack solicitada e a compatibilidade com Vercel, sem convertê-la para autenticação ChatGPT ou banco SQLite da plataforma de Sites.

**SIMPLES PARA A GESTANTE. ÚTIL PARA A CLÍNICA. ESCALÁVEL PARA A JATOBÁ.**
