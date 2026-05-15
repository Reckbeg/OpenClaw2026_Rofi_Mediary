import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mediary",
  description: "AI workplace diplomat for workload sustainability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
