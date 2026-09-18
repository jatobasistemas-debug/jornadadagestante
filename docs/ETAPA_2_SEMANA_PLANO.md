# Semana da Gestação — plano aprovado

Atualização: a implementação da Semana 20 foi autorizada após este plano.
O escopo entregue e a validação estão em `ETAPA_2_SEMANA_20.md`.
O texto abaixo preserva a proposta que orientou a implementação.

## Escopo e rota proposta

`/[clinic]/gestante/semana/[week]`, somente após aprovação da primeira rodada.
Página de leitura, renderizada no servidor, com Início selecionado no menu.
Não criar tabelas, migrações ou painel editorial nesta preparação.

## Dados consumidos

| Origem existente | Campos | Uso |
| --- | --- | --- |
| Contexto de acesso existente | usuário autenticado; clínica `id`, `slug`, `name`, `logo_url`, `tokens` | Contexto, identidade e escopo das leituras |
| `profiles` | `full_name`, `preferred_name`, filtrados por `user_id` | Nome de acolhimento |
| `pregnancies` | `due_date`, `status`, ordenadas por `created_at` e filtradas por `user_id` e `clinic_id` | Mesma escolha de gestação ativa da Home |
| Relógio e DPP | data corrente em America/Sao_Paulo | `gestation()` fornece semana, dias, trimestre e progresso |
| Parâmetro `week` | inteiro correspondente a uma entrada editorial publicada | Semana consultada, distinta da semana atual da gestante |
| `clinic_services` | `id`, `name`, `booking_url`; filtros `clinic_id` e `active=true` | Interseção com serviços relacionados da entrada editorial; link externo apenas quando configurado e válido |
| Catálogo central editorial em código | descrito abaixo | Conteúdo semanal, sem edição pela clínica |

O banco atual não possui tabela de conteúdo semanal. O catálogo `homeWeeks`
contém somente `baby`, `you`, `question`, `services`, `source`, `review` para
semanas 20–22. Não tratá-lo como catálogo completo ou profissionalmente aprovado.

## Contrato editorial a preparar na futura implementação

- `week`: número da semana e chave da entrada.
- `title`: título editorial.
- `baby`, `you`: desenvolvimento e informações para a gestante.
- `curiosity`, `care`, `educationalAlert`: curiosidade, cuidado e alerta educativo.
- `question`: pergunta emocional opcional.
- `services`: nomes relacionados, cruzados com serviços ativos reais, como na Home.
- `sources`: referências com título, URL e data de consulta.
- `review`: estado de revisão; identificação e data de revisão somente quando reais.
- `publicationStatus`: rascunho ou publicado, independente do estado de revisão.

Campos ausentes não serão preenchidos automaticamente nem exibidos como aprovados.
Conteúdo a publicar deverá estar definido e revisado conforme o processo da Jatobá.
Home e tela semanal deverão compartilhar a mesma entrada editorial e filtragem.

## Reaproveitamento

- `PatientShell`, `BrandShell`, `PatientNavigation`: estrutura, tema, logo e menu.
- `gestation()`: cálculo único, sem repetir aritmética de datas na nova página.
- Tokens existentes e estilos editoriais de cards, títulos, fontes e serviços.
- Conteúdo de `homeWeeks`, após explicitar campos opcionais, revisão e publicação.
- Na implementação futura, extrair os trechos da Home em `GestationProgress`,
  `WeeklyContentSection` e `ContextualServices`; hoje esses componentes ainda não
  existem. Extrair somente quando houver uso real nas duas telas.

## Estados e navegação

- Sem gestação ativa ou DPP calculável: estado neutro, sem afirmar semana atual.
- Semana não publicada: mensagem de indisponibilidade e retorno à Home, sem texto
  médico inventado. Parâmetro inválido: rota não encontrada.
- Sem serviço correspondente: estado vazio discreto; não afirmar que a clínica
  não oferece serviços. Sem URL: nome em texto, sem botão sem destino.
- Link Home → semana somente depois que a rota estiver implementada.
- Memórias, cartas e outras telas permanecem fora deste incremento.

## Validação futura

Verificar semana atual versus consultada, estados vazios, filtro de serviços,
fontes, retorno à Home, foco/teclado e renderização real em desktop e celular.
Não considerar a revisão estática atual uma aprovação visual no navegador.
