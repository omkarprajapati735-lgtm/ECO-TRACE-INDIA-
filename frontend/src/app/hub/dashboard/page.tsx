"use client";

import Link from "next/link";
import { Package, Scale, Truck, Bell, Leaf, AlertTriangle, Boxes } from "lucide-react";

export default function HubDashboard() {
  const stats = [
    { label: "Inbound Today", value: "12", icon: Package, color: "var(--color-secondary)" },
    { label: "In Stock", value: "1,840 kg", icon: Boxes, color: "var(--color-primary)" },
    { label: "Dispatched", value: "3 batches", icon: Truck, color: "var(--color-sealed)" },
    { label: "Discrepancies", value: "1", icon: AlertTriangle, color: "var(--color-error)" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <div className="nav-top" style={{ maxWidth: "100%", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Leaf size={20} color="var(--color-primary)" />
          <span style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: 16 }}>Hub Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Bell size={20} color="var(--color-text-secondary)" />
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-secondary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "var(--color-secondary)" }}>AV</div>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Welcome, Anil — Gurugram Sector 18 Hub</h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {stats.map((s) => (
            <div key={s.label} className="metric-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div className="metric-label" style={{ marginTop: 8 }}>{s.label}</div>
              <div className="metric-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Link href="/hub/intake" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", textAlign: "center", padding: 32 }}>
              <Scale size={32} color="var(--color-primary)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Collector Intake & Verification</h3>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Scan QR, verify scale, reconcile weights</p>
            </div>
          </Link>
          <Link href="/hub/batches/new" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", textAlign: "center", padding: 32 }}>
              <Package size={32} color="var(--color-sealed)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Create Batch & Dispatch</h3>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Consolidate inventory, seal & generate QR manifest</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
