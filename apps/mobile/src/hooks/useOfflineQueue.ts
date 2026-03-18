// apps/mobile/src/hooks/useOfflineQueue.ts

import { useState, useCallback, useRef } from "react";

export interface QueuedOperation {
  id: string;
  type: "UPDATE_STATUS" | "ADD_NOTE" | "ADD_PHOTO";
  entityId: string;
  payload: unknown;
  createdAt: number;
  retryCount: number;
  status: "PENDING" | "PROCESSING" | "FAILED" | "DONE";
}

export interface ProcessResult {
  processed: number;
  failed: number;
  skipped: number;
}

interface UseOfflineQueueOptions {
  /** Função que executa a operação remota. Deve lançar erro se falhar. */
  executor: (op: QueuedOperation) => Promise<void>;
  /** Máximo de tentativas antes de marcar como FAILED (default: 5) */
  maxRetries?: number;
}

/**
 * Hook para gerenciar fila de operações offline.
 *
 * CANDIDATO: Implemente este hook seguindo os requisitos:
 *
 * - enqueue: Adiciona operação com status PENDING. Gera id único (uuid ou timestamp).
 *   Se já existe operação PENDING com mesma entityId + type, NÃO duplica (idempotência).
 *
 * - processQueue: Processa operações PENDING em ordem FIFO (createdAt crescente).
 *   Para cada operação:
 *     1. Marca como PROCESSING
 *     2. Chama executor(op)
 *     3. Se sucesso → marca como DONE
 *     4. Se falha → incrementa retryCount, volta para PENDING
 *     5. Se retryCount >= maxRetries → marca como FAILED
 *   Retry com backoff exponencial: delay = 1000 * 2^retryCount (1s, 2s, 4s, 8s, 16s)
 *   Se processQueue é chamado enquanto já está processando → retorna sem fazer nada.
 *
 * - pending: Array de operações com status PENDING ou PROCESSING
 *
 * - processing: boolean indicando se está processando a fila
 */

interface UseOfflineQueueOptions {
  executor: (op: QueuedOperation) => Promise<void>;
  maxRetries?: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useOfflineQueue({
  executor,
  maxRetries = 5,
}: UseOfflineQueueOptions) {
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [processing, setProcessing] = useState(false);

  // Ref para acessar o estado atual dentro do processQueue sem dependências stale
  const queueRef = useRef<QueuedOperation[]>([]);
  const processingRef = useRef(false);

  const updateQueue = useCallback(
    (updater: (prev: QueuedOperation[]) => QueuedOperation[]) => {
      setQueue((prev) => {
        const next = updater(prev);
        queueRef.current = next;
        return next;
      });
    },
    [],
  );

  const enqueue = useCallback(
    (
      op: Omit<QueuedOperation, "id" | "createdAt" | "retryCount" | "status">,
    ) => {
      updateQueue((prev) => {
        // Idempotência: não duplica se já existe PENDING com mesma entityId + type
        const alreadyPending = prev.some(
          (item) =>
            item.entityId === op.entityId &&
            item.type === op.type &&
            item.status === "PENDING",
        );

        if (alreadyPending) return prev;

        const newOp: QueuedOperation = {
          ...op,
          id: generateId(),
          createdAt: Date.now(),
          retryCount: 0,
          status: "PENDING",
        };

        return [...prev, newOp];
      });
    },
    [updateQueue],
  );

  const processQueue = useCallback(async (): Promise<ProcessResult> => {
    // Guard: não processa se já está processando
    if (processingRef.current) {
      return { processed: 0, failed: 0, skipped: 0 };
    }

    processingRef.current = true;
    setProcessing(true);

    const result: ProcessResult = { processed: 0, failed: 0, skipped: 0 };

    // Pega snapshot das operações PENDING em ordem FIFO
    const pending = queueRef.current
      .filter((op) => op.status === "PENDING")
      .sort((a, b) => a.createdAt - b.createdAt);

    for (const op of pending) {
      // Marca como PROCESSING
      updateQueue((prev) =>
        prev.map((item) =>
          item.id === op.id ? { ...item, status: "PROCESSING" } : item,
        ),
      );

      // Backoff exponencial: 1s, 2s, 4s, 8s, 16s
      if (op.retryCount > 0) {
        await sleep(1000 * Math.pow(2, op.retryCount - 1));
      }

      try {
        await executor({ ...op, status: "PROCESSING" });

        // Sucesso → DONE
        updateQueue((prev) =>
          prev.map((item) =>
            item.id === op.id ? { ...item, status: "DONE" } : item,
          ),
        );

        result.processed++;
      } catch {
        const nextRetryCount = op.retryCount + 1;

        if (nextRetryCount >= maxRetries) {
          // Esgotou tentativas → FAILED
          updateQueue((prev) =>
            prev.map((item) =>
              item.id === op.id
                ? { ...item, status: "FAILED", retryCount: nextRetryCount }
                : item,
            ),
          );

          result.failed++;
        } else {
          // Volta pra PENDING com retryCount incrementado
          updateQueue((prev) =>
            prev.map((item) =>
              item.id === op.id
                ? { ...item, status: "PENDING", retryCount: nextRetryCount }
                : item,
            ),
          );

          result.skipped++;
        }
      }
    }

    processingRef.current = false;
    setProcessing(false);

    return result;
  }, [executor, maxRetries, updateQueue]);

  const pending = queue.filter(
    (op) => op.status === "PENDING" || op.status === "PROCESSING",
  );

  return {
    enqueue,
    processQueue,
    pending,
    processing,
  };
}
