# Recuperação de senha entre navegadores

## Implementação

O template de recuperação aponta diretamente para
`{{ .SiteURL }}/auth/recovery?token_hash={{ .TokenHash }}&type=recovery`.
O endpoint aceita somente `recovery`, usa `verifyOtp` com a chave pública,
grava os cookies SSR na própria resposta e então redireciona para
`/auth/nova-senha`. Não precisa do verificador PKCE do navegador que pediu o e-mail.
Links inválidos/expirados retornam a `/auth/recuperar?erro=link`.
O token não é repassado à página de senha, não é registrado em logs da aplicação
e a resposta usa `no-store` e `no-referrer`.

A inicialização do SDK é aguardada antes de `verifyOtp`, para que o evento
`PASSWORD_RECOVERY` grave os cookies antes da resposta HTTP ser enviada.

Login, cadastro, callback PKCE, atualização de senha e exclusão de conta não foram
alterados. O `redirectTo` legado da solicitação de recuperação foi mantido para
compatibilidade durante a atualização do template. O novo template usa `SiteURL`
diretamente e ignora esse `redirectTo`, portanto não passa pelo callback PKCE.
E-mails antigos continuam sujeitos à limitação de navegador do fluxo antigo;
solicite novos e-mails após salvar o template.

## Ativação no projeto hospedado (necessária)

O arquivo `supabase/config.toml` configura apenas o Supabase local. Um push no
GitHub/Vercel **não altera** os templates do Supabase hospedado.

1. No projeto `jornada-da-gestante`, abra Authentication → Emails → Reset password.
2. Copie o conteúdo completo de `supabase/templates/recovery.html` para Body e salve.
   Não altere o template Confirm sign up.
3. Confirme que Site URL é `https://jornadadagestante.vercel.app` (sem barra final).
   O template possui um destino fixo e não depende de um novo Redirect URL.
   Preserve os Redirect URLs existentes, usados pelo cadastro e por e-mails antigos.
4. Só depois solicite novos e-mails em `/auth/recuperar`.

Não são necessárias novas variáveis: `APP_URL`, `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` continuam sendo usadas. Não é utilizada
`SUPABASE_SERVICE_ROLE_KEY` neste fluxo.

## Verificação

`tests/password-recovery.test.ts` usa o SDK Supabase SSR instalado com transporte
Auth simulado. Verifica dois contextos: cookie PKCE presente e nenhum cookie.
Ambos devem receber a sessão em Set-Cookie antes do redirect; nenhuma chamada a
`exchangeCodeForSession` é feita. Também verifica tipo errado/parâmetros duplicados,
link expirado/reutilizado, resposta sem sessão e destino externo ignorado.
Esses testes não comprovam entrega de e-mail nem troca real de senha em produção.

Validação em 18/09/2026: build de produção, `npm run typecheck` e `npm test`
aprovados (53 testes, sem falhas ou testes ignorados). A suíte existente de banco
usa PGlite local; não houve alteração nem teste adicional no banco de produção.

Para a validação real, use dois links novos e distintos (cada link é de uso único):

- Mesmo navegador: peça a recuperação em A, abra o novo e-mail em A e conclua a troca.
- Outro navegador: peça um segundo link em A e abra em B (outro navegador/aparelho,
  sem cookies de A); a página de nova senha deve abrir e permitir concluir a troca.
- Entre com a senha nova após cada cenário. Não compartilhe senhas ou tokens em logs/chat.

Estado ao preparar esta alteração: template de produção ainda não atualizado;
o painel exige login e o conector Supabase não expõe configuração de Auth.
Os dois cenários reais ficam pendentes dessa ativação e do acesso aos e-mails.

Referências oficiais:
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/reference/javascript/auth-verifyotp
