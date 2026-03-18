// apps/web/app/imoveis/page.tsx
// ⚠️ MÓDULO 2A: Refatore para Server Component -> RESOLVIDO 
"use client";

import { useState } from "react";
import { PropertyCard } from "./components/PropertyCard";
import { fetchProperties } from "@/lib/api";
import { SearchFilters } from "./components/SearchFilters";

type Props = {
  searchParams: {
    priceMin?: string;
    priceMax?: string;
    suitesMin?: string;
    areaMin?: string;
    neighborhood?: string;
  };
};

export default async function ImoveisPage({ searchParams }: Props) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const properties = await fetchProperties();

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>
        Imóveis
      </h1>

      {/* <SearchFilters /> */}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {properties.map((prop) => (
          <PropertyCard
            key={prop.id}
            property={prop}
            onFavorite={toggleFavorite}
            isFavorited={favorites.has(prop.id)}
          />
        ))}
      </div>
    </div>
  );
}
