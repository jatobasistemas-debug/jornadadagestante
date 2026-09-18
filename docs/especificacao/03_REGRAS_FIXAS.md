# JORNADA DA GESTANTE — REGRAS FIXAS DO PROJETO

Este documento tem prioridade sobre decisões improvisadas durante o desenvolvimento.

## Produto

1. O sistema é multi-clínica.
2. Não criar uma instalação diferente para cada cliente.
3. Cada clínica possui identidade, equipe, gestantes e módulos próprios.
4. O produto não é prontuário médico.
5. O produto não deve assumir funções clínicas que não foram aprovadas.

## Gestante

6. A experiência da gestante deve ser mobile-first.
7. O cadastro inicial deve ser curto.
8. Não transformar a gravidez em uma lista de obrigações.
9. Memórias emocionais são opcionais.
10. Fotos, diário, cartas e memórias privadas pertencem à gestante.
11. A clínica não pode acessar automaticamente essas memórias.

## Clínica

12. A clínica vê dados operacionais necessários à Jornada.
13. A clínica só oferece serviços que realmente possui.
14. Os módulos devem ser configuráveis por cliente.
15. Na V1, agendamentos são links para canais ou sistemas externos.
16. Não criar agenda médica própria sem autorização.

## Conteúdo

17. Conteúdo médico/educativo central é controlado pela Jatobá.
18. A clínica não pode editar livremente conteúdos médicos centrais.
19. Nunca gerar diagnóstico individual.
20. Nunca afirmar que um sintoma é universal ou obrigatório.
21. Usar linguagem responsável, acolhedora e não alarmista.
22. Todo conteúdo clínico deve permitir revisão profissional.

## Comercial

23. Regra da marca: “Primeiro cuidar. Depois oferecer.”
24. Serviços devem aparecer de maneira contextual e discreta.
25. Evitar banners agressivos e linguagem de promoção excessiva.
26. A experiência nunca deve parecer um funil de vendas explícito.

## Marca e personalização

27. A logo oficial é “Jornada da Gestante”.
28. A marca deve aparecer junto à identidade da clínica.
29. Cada clínica pode ter cores próprias.
30. Todas as cores da interface devem vir de tokens de tema.
31. Não redesenhar o sistema manualmente para cada clínica.
32. Não alterar a logo oficial sem autorização.

## Visual

33. Evitar aparência hospitalar.
34. Evitar azul médico como padrão obrigatório.
35. Evitar excesso de cor-de-rosa, corações, barriga e clichês maternos.
36. Priorizar estética editorial, elegante, humana e calma.
37. Usar bastante espaço em branco.
38. Priorizar tipografia elegante e legível.
39. Fotografias devem parecer reais, naturais e acolhedoras.
40. Não infantilizar a gestante.

## Cartas e revista

41. Cartas físicas fazem parte da experiência.
42. O sistema deve gerar cartas prontas para impressão.
43. O Livro/Revista da Jornada deve existir em versão digital.
44. A versão física pode ser vendida ou incluída conforme plano.
45. Custos de impressão e frete devem ser parametrizáveis.
46. A revista deve poder ser produzida em gráfica profissional.

## Segurança

47. Dados relacionados à gravidez devem ser tratados como sensíveis.
48. Nenhuma clínica pode acessar dados de outra.
49. Nenhuma gestante pode acessar dados de outra.
50. Implementar autenticação, permissões e isolamento entre tenants.
51. Implementar consentimentos, termos, política de privacidade e exclusão de conta.

## Jatobá

52. O painel superadmin controla clínicas, planos, módulos e status.
53. O objetivo é permitir implantação rápida de novos clientes.
54. Não criar customização infinita.
55. Sempre preservar:
   - simples para a gestante;
   - útil para a clínica;
   - escalável para a Jatobá.

## Decisões comerciais atuais

56. Implantação de referência: R$ 2.497.
57. Manutenção de referência: R$ 62/mês.
58. WhatsApp automático não faz parte da V1.
59. Ads podem ser oferecidos separadamente.
60. Domínio oficial: jornadadagestante.online.