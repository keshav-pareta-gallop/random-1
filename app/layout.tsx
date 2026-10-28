import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acme Shop — Orders",
  description: "View your order history",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
