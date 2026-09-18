# Etapa 2 — primeira rodada

## Implementado

- Home na rota existente `/[clinic]/gestante`, com saudação, semana/dias,
  trimestre, progresso estimado e cinco blocos editoriais.
- Dados reais: perfil autenticado, gestação ativa/DPP, clínica, tema e serviços
  ativos relacionados à semana. Nenhum dado de paciente foi fixado na interface.
- Navegação mobile: Início e Perfil funcionais; Minha Jornada, Memórias e Minha
  Clínica explicitamente indisponíveis (Em breve), sem rotas fictícias.
- Perfil existente em `/[clinic]/conta` compartilha a navegação.
- Componentes usam tokens do tema existente. Banco, migrações, RLS, Storage e
  autenticação não foram alterados.

## Verificações executadas em 18/09/2026

- Build de produção aprovado. Cache gerado corrompido foi movido para fora do
  projeto e o build foi refeito, sem alteração de dependências.
- `node --import tsx --test tests/gestation.test.ts`: 5 testes aprovados.
- `node --env-file=.env.local scripts/test-home-http.mjs`: 3 verificações
  aprovadas com Supabase real: Home com user-agent desktop, Home com user-agent
  mobile e Perfil com navegação. O script exige ambiente demo configurado.
- `git diff --check`: aprovado.
- Corrigida comparação do teste HTTP: marcadores de comentários do React entre
  trechos de texto não devem causar falso negativo na saudação.

## Pendências — não considerar a rodada totalmente validada

- Validação visual/interativa em desktop e celular. User-agent HTTP não equivale
  a viewport real, verificação de layout ou teste por toque.
- O navegador disponível não acessa o ambiente local; será necessária uma versão
  acessível para preview e autenticação segura com uma conta demo de gestante.
- Conteúdo específico disponível para semanas 20, 21 e 22; outras semanas têm
  mensagem neutra de conteúdo em preparação. Revisão profissional ainda pendente,
  explicitada nos metadados editoriais. Não declarar cobertura editorial completa.
- Não avançar para Tela da semana ou outras telas antes da validação desta rodada.

Nenhuma publicação em produção foi feita nesta rodada.

## Atualização — publicação e revisão estática

A primeira rodada foi posteriormente publicada como `5ec4014`, com a mesma árvore
do commit local `b748ae0`; a Vercel confirmou sucesso. A validação visual continuou
pendente de sessão autenticada.

Revisão estática posterior, sem chamadas ao banco ou alterações de autenticação:

- Estado sem semana calculável não mostra blocos que pressupõem uma gestação em
  andamento. Perfil e cuidado permanecem acessíveis.
- Serviços exigem correspondência com o conteúdo semanal e com o catálogo ativo
  real. Removida sugestão padrão de Obstetrícia sem contexto editorial.
- Estado vazio não atribui indevidamente à clínica a falta de cadastro.
- Blocos recebem nomes acessíveis; navegação ativa também é marcada por sublinhado.
- Rótulos mobile ampliados, margens laterais de segurança independentes, reserva
  inferior em rem e colunas com mínimo zero para acomodar textos longos.
- Fontes externas usam token de texto; nenhuma cor literal foi adicionada.
- Links internos Início/Perfil possuem rotas existentes. Demais itens seguem sem
  links, identificados como Em breve. Links externos não foram testados por rede
  nesta revisão estática.
- Cálculo por DPP e data de São Paulo preservado, assim como proteção contra datas
  inválidas e limite visual de 100% sem alterar a semana real após 40 semanas.
- Build, TypeScript, cinco testes existentes e `git diff --check` aprovados.

Estas correções estão versionadas localmente; não foram publicadas nesta revisão.
Inspeção de CSS não comprova aparência, zoom, toque ou foco em dispositivo real.
O plano da próxima tela está em `ETAPA_2_SEMANA_PLANO.md`, sem rota implementada.
