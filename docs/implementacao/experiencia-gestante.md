# Etapa 2 — Memórias, Clínica e Perfil

Escopo autorizado nesta rodada: Memórias (Fotos, Diário, Ultrassons, Cartas, Momentos/Marcos), CRUD privado, Minha Clínica, Perfil, navegação e integração com Home/Jornada. Sem recursos de roadmap.

## Reutilização e privacidade

Nenhuma migration. `private_memories`, datas e semana da migration já aplicada, `pregnancies`, `profiles`, `consent_records`, `clinic_themes` e `clinic_services` são reutilizados. Não existe tabela de profissionais: nenhum profissional é inventado nem inferido dos usuários da equipe.

Todos os acessos usam sessão SSR e `requireClinic(patient)`, com filtros de proprietário/clínica e RLS existente. Edits não aceitam troca de tipo, proprietário, gestação ou arquivo. Semana recalculada a partir da DPP da gestação original, não da gestação ativa atual. Sem service role nos novos fluxos.

Fotos: PNG/JPEG/WebP. Ultrassons: mesmas imagens ou PDF, até 2 MB por arquivo, abaixo do limite atual de Server Actions e da hospedagem. Validação de assinatura, tamanho e MIME, sem alteração dos bytes da imagem. Não há interpretação de exames. PDF só para download, nunca HTML ou SVG executável.

Bucket privado `private-memories`, caminhos `clinic/user/pregnancy/record.ext`. Leitura por rota autenticada, RLS, `private, no-store`, `nosniff`. Nada é publicado ou compartilhado com clínicas. PDF com Content-Disposition attachment e CSP sandbox.

Criação grava a referência antes do upload. Em caso de interrupção, o registro continua identificável, pode ser concluído reenviando o mesmo formulário ou excluído em Memórias. Reenvio usa UUID estável e não sobrescreve arquivo existente. Exclusão confirma intenção, remove arquivo primeiro e depois a linha; falha mantém o registro para nova tentativa. Banco e Storage não são uma transação distribuída: indisponibilidade entre operações exige nova tentativa, sem declarar sucesso indevido.

## Experiência

Filtros paginados, 20 registros por página, ordenação por data/criação/UUID. Cartas até 20.000 caracteres; demais textos até 2.000. Legenda opcional para anexos. Todas as categorias aparecem na Jornada e possuem detalhe/edição/exclusão. Home mostra apenas tipo/data/link da memória mais recente, sem expor texto privado como dashboard.

Perfil permite nome/apelido e reaproveita foto, consentimentos, exportação, recuperação e exclusão de conta. DPP/DUM e situação são exibidas sem inventar edição clínica. Aparência existente no cabeçalho, persistente no navegador.

CSS exclusivamente por tokens, grade de uma coluna no celular, controles mínimos de 44px, texto de formulário 16px, quebra de textos longos e safe area da navegação existente. Teclado virtual, seletor nativo de fotos e datas em aparelho físico dependem de validação manual quando o navegador remoto não oferece emulação.

## Rotas

- `/[clinic]/gestante/memorias`, filtro `tipo=todas|fotos|diario|ultrassons|cartas|momentos`
- `/[clinic]/gestante/memorias/nova`, tipo inicial via `tipo=photo|ultrasound|letter|diary|memory|milestone`
- `/[clinic]/gestante/memorias/[id]`
- `/[clinic]/gestante/memorias/[id]/editar`
- `/[clinic]/gestante/memorias/[id]/arquivo` (somente proprietária autenticada)
- `/[clinic]/gestante/clinica`
- `/[clinic]/conta` (ampliada)

## Verificação

Testes de formatos/tamanhos de upload, PDF, datas, limites de texto, dados de vínculo forjados, perfil, rota privada de arquivos, tokens e responsividade estrutural. A suíte Postgres local cobre CRUD por proprietária e bloqueio de leitura/edição/exclusão para os outros papéis nas sete categorias. Resultado de build, suíte final e validação de produção registrados na entrega.
