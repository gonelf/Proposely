import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proposely — Proposal Builder",
  description: "Create and download professional proposals as PDF",
};

import { Providers } from "./components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
