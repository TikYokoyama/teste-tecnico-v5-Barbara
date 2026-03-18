// apps/mobile/__tests__/sync.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react-native";
import React from "react";
import { useOfflineQueue } from "../src/hooks/useOfflineQueue";
import type { QueuedOperation } from "../src/hooks/useOfflineQueue";

const makeOp = (
  overrides?: Partial<
    Omit<QueuedOperation, "id" | "createdAt" | "retryCount" | "status">
  >,
) => ({
  type: "UPDATE_STATUS" as const,
  entityId: "prop-1",
  payload: { status: "AVAILABLE" },
  ...overrides,
});

// Helper: monta o hook via render e expõe o resultado pelo ref
function setupHook<T>(hook: () => T) {
  const ref = { current: null as T };

  function TestComponent() {
    ref.current = hook();
    return null;
  }

  render(React.createElement(TestComponent));
  return ref;
}

describe("useOfflineQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("enfileira e processa operação com sucesso → status DONE", async () => {
    const executor = vi.fn().mockResolvedValue(undefined);
    const ref = setupHook(() => useOfflineQueue({ executor }));

    act(() => {
      ref.current!.enqueue(makeOp());
    });

    expect(ref.current!.pending).toHaveLength(1);

    let processPromise: Promise<unknown>;
    act(() => {
      processPromise = ref.current!.processQueue();
    });

    await act(async () => {
      await processPromise;
    });

    expect(executor).toHaveBeenCalledTimes(1);
    expect(ref.current!.pending).toHaveLength(0);
  });

  it("faz retry com backoff exponencial após falha do executor", async () => {
    const executor = vi
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValue(undefined);

    const ref = setupHook(() => useOfflineQueue({ executor, maxRetries: 5 }));

    act(() => {
      ref.current!.enqueue(makeOp());
    });

    let processPromise: Promise<unknown>;
    act(() => {
      processPromise = ref.current!.processQueue();
    });
    await act(async () => {
      await processPromise;
    });

    expect(executor).toHaveBeenCalledTimes(1);
    expect(ref.current!.pending).toHaveLength(1);

    act(() => {
      processPromise = ref.current!.processQueue();
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await processPromise;
    });

    expect(executor).toHaveBeenCalledTimes(2);
    expect(ref.current!.pending).toHaveLength(0);
  });

  it("não duplica operação com mesma entityId + type (idempotência)", () => {
    const executor = vi.fn().mockResolvedValue(undefined);
    const ref = setupHook(() => useOfflineQueue({ executor }));

    act(() => {
      ref.current!.enqueue(
        makeOp({ entityId: "prop-1", type: "UPDATE_STATUS" }),
      );
      ref.current!.enqueue(
        makeOp({ entityId: "prop-1", type: "UPDATE_STATUS" }),
      );
      ref.current!.enqueue(
        makeOp({ entityId: "prop-1", type: "UPDATE_STATUS" }),
      );
    });

    expect(ref.current!.pending).toHaveLength(1);
  });

  it("marca como FAILED após maxRetries tentativas", async () => {
    const executor = vi.fn().mockRejectedValue(new Error("always fails"));
    const maxRetries = 3;

    const ref = setupHook(() => useOfflineQueue({ executor, maxRetries }));

    act(() => {
      ref.current!.enqueue(makeOp());
    });

    for (let i = 0; i < maxRetries; i++) {
      let processPromise: Promise<unknown>;
      act(() => {
        processPromise = ref.current!.processQueue();
      });

      await act(async () => {
        vi.advanceTimersByTime(30_000);
        await processPromise;
      });
    }

    expect(executor).toHaveBeenCalledTimes(maxRetries);
    expect(ref.current!.pending).toHaveLength(0);
  });
});
