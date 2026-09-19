# JORNADA DA GESTANTE — PROMPT-MESTRE V1

**Empresa proprietária:** Jatobá Sistemas  
**Domínio principal:** jornadadagestante.online

## Objetivo

Construir uma aplicação web premium, responsiva e mobile-first com acesso patrocinado por clínicas/parceiros e assinatura direta pela gestante, conforme atualização oficial da seção 31.

O produto **não é um prontuário médico**.

O produto é uma plataforma de relacionamento, acompanhamento, informação, memória e fidelização entre a clínica e a gestante durante a gravidez.

## Missão da marca

> Fazer com que nenhuma gestante atravesse a gravidez sentindo que é apenas mais uma paciente.

## Princípio central

> Primeiro cuidar. Depois oferecer.

A aplicação deve acompanhar a gestante ao longo da gravidez de forma humana, delicada e útil.

A publicidade dos serviços da clínica deve existir, porém sempre de forma contextual, elegante e discreta.

---

## 1. Arquitetura do produto

A aplicação deverá possuir três ambientes independentes:

1. **Área da Gestante**
2. **Painel da Clínica**
3. **Painel Superadmin da Jatobá Sistemas**

O sistema deve ser **multi-tenant**.

Uma única instalação deve atender várias clínicas.

Cada clínica possui:
- identidade própria;
- logo;
- cores;
- dados;
- usuários;
- serviços;
- gestantes;
- materiais;
- domínio, subdomínio ou URL própria.

Nunca duplicar o software para cada cliente.

---

## 2. Identidade visual por clínica

Criar sistema de temas.

Cada clínica poderá ter:
- logo;
- cor principal;
- cor secundária;
- cor de apoio;
- fundo;
- cor dos textos;
- telefone;
- WhatsApp;
- endereço;
- Instagram;
- site;
- cidade;
- slogan.

A aplicação deve adaptar automaticamente:
- botões;
- barras;
- cards;
- indicadores;
- landing page;
- cartas;
- PDFs;
- materiais gráficos.

A marca “Jornada da Gestante” permanece presente de forma discreta.

Exemplo:

**Jornada da Gestante**  
*com Clínica Vida Plena*

Não modificar layouts manualmente por clínica.

---

## 3. Cadastro da gestante

O cadastro precisa ser extremamente simples.

Solicitar inicialmente:
- nome;
- e-mail;
- senha;
- data prevista do parto OU data da última menstruação;
- aceite de termos;
- aceite da política de privacidade.

O sistema calcula automaticamente:
- semana gestacional atual;
- trimestre;
- quantidade aproximada de semanas restantes.

Depois do cadastro, oferecer informações opcionais:
- como gostaria de ser chamada;
- primeira gravidez: sim/não;
- nome do bebê, se já houver;
- foto de perfil;
- foto relacionada à gestação;
- lembretes por e-mail;
- participação no canal público da clínica, apenas como link externo.

Nunca obrigar a mãe a preencher dados emocionais.

---

## 4. Home da gestante

A tela principal deve ser bonita, acolhedora e simples.

Cabeçalho:
- “Olá, Ana ❤️”
- “Vocês chegaram à semana 18.”

Mostrar uma barra visual:
- **18 de 40 semanas**

A home deve possuir cinco blocos principais:

### Seu bebê
Informações sobre o desenvolvimento daquela semana.

### Você
Mudanças que algumas gestantes podem perceber naquela fase.

### Para observar
Informações educativas e responsáveis sobre situações que podem justificar conversar com a equipe de saúde.

Nunca diagnosticar.  
Nunca substituir atendimento profissional.

### Para guardar
Uma pergunta emocional ou convite para registrar algo daquela semana.

Exemplos:
- “Quer guardar alguma coisa desta semana?”
- “Qual foi o momento mais bonito dos últimos dias?”
- “Você sentiu algo que gostaria de lembrar?”

### Seu cuidado
Serviços que a clínica realmente oferece e que podem ser pertinentes naquela etapa.

Os serviços devem aparecer discretamente, sem linguagem agressivamente comercial.

---

## 5. Navegação da gestante

Menu inferior mobile:

- Início
- Minha Jornada
- Memórias
- Minha Clínica
- Perfil

Manter a navegação extremamente simples.

---

## 6. Minha Jornada

Criar uma linha do tempo vertical da gravidez.

Exemplos:
- Semana 8 — “Descobri a gravidez.”
- Semana 12 — “Primeiro ultrassom.”
- Semana 18 — registro pessoal.
- Semana 22 — foto.
- Semana 30 — “Escolhemos o nome.”

Cada semana pode conter:
- texto;
- fotografia;
- memória;
- ultrassom enviado pela gestante;
- carta;
- sentimento;
- marco.

Não transformar a experiência em obrigação.

---

## 7. Memórias

Criar categorias:
- Fotos
- Diário
- Ultrassons
- Cartas
- Momentos

As memórias pessoais pertencem à gestante.

### Regra de privacidade
A clínica **não pode visualizar automaticamente**:
- diário;
- cartas para o bebê;
- fotos pessoais;
- memórias privadas.

Esses dados devem ser privados por padrão.

---

## 8. Cartas para o bebê

Criar uma função emocional chamada:

**Cartas para o bebê**

A mãe pode escrever textos livres durante a gravidez.

Essas cartas ficam armazenadas e podem ser incluídas no Livro da Jornada.

---

## 9. Minha Clínica

Mostrar:
- nome;
- logo;
- foto;
- endereço;
- telefone;
- WhatsApp;
- Instagram;
- profissionais, se cadastrados;
- serviços disponíveis.

Serviços possíveis:
- obstetrícia;
- ultrassonografia;
- exames laboratoriais;
- nutrição;
- odontologia;
- psicologia;
- fisioterapia pélvica;
- vacinação;
- outros.

Os módulos são configurados individualmente para cada clínica.

Uma clínica que só possui ultrassonografia deve visualizar apenas conteúdos e chamadas relacionadas ao que realmente oferece.

Não criar agenda médica própria na V1.

Os botões podem direcionar para:
- WhatsApp existente;
- sistema externo de agendamento;
- telefone;
- URL configurada pela clínica.

---

## 10. Conteúdo semanal

Criar arquitetura para conteúdos das semanas da gravidez.

O conteúdo deve ser administrado centralmente pela Jatobá Sistemas.

A clínica **não deve poder alterar livremente textos médicos ou educativos centrais**.

Cada semana deve suportar:
- título;
- desenvolvimento do bebê;
- informações para a mãe;
- curiosidade;
- cuidado;
- alerta educativo;
- pergunta emocional;
- serviços potencialmente relacionados;
- fontes/revisão;
- status de publicação.

A IA nunca deve criar diagnóstico individual para a gestante.

---

## 11. E-mails

Implementar e-mail automático semanal.

Exemplo:

**“Ana, sua 23ª semana começou ❤️”**

Botão:
**“Ver minha semana”**

Criar também:
- e-mail de boas-vindas;
- recuperação de senha;
- lembretes ocasionais;
- aviso de nova carta;
- conclusão da jornada.

Não implementar WhatsApp automático na V1.

---

## 12. Cartas físicas

Criar módulo **Cartas da Jornada**.

Marcos sugeridos:
1. Começamos
2. Um novo trimestre
3. Metade do caminho
4. Está chegando
5. Nossa história

A clínica deverá visualizar:
- cartas pendentes;
- quantidade por marco.

Permitir selecionar várias gestantes e clicar:
**GERAR CARTAS**

O sistema gera PDF pronto para impressão contendo:
- nome da gestante;
- conteúdo correspondente;
- identidade da clínica;
- QR Code individual;
- logo;
- mensagem;
- dados pertinentes.

Criar modo de impressão em lote.

---

## 13. Livro / Revista da Jornada

Quando a gestação for concluída, permitir gerar:

**Livro da Minha Jornada**

Versão digital incluída.

O sistema monta automaticamente:
- capa;
- nome da mãe;
- nome do bebê, se informado;
- datas;
- semanas;
- fotografias selecionadas;
- memórias;
- ultrassons;
- cartas;
- marcos;
- linha do tempo;
- mensagem final.

O PDF deve ser preparado também para impressão física.

Prever formato editorial adaptável futuramente para:
- revista A4;
- couchê 90g;
- grampeada ou outra encadernação;
- impressão gráfica profissional.

A impressão física não deve ser ilimitada automaticamente.

Criar estrutura futura para:
**Solicitar versão impressa**

Campos:
- quantidade;
- custo de impressão;
- frete;
- status: solicitada / em produção / enviada / entregue.

A entrega pode ocorrer até aproximadamente 30 dias após o nascimento.

---

## 14. Encerramento da gestação

Criar botão:

**Meu bebê nasceu ❤️**

Solicitar:
- data do nascimento;
- nome, opcional;
- fotografia, opcional.

Depois mostrar:
**“Vocês chegaram.”**

Permitir:
- rever a jornada;
- selecionar memórias;
- escolher capa;
- escrever última carta;
- gerar Livro da Jornada.

Também permitir:
**Pausar ou encerrar jornada**

Sem obrigar a informar motivo.

Usar linguagem respeitosa e neutra.

---

## 15. Painel da clínica

Dashboard:
- gestantes ativas;
- novas este mês;
- distribuição por trimestre;
- cartas para imprimir;
- acessos recentes;
- serviços mais acessados;
- cliques em agendamento;
- gestantes por semana gestacional.

Lista de gestantes:
- nome;
- semana;
- data de entrada;
- último acesso;
- status.

A clínica não vê conteúdo privado das memórias.

---

## 16. Usuários da clínica

Perfis:
- Administrador
- Equipe

Administrador:
- configura clínica;
- gerencia equipe;
- serviços;
- materiais;
- gestantes;
- relatórios.

Equipe:
- operações;
- cartas;
- gestantes;
- materiais.

---

## 17. Materiais de divulgação

Criar uma área:
**Materiais**

Categorias:
- cartaz A3;
- cartaz A4;
- display de balcão;
- cartão;
- story;
- feed;
- banner;
- flyer.

Cada categoria pode possuir vários modelos.

A clínica escolhe um modelo.

O sistema aplica automaticamente:
- logo da clínica;
- cores;
- QR Code;
- URL;
- telefone;
- dados.

Gerar arquivo pronto para download/impressão.

A Jatobá deverá poder adicionar novos modelos pelo painel superadmin.

---

## 18. Kit de lançamento

Ao ativar nova clínica, mostrar checklist:

- Aplicação configurada
- QR Code criado
- Landing page pronta
- Cartaz criado
- Story criado
- Identidade aplicada
- Treinar recepção
- Colocar cartaz
- Publicar lançamento
- Ativar campanha local

---

## 19. Landing page da clínica

Criar página pública personalizada.

Exemplo:

**“Está grávida?”**  
**“Comece gratuitamente sua Jornada da Gestante.”**

Mostrar:
- identidade da clínica;
- benefícios;
- explicação;
- QR Code;
- botão começar;
- localização;
- serviços;
- contato.

URL possível:
**jornadadagestante.online/clinicavida**

Estruturar código para futuramente suportar domínio ou subdomínio personalizado.

---

## 20. Painel Superadmin Jatobá

Dashboard:
- clínicas ativas;
- gestantes totais;
- novas clínicas;
- receita recorrente cadastrada;
- utilização;
- clínicas suspensas;
- status.

Gestão de clínicas:
- nome;
- CNPJ, opcional;
- logo;
- cores;
- cidade;
- domínio;
- telefone;
- WhatsApp;
- Instagram;
- administrador;
- módulos;
- status;
- plano;
- valor mensal;
- data de renovação.

Botão:
**ATIVAR CLÍNICA**

O sistema deve criar automaticamente toda a estrutura daquele tenant.

---

## 21. Assinatura

Arquitetar o sistema para suportar:

- Implantação: R$ 2.497
- Manutenção: R$ 62/mês

Não precisa implementar cobrança automática inicialmente.

Criar campos administrativos:
- plano;
- valor;
- vencimento;
- pago;
- pendente;
- suspenso.

---

## 22. Campanha local

Criar área administrativa opcional:
**Lançamento Local**

A clínica poderá visualizar:
- textos sugeridos;
- modelos de anúncios;
- criativos;
- vídeos;
- roteiro;
- peças;
- landing page.

A verba de mídia é responsabilidade da clínica.

Não construir gerenciador de anúncios dentro do sistema.

---

## 23. Privacidade e segurança

Tratar dados relacionados à gravidez e saúde como dados sensíveis.

Implementar:
- autenticação segura;
- isolamento completo entre tenants;
- Row Level Security;
- controle de permissões;
- registro de consentimento;
- política de privacidade;
- termos;
- exportação de dados;
- exclusão de conta;
- logs administrativos importantes.

Nenhuma clínica pode acessar dados de outra clínica.

Nenhuma gestante pode acessar dados de outra gestante.

---

## 24. Stack sugerida

Preferência:
- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security

E-mail:
- Resend ou equivalente.

PDF:
- biblioteca moderna compatível com Next.js.

QR Code:
- biblioteca local ou serviço seguro.

Hospedagem:
- arquitetura compatível com Vercel inicialmente.

Não criar infraestrutura desnecessariamente complexa.

---

## 25. Design

O design deve ser premium e mobile-first.

A experiência da gestante deve parecer:
- humana;
- delicada;
- editorial;
- emocional;
- contemporânea.

Evitar:
- aparência hospitalar;
- dashboard empresarial na área da gestante;
- excesso de azul médico;
- tabelas desnecessárias;
- aparência de prontuário;
- excesso de ícones;
- excesso de informação.

Usar:
- bastante espaço;
- tipografia elegante;
- cards suaves;
- fotografias;
- formas orgânicas;
- transições discretas;
- animações leves.

O tema demonstrativo inicial pode utilizar:
- rosa queimado;
- blush;
- bege;
- creme;
- verde sálvia.

Mas todas as cores devem vir de tokens de tema configuráveis por clínica.

---

## 26. Responsividade

- Área da gestante: prioritariamente mobile.
- Painel da clínica: prioritariamente desktop, responsivo para tablet/celular.
- Superadmin: prioritariamente desktop.

---

## 27. Dados de demonstração

Criar clínica fictícia:

**Clínica Vida Plena**  
Cidade: Barueri/SP

Serviços:
- Obstetrícia
- Ultrassonografia
- Laboratório
- Nutrição
- Odontologia
- Psicologia

Criar gestante fictícia:

**Ana Carolina**  
Semana: 20

Adicionar dados fictícios suficientes para demonstrar todas as telas.

---

## 28. Páginas prioritárias

1. Landing page pública
2. Cadastro/login
3. Home da gestante
4. Semana da gestação
5. Minha Jornada
6. Memórias
7. Cartas para o bebê
8. Minha Clínica
9. Perfil
10. Dashboard da clínica
11. Gestantes
12. Cartas físicas
13. Materiais
14. Configurações da clínica
15. Superadmin
16. Cadastro de clínica

---

## 29. Ordem de execução

### Etapa 1
Arquitetura, banco, autenticação, multi-tenancy e sistema de temas.

### Etapa 2
Toda a experiência da gestante.

### Etapa 3
Painel da clínica.

### Etapa 4
Painel Jatobá.

### Etapa 5
PDF, cartas e materiais.

### Etapa 6
E-mails e automações.

### Etapa 7
Testes, responsividade, segurança e polimento.

Ao final de cada etapa:
- testar;
- corrigir erros;
- validar banco;
- validar permissões;
- validar mobile;
- não quebrar funcionalidades existentes.

---

## 30. Regra fundamental

Não tratar este projeto como protótipo descartável.

Construir código organizado, modular e pronto para evolução comercial.

Não inventar funcionalidades que não foram solicitadas.

Antes de adicionar complexidade, preservar:

**SIMPLES PARA A GESTANTE.**  
**ÚTIL PARA A CLÍNICA.**  
**ESCALÁVEL PARA A JATOBÁ.**

A Etapa 1 foi concluída. Continue apenas o incremento autorizado da Etapa 2, conforme seção 31.

Primeiro apresente brevemente a arquitetura técnica e a estrutura de banco que será criada.

Em seguida, implemente.

Não pare apenas em explicações.

## 31. Decisões oficiais e escopo aprovado — 19/09/2026

Esta atualização substitui a premissa de venda exclusivamente à clínica. As demais regras continuam vigentes.

### Modelo híbrido e entrada pública

- Acesso patrocinado por clínica/parceiro, gratuito para a gestante vinculada, e assinatura direta pela gestante.
- A entrada pública deverá oferecer “Começar minha Jornada” e “Tenho acesso por uma clínica/parceiro”.
- Link, QR Code ou código de parceiro deverão futuramente associar automaticamente a gestante à clínica correta. Não criar tenant fictício, atalho de permissões nem associação confiada a dados editáveis pelo cliente. Nesta rodada, preservar os links de clínica existentes e preparar apenas a composição visual; novo cadastro direto e resgate de código ficam futuros.
- Planos individuais configuráveis: mensal de referência R$ 19,90; campanha inicial de aproximadamente R$ 11/mês nos primeiros 3 meses; opções de 3, 6 e 9 meses; anual na faixa R$ 149–159. Preços são referências comerciais, não constantes de cobrança nem ofertas ativas. Gateway, cobrança e configuração administrativa dos planos não serão implementados agora. As referências comerciais B2B anteriores não são preços dos planos individuais.

### Claro e escuro

Cada tema de clínica possui tokens light/dark. Respeitar a preferência do sistema inicialmente e oferecer troca manual persistente, com opção de voltar ao sistema. Cores somente em tokens, nunca diretamente nos componentes. Manter contraste e identidade de cada clínica. Compatibilidade nesta rodada: tokens existentes do banco permanecem como light; um adaptador central deriva dark para cada paleta, sem migração ou alteração do editor de clínica. O contrato admite pares explícitos light/dark; edição e persistência independente de dark no banco exigirão rodada própria.

### Mapa Visual do Desenvolvimento do Bebê

- Arquitetura central para semanas 1–40, estágio atual destacado e futura navegação entre semanas.
- Conteúdo anatômico sob responsabilidade editorial da Jatobá, com fontes, estado de publicação e revisão profissional rastreáveis. Não inventar informações médicas nem apresentar revisão pendente como aprovada.
- Nesta rodada, somente componente visual de referência da Semana 20. Diferenciar semana ilustrada e semana gestacional real; não recalcular nem alterar a gestação para coincidir com a referência. Ilustração esquemática, sem escala, sem inferir anatomia individual ou simular ultrassom. Sem conteúdo disponível, informar isso explicitamente.

### Evolução conceitual, sem implementação nesta rodada

- Continuidade até aproximadamente 90 dias após o nascimento, com pós-parto e recém-nascido. Pausar/encerrar a jornada continua possível sem justificar o motivo.
- Acompanhante gratuito convidado pela gestante, experiência limitada, sem acesso automático a diário, cartas, fotos ou memórias privadas. Convite não equivale a autorização de leitura desses dados.
- Resumo Semanal: recorte do catálogo publicado, semana atual, desenvolvimento, cuidado educativo e convite pessoal opcional. Preparar conceito para entrega futura por e-mail/WhatsApp, preferencialmente aos domingos, com preferência de horário/fuso e canal a definir. Não incluir conteúdos privados em mensagens por padrão. Não criar disparadores, assinaturas de canal ou automações nesta rodada.
- Minha Jornada como diário/cápsula do tempo, com convites leves para pequenos registros pessoais, sempre opcionais.

### Roadmap reservado, não autorizado nesta rodada

Comunidade privada de gestantes inspirada em fórum/Reddit e com moderação; radar de notícias e pesquisas; indicação de outras gestantes; WhatsApp automatizado; pagamentos; campanhas de clínicas; experiência pós-parto de 90 dias; acompanhante; Resumo Semanal.

### Limite desta implementação

Somente: modo claro/escuro; acabamento da Home e Semana 20; referência visual do desenvolvimento fetal; arquitetura editorial 1–40; preparação visual das duas entradas públicas. Não avançar para Minha Jornada, Memórias, Cartas ou demais itens do roadmap. Preservar autenticação, RLS, multi-tenancy e fluxos aprovados.
