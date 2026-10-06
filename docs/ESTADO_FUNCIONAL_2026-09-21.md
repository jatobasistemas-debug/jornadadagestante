# Continuidade da conclusão funcional

## Retomada de 6 de outubro de 2026

- Supabase confirmado `ACTIVE_HEALTHY` após a reativação. A consulta anônima dos planos voltou a passar. A falha anterior de `/comecar` coincidiu com o projeto inativo; não foi alterado o fluxo de autenticação por hipótese.
- Alterações locais de 30/09 recuperadas após manutenção automática do workspace, a partir do commit publicado `3adc466` e do registro da execução.
- Implementados: central `/conta` para contas sem clínica, exportação operacional CSV, seleção de livro com paginação de todas as memórias próprias, navegação do acompanhante pelas 40 semanas e conteúdo aprovado do CMS.
- Timeline integra nascimento e cápsulas, com filtros, paginação e RLS das tabelas originais. Migration `20261006000434_journey_timeline_events.sql` aplicada. Nenhuma tabela ou policy nova: 42 tabelas públicas, todas com RLS, e 99 policies em public/storage.
- 139 testes locais, build e TypeScript aprovados. Integração SQL real passou com nascimento/cápsula na timeline, isolamento, compartilhamento e livro. Rollback confirmado: zero usuários QA restantes.
- Ainda não declarar produto completo: navegador autenticado, arquivos reais dos novos fluxos, e-mails do produto e pendências funcionais abaixo precisam de conclusão.

## Evidências desta rodada

- As cinco migrations novas foram aplicadas, sem reaplicar as cinco anteriores. Os nomes locais correspondem às versões registradas pelo Supabase.
- 134 testes locais passaram: unidade e integração SQL em PGlite, incluindo permissões reais do Postgres. Não equivalem a 134 testes de navegador em produção.
- Build e TypeScript passaram. O cache antigo do Turbopack foi movido para fora do repositório após um erro interno; a recompilação limpa passou.
- `tests/integration/product-rls.sql` passou no Supabase autorizado: proprietária, outra gestante, clínica externa, superadmin, acompanhante, compartilhamento, revogação, cápsula, nascimento e criação/edição de livro. Fixtures e flags são revertidas com rollback.
- Nenhuma credencial foi adicionada ao repositório.

## Implementação disponível no código

Acesso direto e por código/link/QR; planos configuráveis e histórico de acesso; administração de serviços, profissionais, códigos, campanhas, clínicas, identidade e flags; leitura operacional da clínica; convites e área do acompanhante; compartilhamento explícito; cápsulas; nascimento e pós-parto; busca privada; CMS semanal/pós-parto/Radar; comunidade e moderação; indicação; preferências de comunicação; fila de e-mails; seleção/editoração privada de livro PDF; exportação ampliada.

As flags novas começam desativadas. Criação de tabela/rota ou sucesso de build não é evidência de conclusão integral do módulo em produção.

## Correções comprovadas

- Separação de e-mails transacionais dos resumos opcionais.
- Edição de cápsula e nascimento usa somente colunas autorizadas; compartilhamento pode ser atualizado sem trocar proprietária.
- Reação repetida é idempotente sem conceder UPDATE indevido.
- Publicação editorial rejeita revisor nulo ou em branco.
- Busca por espaço evita links para memórias de outra Jornada da mesma pessoa.
- Gestação deixa de avançar após nascimento; registros posteriores não recebem semana gestacional fictícia.
- PDF aceita WebP por conversão local, PNG/JPEG e páginas de ultrassom PDF.
- Cancelamento de acesso patrocinado respeita a constraint do patrocinador; leitura e exclusão permanecem permitidas, novas gravações e uploads são bloqueados.

## Pendências que não podem ser declaradas concluídas

- Validação de navegador autenticado dos novos fluxos, upload/download/exclusão reais das novas modalidades e mobile/teclado físico. O navegador abriu sem sessão.
- Conferência e ativação operacional das flags após publicação e validação.
- E-mails do produto exigem `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` no servidor. SMTP do Auth é independente e foi preservado. Entrega real destes novos templates ainda não comprovada. Worker diário às 12 UTC; agenda resumo aos domingos; lote de 30, com tentativas limitadas.
- Gateway de pagamento não contratado/configurado: não há cobrança nem aprovação financeira simulada. WhatsApp não envia mensagens.
- Conteúdo profissional das semanas/dias/Radar/acompanhante ainda depende de revisão e publicação; não preencher com conteúdo médico inventado.
- Cadastro operacional de equipe por convite ainda requer conclusão. O gerenciamento atual usa uma conta já existente por identificador.
- Validar duração do worker de e-mail com lotes e lentidão de provider; envio transacional diário pode atrasar boas-vindas e notificações de segurança.
- A lista atual de funcionalidades implementadas não constitui declaração de produto integralmente concluído.

## Retomada

Verificar o último commit/deploy e este registro. Não recriar estruturas. Continuar pelas pendências funcionais acima, depois validar autenticação dos novos papéis e arquivos pelo navegador. Os testes aprovados da Etapa 1 não precisam de nova auditoria.
