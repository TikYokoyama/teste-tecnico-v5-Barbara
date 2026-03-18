// packages/shared/domain/SyncConflictResolver.ts

import type { Property } from "./Property";

export type ConflictStrategy = "LOCAL_WINS" | "SERVER_WINS" | "MERGED";

export interface ConflictResult {
  resolved: Property;
  strategy: ConflictStrategy;
  requiresReview: boolean;
  /** Campos que foram modificados em ambos os lados */
  conflictingFields: string[];
}

/**
 * Detecta quais campos mudaram entre duas versões de uma Property.
 * Retorna array de nomes de campos que diferem.
 */
export function getChangedFields(a: Property, b: Property): (keyof Property)[] {
  return (Object.keys(a) as (keyof Property)[]).filter((key) => {
    const aVal = a[key];
    const bVal = b[key];

    // Comparação profunda para arrays (photos, por exemplo)
    if (Array.isArray(aVal) && Array.isArray(bVal)) {
      return JSON.stringify(aVal) !== JSON.stringify(bVal);
    }

    return aVal !== bVal;
  });
}

/**
 * Resolve conflitos de sincronização entre versão local e do servidor.
 *
 * Regras de negócio:
 * 1. Se apenas `status` mudou → SERVER_WINS
 * 2. Se apenas `notes` ou `photos` mudaram → LOCAL_WINS
 * 3. Se `price` mudou nos dois lados → SERVER_WINS
 * 4. Se campos DIFERENTES mudaram em cada lado → MERGED
 * 5. Se mesmo campo (exceto status/price) mudou nos dois → LOCAL_WINS + requiresReview=true
 */
export function resolveConflict(
  local: Property,
  server: Property,
  base: Property,
): ConflictResult {
  const localChanged = new Set(getChangedFields(base, local));
  const serverChanged = new Set(getChangedFields(base, server));

  // Campos que mudaram nos dois lados simultaneamente
  const conflictingFields = [...localChanged].filter((f) =>
    serverChanged.has(f),
  );

  // ── Regra 1: Apenas status mudou (em qualquer lado) ──────────────────────
  // Backoffice tem autoridade sobre status
  if (
    (localChanged.size === 1 && localChanged.has("status")) ||
    (serverChanged.size === 1 &&
      serverChanged.has("status") &&
      localChanged.size === 0)
  ) {
    return {
      resolved: server,
      strategy: "SERVER_WINS",
      requiresReview: false,
      conflictingFields: conflictingFields as string[],
    };
  }

  // ── Regra 2: Apenas notes ou photos mudaram (somente local) ──────────────
  // Corretor em campo tem autoridade sobre anotações e fotos
  const localOnlyNotesOrPhotos =
    localChanged.size > 0 &&
    [...localChanged].every((f) => f === "notes" || f === "photos") &&
    conflictingFields.length === 0 &&
    serverChanged.size === 0;

  if (localOnlyNotesOrPhotos) {
    return {
      resolved: local,
      strategy: "LOCAL_WINS",
      requiresReview: false,
      conflictingFields: [],
    };
  }

  // ── Regra 3: price mudou nos dois lados ──────────────────────────────────
  // Proprietário define preço — server sempre vence em preço
  if (localChanged.has("price") && serverChanged.has("price")) {
    return {
      resolved: server,
      strategy: "SERVER_WINS",
      requiresReview: false,
      conflictingFields: conflictingFields as string[],
    };
  }

  // ── Regra 4: Campos DIFERENTES mudaram em cada lado → MERGED ─────────────
  if (
    conflictingFields.length === 0 &&
    (localChanged.size > 0 || serverChanged.size > 0)
  ) {
    // Aplica mudanças do server como base, sobrepõe com mudanças locais
    const merged: Property = { ...server };
    for (const field of localChanged) {
      (merged as unknown as Record<string, unknown>)[field as string] = local[
        field
      ] as unknown;
    }

    return {
      resolved: merged,
      strategy: "MERGED",
      requiresReview: false,
      conflictingFields: [],
    };
  }

  // ── Regra 5: Mesmo campo (exceto status/price) mudou nos dois lados ──────
  // Local vence mas precisa de revisão manual
  const trueConflicts = conflictingFields.filter(
    (f) => f !== "status" && f !== "price",
  );

  if (trueConflicts.length > 0) {
    return {
      resolved: local,
      strategy: "LOCAL_WINS",
      requiresReview: true,
      conflictingFields: trueConflicts,
    };
  }

  // ── Fallback: nenhuma mudança detectada ──────────────────────────────────
  return {
    resolved: server,
    strategy: "SERVER_WINS",
    requiresReview: false,
    conflictingFields: [],
  };
}

export const resolver = {
  resolve: resolveConflict,
};
