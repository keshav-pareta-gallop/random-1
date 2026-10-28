"use client";

import { useEffect, useState } from "react";

interface Order {
  id: string;
  placedAt: string;
  total: number;
  status: string;
}

interface OrdersResponse {
  items: Order[];
  total: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch orders: ${res.status}`);
        }
        return res.json() as Promise<OrdersResponse>;
      })
      .then((data) => {
        setOrders(data.items);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main>
        <h1>Order History</h1>
        <p>Loading orders…</p>
      </main>
    );
  }

  if (error || orders.length === 0) {
    return (
      <main>
        <h1>Order History</h1>
        <p>No orders yet</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Order History</h1>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} data-testid={`order-${order.id}`}>
              <td>{order.id}</td>
              <td>{order.placedAt}</td>
              <td>${order.total.toFixed(2)}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
