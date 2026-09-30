"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Search } from "lucide-react";

const allRates = [
  { code: "PCB_HIGH_GRADE", name: "High-Grade Telecom/Server PCBs", rate: 850, min: 400, max: 600, trend: "up", change: "+4.2%" },
  { code: "PCB_LOW_GRADE", name: "Low-Grade Consumer PCBs", rate: 320, min: 90, max: 160, trend: "up", change: "+2.1%" },
  { code: "LITHIUM_BATTERY", name: "Lithium-Ion Battery Packs", rate: 420, min: 80, max: 150, trend: "up", change: "+1.8%" },
  { code: "DISPLAY_UNIT", name: "LCD / LED Monitors & TVs", rate: 120, min: 20, max: 50, trend: "down", change: "-1.2%" },
  { code: "MIXED_APPLIANCE", name: "Mixed Small Domestic Appliances", rate: 45, min: 15, max: 40, trend: "stable", change: "Stable" },
  { code: "PLASTIC_CASING", name: "Electronics Plastics", rate: 22, min: 8, max: 22, trend: "stable", change: "Stable" },
  { code: "METALS", name: "Copper Coils & Aluminium", rate: 680, min: 220, max: 350, trend: "down", change: "-0.9%" },
  { code: "OTHER_E_WASTE", name: "Cables, Adapters & Misc.", rate: 55, min: 25, max: 60, trend: "up", change: "+3.0%" },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <div className="nav-top">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: "var(--color-text-primary)", display: "flex" }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>All Scrap Rates</h1>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24 }}>
          Current per-kg rates for e-waste categories. Rates are updated based on market conditions and verified by our pricing team.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {allRates.map((item) => (
            <div key={item.code} className="card card-compact" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "monospace" }}>{item.code}</div>
              </div>
              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>₹{item.rate}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-secondary)" }}>/kg</span></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 60 }}>
                  {item.trend === "up" && <TrendingUp size={18} color="var(--color-success)" />}
                  {item.trend === "down" && <TrendingDown size={18} color="var(--color-error)" />}
                  {item.trend === "stable" && <Minus size={18} color="var(--color-text-muted)" />}
                  <span style={{ fontSize: 11, fontWeight: 500, color: item.trend === "up" ? "var(--color-success)" : item.trend === "down" ? "var(--color-error)" : "var(--color-text-muted)" }}>
                    {item.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
