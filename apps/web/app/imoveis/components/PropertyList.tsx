"use client";

import { useState } from "react";
import { PropertyCard } from "./PropertyCard";

export function PropertyList({ properties }: any) {
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    const toggleFavorite = (id: string) => {
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {properties.map((prop: any) => (
                <PropertyCard
                    key={prop.id}
                    property={prop}
                    onFavorite={toggleFavorite}
                    isFavorited={favorites.has(prop.id)}
                />
            ))}
        </div>
    );
}