"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderSummary {
  id: string;
  placedAt: string;
  total: number;
  status: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load orders");
        const data = await res.json();
        setOrders(data.items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading orders…</p>;
  if (error) return <p>{error}</p>;
  if (orders.length === 0) return <p>No orders yet</p>;

  return (
    <div>
      <h1>Orders</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link href={`/orders/${order.id}`}>{order.id}</Link>
              </td>
              <td>{order.placedAt}</td>
              <td>${order.total.toFixed(2)}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
