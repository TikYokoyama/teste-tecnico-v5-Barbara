# Decisões Técnicas

> Preencha cada seção respeitando o limite de linhas. Respostas genéricas serão penalizadas.
> Queremos opinião, não hedge.

## 1. Boundary Server/Client (máx 3 linhas)

A lógica de dados foi mantida no Server Component (page.tsx), que consome searchParams e realiza o fetch. A interatividade (favoritos) foi isolada em um Client Component (PropertyList), garantindo separação clara entre renderização no servidor e estado no cliente.

## 2. Próximos passos de performance RN (máx 5 linhas)

PropertyListItem usa React.memo + useCallback para evitar re-renders desnecessários em lista. propertyStore usa cache manual por referência nos selectors, equivalente a useMemo fora do React. AnimatedHeader roda interpolações na UI thread via Reanimated, zerando carga no JS thread. Sem o memo e o cache, qualquer update no store causaria N re-renders (um por item), estourando o render-count.test. Para 10k itens: FlashList com estimatedItemSize, expo-image para decode assíncrono, e estado de colapso no Zustand com getItemLayout estático.

## 3. Trade-off do Sync (máx 5 linhas)

A principal fraqueza é não persistir o estado de conflito para revisão posterior. Quando requiresReview é true, o campo é atualizado no store mas a informação de que aquele campo precisa de atenção humana se perde — não há fila de revisão, notificação nem UI para o corretor resolver o impasse. Se tivesse mais tempo, adicionaria uma estrutura de pendingReviews no store alimentada pelos conflitos com requiresReview=true, e exporia isso na tela do imóvel.

## 4. O bug mais difícil (máx 3 linhas)

O bug mais difícil foi no useOfflineQueue: o processQueue lia o estado da fila via closure stale — quando o executor terminava e tentava marcar a operação como DONE, o estado capturado já estava desatualizado. A solução foi espelhar o queue num ref atualizado a cada setState, garantindo leitura sempre fresca sem adicionar queue como dependência do useCallback.

## 5. O que eu NÃO mexeria em produção (máx 3 linhas)

Não refatoraria SyncConflictResolver.ts nem nenhuma lógica que depende de contrato com o backend (formato de conflito, campos de status, estrutura do payload). Regras como "status é controlado pelo backoffice" e "preço é definido pelo proprietário" existem por decisão de produto - refatorar sem alinhamento com back e negócio é introduzir bug silencioso em sincronização, que é o pior lugar para errar.
