import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Acme Shop</h1>
      <nav>
        <Link href="/orders">Order History</Link>
      </nav>
    </main>
  );
}
