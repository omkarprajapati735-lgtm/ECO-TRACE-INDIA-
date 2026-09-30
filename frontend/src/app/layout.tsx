import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoTrace India — Verified E-Waste Recycling Platform",
  description:
    "India's first fully transparent doorstep e-waste collection platform. Fair pricing, instant digital payments, and CPCB-certified recycling — from your home to the refinery.",
  keywords: [
    "e-waste recycling",
    "EcoTrace India",
    "CPCB certified",
    "EPR compliance",
    "scrap collection",
    "doorstep pickup",
    "kabadiwala",
    "e-waste India",
  ],
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
