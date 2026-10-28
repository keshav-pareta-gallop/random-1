import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/* ---------- mocks ---------- */

// Mock next/link to render a plain <a>
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
}));

import OrdersPage from "../app/orders/page";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("OrdersPage", () => {
  it("renders order rows as links to /orders/<id>", async () => {
    const mockOrders = {
      items: [
        { id: "order-001", placedAt: "2024-01-15T10:00:00Z", total: 59.97, status: "completed" },
        { id: "order-002", placedAt: "2024-02-20T14:30:00Z", total: 149.99, status: "shipped" },
      ],
      total: 2,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockOrders,
    } as Response);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("order-001")).toBeInTheDocument();
    });

    const link1 = screen.getByText("order-001").closest("a");
    expect(link1).toHaveAttribute("href", "/orders/order-001");

    const link2 = screen.getByText("order-002").closest("a");
    expect(link2).toHaveAttribute("href", "/orders/order-002");
  });

  it("renders 'No orders yet' when items array is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [], total: 0 }),
    } as Response);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("No orders yet")).toBeInTheDocument();
    });
  });
});
