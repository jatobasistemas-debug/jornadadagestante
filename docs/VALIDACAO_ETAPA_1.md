# Validação da Etapa 1 — 17/09/2026

**ETAPA 1 AINDA PENDENTE.** Não recriar o projeto, reaplicar migrações ou executar novamente o seed. A Etapa 2 não foi iniciada.

## Banco e dados preservados

Projeto real `jornada-da-gestante`, referência `hawwwionisjmmaxflrqj`. Auditoria: quatro migrações, 14 tabelas públicas com RLS, 51 constraints, 30 índices e 41 políticas públicas/Storage. Nenhum índice ou constraint inválido. Nenhuma função SECURITY DEFINER no schema público. A trava privada de cadastro permanece sem privilégios de leitura para anon/authenticated.

Vida Plena e Horizonte, sete contas e três gestantes preservadas. Ana Carolina continua gestante. Nenhum usuário ou estrutura foi recriado nesta retomada.

## Testes e evidências

| Verificação | Resultado |
| --- | --- |
| Testes locais | 35/35 aprovados em 16/09 |
| TypeScript e build de produção | Aprovados após as correções |
| Integração real, primeira rodada de 16/09 | 16/17 aprovados; um erro temporal do Supabase |
| Reexecução isolada do caso afetado | Aprovada |
| Revalidação de RLS após correções | 7/7 aprovados, sem falhas |
| Storage real | 4/4 aprovados, incluindo arquivos privados |
| Temas reais | Vida Plena alterada, Horizonte preservada, cores restauradas |
| Autenticação real | Senha incorreta, login, identidade, renovação e logout aprovados |
| HTTP da aplicação, retomada de 17/09 | 7/7 aprovados, sem falhas: saúde, identidade das clínicas, login, logo, avatar, gravação isolada de tema e logout |
| Navegador | Bloqueado pela política de URL do ambiente |
| Cadastro e recuperação com e-mail | Não homologados |

Evidências em `docs/test-results/`: `unit-2026-09-16.tap`, `build-2026-09-16.log`, `integration-2026-09-16.tap`, `rls-owner-recheck-2026-09-16.tap`, `rls-after-fixes-2026-09-16.tap`, `database-audit-2026-09-16.json`, `http-resume-2026-09-17.log`.

O caso inicialmente recusado retornou `PGRST303: JWT issued at future`. A reexecução isolada e a rodada posterior de sete verificações RLS passaram, sem relaxar permissões. Não confundir a aprovação posterior com uma primeira rodada sem falhas.

Storage validou logo público com escrita isolada; avatar privado com substituição e bloqueio de terceiros; memórias privadas com leitura/escrita/exclusão, validação de caminhos e MIME. Testes usaram contas reais e a API real, sem chave de serviço. Logos públicos são identidade da clínica, não dados privados de gestantes.

HTTP já comprovou saúde, temas renderizados, login por papel, bloqueios de rotas e exportação exclusiva da titular. `http-images.json` e `http-resume-2026-09-17.log` registram a aprovação dos formulários corrigidos, inclusive confirmação depois do upload e remoção, persistência do tema e logout com recusa de exportação após sair. Testes HTTP não substituem navegador.

## Correções realizadas

1. Removido o temporário antigo e os fixtures deixados pelas execuções interrompidas, após conferir seus bytes.
2. Upload/remover logo e avatar, com validação PNG/JPEG/WebP, limite de 2 MiB, autorização e RLS. Arquivos originais preservados, avatar privado.
3. Identificado travamento da resposta HTML após a imagem já ter sido gravada. As ações bem-sucedidas de imagens e tema agora redirecionam à tela de confirmação. Envio/remoção de logo e avatar, salvamento de tema e confirmação na página foram aprovados depois da correção.
4. Campo de URL da logo sincronizado sem remontar o editor e descartar cores ainda não salvas.
5. Teste HTTP limpa automaticamente apenas fixtures reconhecidos, inclusive após falhas.
6. Logout dos testes limitado à própria sessão, evitando derrubar outras sessões. Comando de integração executa os arquivos sequencialmente.
7. Cache de compilação Turbopack corrompido removido; nova compilação aprovada. Fontes e migrações preservadas.
8. README atualizado para não sugerir recriar o banco existente. Seed desabilitado nesta retomada.

## Pendências que impedem a conclusão

- **Cadastro e recuperação:** falta um e-mail sob controle do usuário, autorizado a receber links. A revisão automática bloqueou envio ao destinatário fictício de propriedade não estabelecida. Não tentar outro destinatário arbitrário. Auth público confirma e-mail habilitado e confirmação obrigatória; entrega de mensagens ainda não comprovada.
- **Navegador:** navegação explicitamente bloqueada pela política de URL. Não contornar por outro host, porta ou mecanismo. QA visual e fluxo no navegador não estão aprovados.
- **Exclusão real de conta:** falta `SUPABASE_SERVICE_ROLE_KEY` configurada somente no servidor. Não enviar no chat ou incluir no pacote. Testar com conta de teste autorizada, nunca apagar as sete contas existentes.

Os ativos originais de logo não foram fornecidos; a interface mantém identificação textual. Fixtures não são logos substitutas e são removidos.

O advisor aponta proteção contra senhas vazadas desabilitada. Revisar antes de pacientes reais: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. RLS sem políticas em `private.registration_settings` é intencional; não conceder acesso à API para silenciar o aviso.

## Ambiente e retomada

Manter `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `APP_URL`; `SUPABASE_SERVICE_ROLE_KEY` somente no servidor; `REGISTRATION_ENABLED` coordenada com a trava do banco; `DEMO_PASSWORD` para testes. Manter `ALLOW_DEMO_SEED=false` no projeto já provisionado. Nenhum valor secreto acompanha este pacote.

A rodada de formulários foi concluída. A consulta final `final-state-2026-09-17.json` confirmou zero objetos temporários no Storage, zero avatares de fixture associados, temas originais restaurados, Ana gestante ativa e equipe ativa. Não repetir o trabalho já aprovado.

Próximo passo: obter destinatário autorizado e validar confirmação de cadastro, recuperação e troca de senha; resolver o bloqueio de navegador e a configuração segura da exclusão. Conferir redirects e SMTP no teste de e-mail. Não liberar pacientes reais com termos/privacidade ainda em minuta. Não reaplicar as quatro migrações.
