"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const NEIGHBORHOODS = [
  "Jardins",
  "Itaim Bibi",
  "Vila Nova Conceição",
  "Moema",
  "Pinheiros",
  "Brooklin",
];

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState("");

  // 🔁 URL → estado (source of truth)
  const selectedNeighborhoods = useMemo(
    () => searchParams.get("neighborhood")?.split(",") ?? [],
    [searchParams]
  );

  function getSafeNumber(value: string | null) {
    if (!value) return "";
    return isNaN(Number(value)) ? "" : value;
  }

  const priceMin = getSafeNumber(searchParams.get("priceMin"));
  const priceMax = getSafeNumber(searchParams.get("priceMax"));
  const suitesMin = searchParams.get("suitesMin") ?? "";
  const areaMin = getSafeNumber(searchParams.get("areaMin"));

  // ✅ estado local sincronizado com URL
  const [localMin, setLocalMin] = useState(priceMin);
  const [localMax, setLocalMax] = useState(priceMax);

  useEffect(() => {
    setLocalMin(priceMin);
    setLocalMax(priceMax);
  }, [priceMin, priceMax]);

  function updateParams(newParams: Record<string, string | string[] | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else {
        params.set(key, Array.isArray(value) ? value.join(",") : value);
      }
    });

    const query = params.toString();
    router.push(query ? `/imoveis?${query}` : "/imoveis");
  }

  // 🏷️ bairro (multi-select)
  function toggleNeighborhood(n: string) {
    const next = selectedNeighborhoods.includes(n)
      ? selectedNeighborhoods.filter((item) => item !== n)
      : [...selectedNeighborhoods, n];

    updateParams({ neighborhood: next });
  }

  // 💰 preço
  function handlePrice(min: string, max: string) {
    if (min && max && Number(min) > Number(max)) {
      setError("Preço mínimo não pode ser maior que o máximo");
      return;
    }

    setError("");

    updateParams({
      priceMin: min || undefined,
      priceMax: max || undefined,
    });
  }

  // 🛏️ suítes
  function handleSuites(value: string) {
    updateParams({ suitesMin: value || undefined });
  }

  // 📐 área
  function handleArea(value: string) {
    updateParams({ areaMin: value || undefined });
  }

  function clearFilters() {
    router.push("/imoveis");
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h3>Filtros</h3>

      {/* Bairro */}
      <div>
        <p>Bairros:</p>
        {NEIGHBORHOODS.map((n) => (
          <label key={n} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={selectedNeighborhoods.includes(n)}
              onChange={() => toggleNeighborhood(n)}
            />
            {n}
          </label>
        ))}
      </div>

      {/* Preço */}
      <div>
        <p>Preço:</p>
        <input
          placeholder="Preço mínimo"
          value={localMin}
          onChange={(e) => {
            const value = e.target.value;
            setLocalMin(value);
            handlePrice(value, localMax);
          }}
        />

        <input
          placeholder="Preço máximo"
          value={localMax}
          onChange={(e) => {
            const value = e.target.value;
            setLocalMax(value);
            handlePrice(localMin, value);
          }}
        />
      </div>

      {/* Suítes */}
      <div>
        <p>Suítes:</p>
        <select value={suitesMin} onChange={(e) => handleSuites(e.target.value)}>
          <option value="">Qualquer</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
          <option value="5">5+</option>
        </select>
      </div>

      {/* Área */}
      <div>
        <p>Área mínima:</p>
        <input
          placeholder="m²"
          value={areaMin}
          onChange={(e) => handleArea(e.target.value)}
        />
      </div>

      {/* Erro */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Limpar */}
      <button onClick={clearFilters}>Limpar filtros</button>
    </div>
  );
}