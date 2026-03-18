// apps/web/app/imoveis/page.tsx
// ⚠️ MÓDULO 2A: Refatore para Server Component -> RESOLVIDO 
// "use client";

import { fetchProperties } from "@/lib/api";
import { SearchFilters } from "./components/SearchFilters";
import { PropertyList } from "./components/PropertyList";

type Props = {
  searchParams: {
    neighborhoods?: string[];
    priceMin?: number;
    priceMax?: number;
    suitesMin?: number;
    areaMin?: number;
  };
};

export default async function ImoveisPage({ searchParams }: Props) {
  const properties = await fetchProperties(searchParams);

  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>
        Imóveis
      </h1>

      <SearchFilters />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        <PropertyList properties={properties} />
      </div>
    </div>
  );
}
