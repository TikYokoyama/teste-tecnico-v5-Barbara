# Decisões Técnicas

> Preencha cada seção respeitando o limite de linhas. Respostas genéricas serão penalizadas.
> Queremos opinião, não hedge.

## 1. Boundary Server/Client (máx 3 linhas)

A boundary foi definida separando buscade dados e interatividade.
A busca de imóveis (fetchProperties) fica no Server Component para SSR e melhor performance.
Elementos interativos ficam no Client Component por dependerem de estado e ações do usuário.

## 2. Próximos passos de performance RN (máx 5 linhas)

<!-- Se este app tivesse 10.000 itens com imagens, vídeos inline e seções colapsáveis, quais seriam suas 3 primeiras ações para garantir 60fps? NÃO repita o que já fez (memo, selector, Reanimated). Queremos o PRÓXIMO nível. -->

## 3. Trade-off do Sync (máx 5 linhas)

<!-- A resolução de conflito que implementei tem uma fraqueza: [descreva]. Se tivesse mais tempo, eu: [descreva]. -->

## 4. O bug mais difícil (máx 3 linhas)

<!-- O bug que mais demorei para encontrar foi: [qual]. Porque: [por que foi difícil]. -->

## 5. O que eu NÃO mexeria em produção (máx 3 linhas)

<!-- Se este fosse um app real, o arquivo que eu NÃO refatoraria agora é: [qual]. Porque: [justifique — custo vs benefício]. -->
