# Etapa 2 — Semana da Gestação, referência da semana 20

## Entrega

- Rota: `/[clinic]/gestante/semana/[week]`.
- Semana 20: `/vida-plena/gestante/semana/20`, para conta de gestante dessa clínica.
- Hero com semana consultada, frase principal e progresso real da gestação.
- Composição editorial: bebê em leitura ampla, Você em coluna aberta, Curiosidade
  em nota lateral, Para observar com linha lateral, Para guardar em pausa
  tipográfica e Seu cuidado com serviços discretos ao final.
- Uma coluna em celular; composição assimétrica a partir de 800 px. Cores somente
  por tokens, sem nova logo, imagem ou fonte externa.
- Pergunta emocional sem formulário, obrigação ou falsa ação de salvar.
- Acesso pela Home e retorno ao início; menu da gestante preservado.

## Conteúdo e dados

`src/content/gestation-weeks.ts` centraliza os resumos existentes e a leitura
completa da semana 20. `home-weeks.ts` apenas reexporta esse catálogo, sem duplicar
conteúdo. Semanas 21 e 22 mantêm seus resumos anteriores; sua leitura completa não
foi publicada. Outras semanas válidas exibem estado de conteúdo indisponível.
Parâmetros inválidos recebem `notFound()`.

Fontes: NHS, páginas de desenvolvimento da semana 20, movimentos do bebê e
ultrassonografia do segundo trimestre. Links e consulta em 18/09/2026 registrados
no catálogo e visíveis na tela. A revisão profissional continua pendente e não
é apresentada como concluída. Não há diagnósticos nem checklist de sintomas.

`patientJourney()` reutiliza o acesso existente e as leituras de perfil, gestação
e serviços da Home. Usa o cliente autenticado da gestante, filtros de usuário e
clínica, sem service role. Nenhuma alteração de Auth, RLS, banco ou migração.

O cálculo da semana atual e o progresso seguem a DPP e o calendário de São Paulo.
Abrir semana 20 não altera a semana atual. Sem gestação ativa/data calculável,
a página oferece leitura geral, sem inventar progresso pessoal.

`contextualServices()` exige correspondência exata entre nomes editoriais e
serviços ativos cadastrados na clínica. URLs de atendimento são opcionais;
somente HTTPS sem credenciais e telefone válido viram links. Sem URL há texto,
sem serviço correspondente há estado vazio discreto.

## Reaproveitamento e limites

Extraídos `GestationProgress` e `ContextualServices` para uso real na Home e na
tela semanal. Mantidos `PatientShell`, marca e navegação existentes. Incluídas as
correções da revisão anterior `bc5a8e5`, que ainda estavam somente locais.

Minha Jornada, Memórias e Cartas não foram implementadas. O problema de cadastro
aguardando logs da Vercel não foi alterado nesta entrega.

## Verificação

- Build de produção aprovado, incluindo a nova rota dinâmica.
- Suite local: 47 testes aprovados, dos quais 5 novos focados na tela semanal.
- Testes novos: semana publicada versus indisponível; parâmetro de rota; filtro
  editorial e destinos seguros; semana consultada versus progresso atual;
  leitura sem gestação ativa.
- Os testes de componentes usam renderização estática e dados de teste; não
  substituem validação visual nem representam nova auditoria do Supabase real.
- Validação visual em desktop/celular permanece a ser feita na rota publicada.
