# Validação · Jornada da Gestante · Etapa 1

> Registro histórico de 06/09. Não usar suas instruções de provisionamento na retomada: o banco real já existe. O estado atual está em `VALIDACAO_ETAPA_1.md`.

Data da entrega: 06/09/2026.

**Resultado: implementação de código e validação local concluídas; Etapa 1 NÃO concluída segundo todos os critérios de aceite do usuário.** Falta conectar e homologar um Supabase real. Não foi feito deploy público.

## Evidências executadas

| Verificação | Resultado | Limite |
| --- | --- | --- |
| Leitura das cinco fontes e preservação de cópias | Concluída | Logo oficial e referências em imagem não estavam anexadas |
| Compilação de produção `npm run build` | Aprovada | Build sem conexão Supabase |
| TypeScript estrito | Aprovado no build final | Sem execução dos serviços externos |
| Migrações SQL e RLS em PostgreSQL/PGlite | 27 testes aprovados | Auth/Storage são schemas de teste; `auth.uid()` recebe contexto simulado |
| Tokens, contraste, cadastro e redirects | 5 testes aprovados | Não substituem teste visual em dispositivo |
| Servidor Next.js de produção | Inicializou e respondeu HTTP 200 | Backend não configurado, conforme estado explícito do aplicativo |
| HTML, CSS, termos, privacidade, recuperação e bloqueio de áreas | Verificados por HTTP | Sem login de usuário real |
| Supabase Auth/PostgREST de integração | 4 testes ignorados | Nenhuma URL/chave/conta Supabase disponível |
| Navegador, celulares e leitores de tela | Não executados | CSS responsivo, viewport, labels, foco e semântica implementados; falta inspeção visual |

Os 32 testes locais foram aprovados sem falhas. Os quatro testes ignorados não foram somados às aprovações. PGlite é uma dependência de desenvolvimento, não uma substituição do PostgreSQL/Supabase da aplicação.

## Cobertura de segurança efetivamente testada

- Todas as 14 tabelas de aplicação em `public` têm RLS.
- Anônimos não consultam tabelas de clínica; a função pública só retorna identidade de clínica ativa, sem plano ou cobrança.
- Cadastro cria perfil, vínculo fixo de gestante, gestação e três registros de aceite atomicamente.
- Metadados forjados de admin/superadmin não concedem privilégios.
- Cadastro inválido é revertido, inclusive perfil e usuário do schema de teste.
- Trava de cadastro no banco também bloqueia chamadas diretas.
- Gestante só lê seus dados, inclusive quando outra gestante pertence à mesma clínica.
- Equipe e administrador leem dados operacionais da própria clínica.
- Memórias são privadas inclusive para equipe, administrador da clínica e superadmin.
- Relações forjadas de proprietário, clínica e gestação são rejeitadas.
- Equipe, gestante e outra clínica não alteram o tema da clínica.
- Tema do administrador persiste no SQL; a projeção pública reflete a alteração.
- Tokens incompletos e tentativas de inserir CSS são rejeitados no banco.
- Alteração direta de papéis e adulteração de consentimentos/auditoria são bloqueadas.
- RPC de equipe rejeita clínica externa, alteração do próprio papel e conversão de gestante.
- Alteração de tema produz auditoria sem copiar seu conteúdo.
- Políticas de objetos de Storage restringem o caminho ao proprietário e rejeitam caminhos malformados e diretórios extras.
- Suspensão e revogação de vínculo removem acesso sem depender de um papel antigo no JWT.
- Exclusão de usuário Auth no banco de teste remove os registros pessoais por cascata.
- Cadastro valida data, senha e aceites; callback bloqueia redirecionamento externo.

## Critérios de aceite do usuário

| Critério | Situação real |
| --- | --- |
| Estrutura real do projeto criada | Sim |
| Banco configurado | Configuração Supabase e migrações prontas; executadas em banco de teste. Instância real pendente |
| Tabelas e relacionamentos criados | Criados e testados no PostgreSQL de validação; aplicação no Supabase real pendente |
| Autenticação funcional | Código completo implementado; fluxo real ainda não homologado |
| Isolamento entre clínicas | RLS e relações implementadas e aprovadas nos testes SQL; validar também pela API real |
| Permissões/RLS configuradas | Migrações e testes aprovados; publicar no projeto Supabase escolhido |
| Temas funcionando por clínica | Tokens, editor, SQL persistente e carregamento por slug implementados; validação ponta a ponta pendente |
| Dados de demonstração suficientes | Fixtures SQL executadas nos testes; script de provisionamento Auth pronto, ainda não executado em Supabase |
| Testes básicos executados | 32 testes locais, compilação e teste HTTP aprovados |
| Erros encontrados corrigidos | Corrigidos os erros de tipagem e execução dos testes locais; verificações finais aprovadas |
| Aplicação executando sem erros críticos | Servidor de produção iniciou e serviu as rotas testadas; operação com backend ainda não comprovada |

## Pendências antes de declarar a Etapa 1 concluída

1. Disponibilizar um projeto Supabase de desenvolvimento, com credenciais inseridas por canal seguro no ambiente. Não enviar chave de serviço em texto público nem incluí-la no repositório.
2. Aplicar as três migrações e executar `npm run seed:demo` nesse projeto.
3. Configurar URLs de callback, confirmação de e-mail e entrega de recuperação de senha no Supabase Auth.
4. Executar os quatro testes de integração real e testar no navegador: cadastro com confirmação, login, renovação de sessão, recuperação, logout, edição persistente de tema e tentativa de abrir o endereço de outra clínica.
5. Testar exportação e exclusão com arquivos reais de demonstração no Storage, incluindo falha intermediária e repetição. A exclusão usa Auth/Storage externos e não foi homologada nesta entrega.
6. Validar as telas de acesso e temas em celular/desktop e aplicar a logo oficial quando fornecida.

Antes de liberar para pacientes reais, concluir também a revisão dos documentos de privacidade/termos, contatos e retenção, o procedimento de retirada específica de consentimento e a exportação completa de mídia. Isso não deve ser confundido com criar a experiência da Etapa 2.

## Como continuar

Abrir o `README.md`, preencher o ambiente Supabase, aplicar migrações, provisionar apenas dados fictícios e executar a homologação da Etapa 1. Só depois do aceite avançar para a Etapa 2. O projeto não contém essa segunda etapa implementada.
