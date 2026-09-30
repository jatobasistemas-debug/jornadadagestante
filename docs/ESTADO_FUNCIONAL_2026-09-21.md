# Continuidade da conclusão funcional

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
- Integração do nascimento/cápsula como eventos destacados na linha do tempo, seleção de livros acima dos primeiros 100 registros, relatórios administrativos exportáveis, cadastro operacional de equipe por convite e consolidação da central para acompanhante ainda requerem conclusão.
- A lista atual de funcionalidades implementadas não constitui declaração de produto integralmente concluído.

## Retomada

Verificar o último commit/deploy e este registro. Não recriar estruturas. Continuar pelas pendências funcionais acima, depois validar autenticação dos novos papéis e arquivos pelo navegador. Os testes aprovados da Etapa 1 não precisam de nova auditoria.
