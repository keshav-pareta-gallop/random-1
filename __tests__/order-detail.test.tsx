import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/* ---------- mocks ---------- */

const mockUseParams = vi.fn();

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
}));

import OrderDetailPage from "../app/orders/[id]/page";

beforeEach(() => {
  vi.restoreAllMocks();
  mockUseParams.mockReturnValue({ id: "order-001" });
});

describe("OrderDetailPage", () => {
  it("renders line items when fetch succeeds", async () => {
    const mockOrder = {
      id: "order-001",
      placedAt: "2024-01-15T10:00:00Z",
      total: 59.97,
      status: "completed",
      lines: [
        { sku: "WIDGET-1", name: "Blue Widget", qty: 2, price: 19.99 },
        { sku: "GADGET-3", name: "Red Gadget", qty: 1, price: 19.99 },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockOrder,
    } as Response);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Blue Widget")).toBeInTheDocument();
    });

    expect(screen.getByText("WIDGET-1")).toBeInTheDocument();
    expect(screen.getByText("Red Gadget")).toBeInTheDocument();
    expect(screen.getByText("GADGET-3")).toBeInTheDocument();
    expect(screen.getByText("Order order-001")).toBeInTheDocument();
  });

  it("renders 'Order not found' when fetch returns 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Order not found" }),
    } as Response);

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Order not found")).toBeInTheDocument();
    });
  });
});
