// packages/shared/__tests__/conflict-resolver.test.ts

import { describe, it, expect } from "vitest";
import { resolveConflict } from "../domain/SyncConflictResolver";
import type { Property } from "../domain/Property";

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "prop-1",
    slug: "apto-centro-1",
    title: "Apartamento Centro",
    description: "Ótimo apartamento no centro",
    neighborhood: "Centro",
    price: 50000000, // em centavos
    area: 80,
    bedrooms: 2,
    suites: 2,
    parkingSpots: 1,
    photos: ["https://example.com/photo1.jpg"],
    status: "available",
    notes: [],
    amenities: [],
    updatedAt: 1700000000000,
    updatedBy: "field_agent",
    ...overrides,
  };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("SyncConflictResolver", () => {
  it("Regra 1: apenas status mudou → SERVER_WINS", () => {
    const base = makeProperty({ status: "available" });
    const server = makeProperty({ status: "sold" });
    const local = makeProperty({ status: "available" });

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("SERVER_WINS");
    expect(result.resolved.status).toBe("sold");
    expect(result.requiresReview).toBe(false);
  });

  it("Regra 2: apenas notes mudaram no local → LOCAL_WINS", () => {
    const base = makeProperty({ notes: [] });
    const local = makeProperty({
      notes: ["Proprietário prefere visita às 14h"],
    });
    const server = makeProperty({ notes: [] });

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("LOCAL_WINS");
    expect(result.resolved.notes).toEqual([
      "Proprietário prefere visita às 14h",
    ]);
    expect(result.requiresReview).toBe(false);
  });

  it("Regra 2: apenas photos mudaram no local → LOCAL_WINS", () => {
    const base = makeProperty({ photos: ["foto1.jpg"] });
    const local = makeProperty({ photos: ["foto1.jpg", "foto2.jpg"] });
    const server = makeProperty({ photos: ["foto1.jpg"] });

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("LOCAL_WINS");
    expect(result.resolved.photos).toEqual(["foto1.jpg", "foto2.jpg"]);
    expect(result.requiresReview).toBe(false);
  });

  it("Regra 3: price mudou nos dois lados → SERVER_WINS", () => {
    const base = makeProperty({ price: 50000000 });
    const local = makeProperty({ price: 48000000 });
    const server = makeProperty({ price: 52000000 });

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("SERVER_WINS");
    expect(result.resolved.price).toBe(52000000);
    expect(result.requiresReview).toBe(false);
  });

  it("Regra 4: campos diferentes mudaram em cada lado → MERGED", () => {
    const base = makeProperty({ notes: [], suites: 2 });
    const local = makeProperty({ notes: ["Visita confirmada"], suites: 2 });
    const server = makeProperty({ notes: [], suites: 3 });

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("MERGED");
    expect(result.resolved.notes).toEqual(["Visita confirmada"]);
    expect(result.resolved.suites).toBe(3);
    expect(result.requiresReview).toBe(false);
    expect(result.conflictingFields).toHaveLength(0);
  });

  it("Regra 5: mesmo campo (não status/price) mudou nos dois → LOCAL_WINS + requiresReview", () => {
    const base = makeProperty({ title: "Apartamento Centro" });
    const local = makeProperty({ title: "Apto Centro Reformado" });
    const server = makeProperty({ title: "Apartamento Centro - Novo" });

    const result = resolveConflict(local, server, base);

    expect(result.strategy).toBe("LOCAL_WINS");
    expect(result.resolved.title).toBe("Apto Centro Reformado");
    expect(result.requiresReview).toBe(true);
    expect(result.conflictingFields).toContain("title");
  });
});
