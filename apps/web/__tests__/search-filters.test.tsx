// apps/web/__tests__/search-filters.test.tsx

/**
 * CANDIDATO: Implemente SearchFilters.tsx E estes testes.
 * Mínimo 5 testes:
 *
 * 1. Filtro de bairro aplica nos searchParams
 * 2. Faixa de preço com min > max mostra erro de validação
 * 3. Limpar filtros reseta URL
 * 4. Filtros restaurados a partir de URL com query strings
 * 5. Seu edge case (documente por quê)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchFilters } from "../app/imoveis/components/SearchFilters";
import * as navigation from "next/navigation";

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}));

describe("SearchFilters", () => {
    const pushMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        (navigation.useRouter as any).mockReturnValue({
            push: pushMock,
        });

        (navigation.useSearchParams as any).mockReturnValue(
            new URLSearchParams()
        );
    });

    it("aplica filtro de bairro nos searchParams", () => {
        render(<SearchFilters />);

        const checkbox = screen.getByLabelText("Moema");
        fireEvent.click(checkbox);

        expect(pushMock).toHaveBeenCalled();
        expect(pushMock.mock.calls[0][0]).toContain("neighborhood=Moema");
    });

    it("mostra erro quando preço mínimo > máximo", () => {
        render(<SearchFilters />);

        fireEvent.change(screen.getByPlaceholderText("Preço mínimo"), {
            target: { value: "500000" },
        });

        fireEvent.change(screen.getByPlaceholderText("Preço máximo"), {
            target: { value: "100000" },
        });

        expect(
            screen.getByText(/mínimo não pode ser maior/i)
        ).not.toBeNull();
    });

    it("limpar filtros reseta URL", () => {
        render(<SearchFilters />);

        const button = screen.getByText("Limpar filtros");
        fireEvent.click(button);

        expect(pushMock).toHaveBeenCalledWith("/imoveis");
    });

    it("restaura filtros a partir da URL", () => {
        (navigation.useSearchParams as any).mockReturnValue(
            new URLSearchParams("neighborhood=Moema")
        );

        render(<SearchFilters />);

        const checkbox = screen.getByLabelText("Moema") as HTMLInputElement;

        expect(checkbox.checked).toBe(true);
    });

    it("[EDGE] ignora valores inválidos na URL", () => {
        (navigation.useSearchParams as any).mockReturnValue(
            new URLSearchParams("price_min=abc")
        );

        render(<SearchFilters />);

        const input = screen.getByPlaceholderText(
            "Preço mínimo"
        ) as HTMLInputElement;

        expect(input.value).toBe("");
    });
});