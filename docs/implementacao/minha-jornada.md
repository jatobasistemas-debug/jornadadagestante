# Minha Jornada + Diário

Rodada autorizada: registros textuais privados, linha do tempo e novo registro. Sem uploads, Cartas, Memórias como módulo, exportação editorial, pagamentos ou automações.

## Estrutura reutilizada

`private_memories` mantém a propriedade por `user_id`, `clinic_id` e `pregnancy_id`, a FK composta e a política `memories_owner`. Todas as consultas usam o cliente SSR da sessão, nunca service role. `requireClinic(..., ['patient'])` protege leitura e criação. A clínica e a gestação da gravação são resolvidas no servidor.

A migration `20260919091338_journey_record_dates.sql` acrescenta `occurred_on`, `gestational_week`, categorias `memory` e `milestone` e índice cronológico. Era necessária porque `created_at` registra a criação, não a data escolhida pela gestante. Registros antigos recebem a data local de criação e estimativa da semana, sem modificar corpo, categoria original ou timestamp. `moment` permanece compatível e aparece como Memória.

A semana fica registrada conforme a DPP no momento de salvar. Fora do intervalo calculável ela fica nula, sem inventar uma semana. A data não pode ser futura. Texto de até 2.000 caracteres, sem HTML interpretado. Tentativas repetidas do mesmo formulário não duplicam o registro.

## Rotas e componentes

- `/[clinic]/gestante/jornada`: registros da proprietária, mais recentes primeiro, 20 por página; data, semana, tipo e texto.
- `/[clinic]/gestante/jornada/novo`: criação opcional, com data, tipo e texto.
- `JourneyTimeline`, `JourneyEmpty`, `JourneyRecordForm`.
- Navegação existente passa a disponibilizar Minha Jornada; convite da Home aponta para novo registro.
- Todos os estilos usam os tokens de tema existentes, inclusive os modos Claro, Escuro e Sistema.

## Evolução futura

As categorias `photo`, `ultrasound` e `letter`, o campo `storage_path` e a relação com gestação já existem. Não são expostos nesta rodada. Cápsula do tempo e livro/álbum poderão consumir os registros por data e gestação, mas não têm processamento, compartilhamento ou telas implementados. Nenhuma informação privada é liberada à clínica ou a acompanhantes.

## Verificação local

Build e TypeScript aprovados. 66 testes aprovados, incluindo preservação dos registros legados pela migration, cálculo de datas/semana, rejeição de dados adulterados, texto seguro, navegação e isolamento dos três tipos no Postgres local. Validação visual de produção é registrada no resumo de entrega.
