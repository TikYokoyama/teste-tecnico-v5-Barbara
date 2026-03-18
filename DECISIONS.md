# Decisões Técnicas

> Preencha cada seção respeitando o limite de linhas. Respostas genéricas serão penalizadas.
> Queremos opinião, não hedge.

## 1. Boundary Server/Client (máx 3 linhas)

A lógica de dados foi mantida no Server Component (page.tsx), que consome searchParams e realiza o fetch. A interatividade (favoritos) foi isolada em um Client Component (PropertyList), garantindo separação clara entre renderização no servidor e estado no cliente.

## 2. Próximos passos de performance RN (máx 5 linhas)

<!-- Se este app tivesse 10.000 itens com imagens, vídeos inline e seções colapsáveis, quais seriam suas 3 primeiras ações para garantir 60fps? NÃO repita o que já fez (memo, selector, Reanimated). Queremos o PRÓXIMO nível. -->

## 3. Trade-off do Sync (máx 5 linhas)

<!-- A resolução de conflito que implementei tem uma fraqueza: [descreva]. Se tivesse mais tempo, eu: [descreva]. -->

## 4. O bug mais difícil (máx 3 linhas)

<!-- O bug que mais demorei para encontrar foi: [qual]. Porque: [por que foi difícil]. -->

## 5. O que eu NÃO mexeria em produção (máx 3 linhas)

<!-- Se este fosse um app real, o arquivo que eu NÃO refatoraria agora é: [qual]. Porque: [justifique — custo vs benefício]. -->
