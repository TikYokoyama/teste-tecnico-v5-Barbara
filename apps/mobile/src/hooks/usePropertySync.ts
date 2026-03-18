// apps/mobile/src/hooks/usePropertySync.ts

import { useCallback, useEffect, useRef } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { usePropertyStore } from "../stores/propertyStore";
import { useOfflineQueue } from "./useOfflineQueue";
import { syncOperation } from "@repo/web/lib/api";
import { resolveConflict } from "@repo/shared/domain/SyncConflictResolver";
import type { QueuedOperation } from "./useOfflineQueue";

/**
 * Hook que orquestra a sincronização de propriedades.
 *
 * Responsabilidades:
 * 1. Escuta mudanças de conectividade (NetInfo)
 * 2. Quando online, processa a fila de operações offline
 * 3. Quando server retorna conflito, usa SyncConflictResolver para resolver
 * 4. Atualiza o store local com o resultado da resolução
 *
 * CANDIDATO: Este hook é um "bonus" — se você implementou useOfflineQueue
 * e SyncConflictResolver corretamente, este hook é a cola entre eles.
 * Não é obrigatório implementá-lo completamente, mas ajuda na avaliação.
 */
export function usePropertySync() {
  const updateProperty = usePropertyStore((s) => s.updateProperty);
  const markSynced = usePropertyStore((s) => s.markSynced);

  // Ref para evitar múltiplos processamentos simultâneos por eventos de rede
  const isSyncingRef = useRef(false);

  const { enqueue, processQueue, pending, processing } = useOfflineQueue({
    executor: async (op: QueuedOperation) => {
      const result = await syncOperation({
        type: op.type,
        entityId: op.entityId,
        payload: op.payload,
      });

      if (result.success) {
        // Sync bem-sucedido, nada a fazer além do que o useOfflineQueue já controla
        return;
      }

      if (!result.success && result.serverVersion) {
        // Conflito detectado: server retornou uma versão diferente da local
        const localProperty =
          usePropertyStore.getState().properties[op.entityId];

        if (localProperty && result.serverVersion) {
          const resolved = resolveConflict(
            localProperty,
            result.serverVersion,
            localProperty, // fallback: sem base conhecida, usa local como ancestra
          );

          // Aplica o resultado da resolução no store local
          updateProperty(op.entityId, resolved.resolved);

          // Conflito resolvido localmente — não lança erro, considera como sucesso
          return;
        }
      }

      // Falha sem conflito (erro de rede, servidor indisponível, etc.)
      // Lança erro para o useOfflineQueue aplicar backoff e retry
      throw new Error(result.error ?? "Sync failed");
    },
  });

  const syncWhenOnline = useCallback(async () => {
    if (isSyncingRef.current || pending.length === 0) return;

    isSyncingRef.current = true;
    try {
      await processQueue();
      markSynced();
    } finally {
      isSyncingRef.current = false;
    }
  }, [pending.length, processQueue, markSynced]);

  useEffect(() => {
    // Listener de conectividade — dispara sync sempre que voltar online
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = state.isConnected && state.isInternetReachable;
      if (isOnline) {
        syncWhenOnline();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [syncWhenOnline]);

  // Tenta sincronizar na montagem também, caso já esteja online
  useEffect(() => {
    NetInfo.fetch().then((state: NetInfoState) => {
      const isOnline = state.isConnected && state.isInternetReachable;
      if (isOnline) {
        syncWhenOnline();
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    enqueue,
    processQueue,
    pending,
    processing,
  };
}
