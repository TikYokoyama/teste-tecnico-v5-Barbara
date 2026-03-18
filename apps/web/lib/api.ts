// apps/web/lib/api.ts

import type { Property, PropertySummary } from "@repo/shared/domain/Property";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.imoveis.example.com";

/**
 * Busca lista de imóveis com filtros.
 *
 * ⚠️ BUG 1: Não passa Content-Type header no POST de filtros complexos
 *        -> RESOLVIDO: Removido uso de POST — agora utiliza apenas GET com query params
 * ⚠️ BUG 2: Não trata response.ok — erros 4xx/5xx não lançam exceção.
 *        -> RESOLVIDO: Tratamento de erros com response.ok implementado
 */
export async function fetchProperties(filters?: {
  neighborhoods?: string[];
  priceMin?: number;
  priceMax?: number;
  suitesMin?: number;
  areaMin?: number;
}): Promise<PropertySummary[]> {
  const params = new URLSearchParams();

  if (filters?.neighborhoods?.length) {
    params.set("neighborhood", filters.neighborhoods.join(","));
  }
  if (filters?.priceMin) params.set("price_min", String(filters.priceMin));
  if (filters?.priceMax) params.set("price_max", String(filters.priceMax));
  if (filters?.suitesMin) params.set("suites_min", String(filters.suitesMin));
  if (filters?.areaMin) params.set("area_min", String(filters.areaMin));

  const res = await fetch(`${API_BASE}/properties?${params.toString()}`);

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`API error: ${res.status} - ${message}`);
  }

  return res.json();
}

/**
 * Busca imóvel individual por slug.
 *
 * ⚠️ A API legada retorna price em centavos para imóveis < 5M,
 * mas em REAIS para imóveis >= 5M. O campo priceInReais indica qual formato.
 * Este comportamento é intencional da API (migração incompleta do backend).
 */
export async function fetchPropertyBySlug(slug: string): Promise<Property | null> {
  const res = await fetch(`${API_BASE}/properties/${slug}`);

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  return res.json();
}

/**
 * Envia operação de sync (usado pelo mobile via shared).
 */
export async function syncOperation(operation: {
  type: string;
  entityId: string;
  payload: unknown;
}): Promise<{ success: boolean; serverVersion?: Property; error?: string }> {
  const res = await fetch(`${API_BASE}/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(operation),
  });

  if (!res.ok) {
    const error = await res.text();
    return { success: false, error };
  }

  return res.json();
}
