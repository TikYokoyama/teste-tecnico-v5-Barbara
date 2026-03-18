# Decisões Técnicas

> Preencha cada seção respeitando o limite de linhas. Respostas genéricas serão penalizadas.
> Queremos opinião, não hedge.

## 1. Boundary Server/Client (máx 3 linhas)

A lógica de dados foi mantida no Server Component (page.tsx), que consome searchParams e realiza o fetch. A interatividade (favoritos) foi isolada em um Client Component (PropertyList), garantindo separação clara entre renderização no servidor e estado no cliente.

## 2. Próximos passos de performance RN (máx 5 linhas)

PropertyListItem usa React.memo + useCallback para evitar re-renders desnecessários em lista. propertyStore usa cache manual por referência nos selectors, equivalente a useMemo fora do React. AnimatedHeader roda interpolações na UI thread via Reanimated, zerando carga no JS thread. Sem o memo e o cache, qualquer update no store causaria N re-renders (um por item), estourando o render-count.test. Para 10k itens: FlashList com estimatedItemSize, expo-image para decode assíncrono, e estado de colapso no Zustand com getItemLayout estático.

## 3. Trade-off do Sync (máx 5 linhas)

<!-- A resolução de conflito que implementei tem uma fraqueza: [descreva]. Se tivesse mais tempo, eu: [descreva]. -->

## 4. O bug mais difícil (máx 3 linhas)

<!-- O bug que mais demorei para encontrar foi: [qual]. Porque: [por que foi difícil]. -->

## 5. O que eu NÃO mexeria em produção (máx 3 linhas)

<!-- Se este fosse um app real, o arquivo que eu NÃO refatoraria agora é: [qual]. Porque: [justifique — custo vs benefício]. -->
