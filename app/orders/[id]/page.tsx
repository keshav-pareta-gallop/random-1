"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface OrderLine {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

interface OrderDetail {
  id: string;
  placedAt: string;
  total: number;
  status: string;
  lines: OrderLine[];
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load order");
        const data: OrderDetail = await res.json();
        setOrder(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p>Loading…</p>;
  if (notFound) return <p>Order not found</p>;
  if (!order) return null;

  return (
    <div>
      <h1>Order {order.id}</h1>
      <dl>
        <dt>Placed</dt>
        <dd>{order.placedAt}</dd>
        <dt>Status</dt>
        <dd>{order.status}</dd>
        <dt>Total</dt>
        <dd>${order.total.toFixed(2)}</dd>
      </dl>

      <h2>Items</h2>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.sku}>
              <td>{line.sku}</td>
              <td>{line.name}</td>
              <td>{line.qty}</td>
              <td>${line.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
