import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RUE — Recursive Understanding Engine",
  description: "Explore any concept recursively until you truly understand it.",
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