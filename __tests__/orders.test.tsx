import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OrdersPage from "../app/orders/page";

const sampleOrders = [
  {
    id: "ord-001",
    placedAt: "2024-10-15T09:30:00Z",
    total: 59.99,
    status: "delivered",
  },
  {
    id: "ord-002",
    placedAt: "2024-11-02T14:15:00Z",
    total: 124.5,
    status: "shipped",
  },
  {
    id: "ord-003",
    placedAt: "2024-11-20T18:45:00Z",
    total: 37.0,
    status: "processing",
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("OrdersPage", () => {
  it("renders all 3 orders with id, date, total, and status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: sampleOrders, total: 3 }),
    } as Response);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("ord-001")).toBeInTheDocument();
    });

    // Verify all order IDs are rendered
    expect(screen.getByText("ord-001")).toBeInTheDocument();
    expect(screen.getByText("ord-002")).toBeInTheDocument();
    expect(screen.getByText("ord-003")).toBeInTheDocument();

    // Verify dates
    expect(screen.getByText("2024-10-15T09:30:00Z")).toBeInTheDocument();
    expect(screen.getByText("2024-11-02T14:15:00Z")).toBeInTheDocument();
    expect(screen.getByText("2024-11-20T18:45:00Z")).toBeInTheDocument();

    // Verify totals
    expect(screen.getByText("$59.99")).toBeInTheDocument();
    expect(screen.getByText("$124.50")).toBeInTheDocument();
    expect(screen.getByText("$37.00")).toBeInTheDocument();

    // Verify statuses
    expect(screen.getByText("delivered")).toBeInTheDocument();
    expect(screen.getByText("shipped")).toBeInTheDocument();
    expect(screen.getByText("processing")).toBeInTheDocument();
  });

  it("shows 'No orders yet' when API returns empty items", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], total: 0 }),
    } as Response);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("No orders yet")).toBeInTheDocument();
    });
  });

  it("shows 'No orders yet' when fetch fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("No orders yet")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", () => {
    vi.spyOn(global, "fetch").mockReturnValueOnce(new Promise(() => {}));

    render(<OrdersPage />);

    expect(screen.getByText("Loading orders…")).toBeInTheDocument();
  });

  it("calls fetch with relative URL /api/orders", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: sampleOrders, total: 3 }),
    } as Response);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/orders");
    });
  });
});
