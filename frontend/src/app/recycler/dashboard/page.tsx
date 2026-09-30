"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, Bell, Recycle, Factory, FileCheck, Shield, AlertTriangle, Check, Download } from "lucide-react";

export default function RecyclerDashboard() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <div className="nav-top" style={{ maxWidth: "100%", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Leaf size={20} color="var(--color-primary)" />
          <span style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: 16 }}>Recycler Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Bell size={20} color="var(--color-text-secondary)" />
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-sealed-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "var(--color-sealed)" }}>SR</div>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>EcoTech Metallurgical Solutions</h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 24 }}>CPCB Reg: R-8821 • Bengaluru Plant</p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Batches In Process", value: "3", icon: Factory, color: "var(--color-secondary)" },
            { label: "Total Processed", value: "12.4 T", icon: Recycle, color: "var(--color-primary)" },
            { label: "EPR Issued", value: "28", icon: FileCheck, color: "var(--color-sealed)" },
            { label: "Mass Balance", value: "99.1%", icon: Check, color: "var(--color-success)" },
          ].map((s) => (
            <div key={s.label} className="metric-card">
              <s.icon size={20} color={s.color} />
              <div className="metric-label" style={{ marginTop: 8 }}>{s.label}</div>
              <div className="metric-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Link href="/recycler/processing" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", textAlign: "center", padding: 32 }}>
              <Recycle size={32} color="var(--color-primary)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Process Batch & Log Yields</h3>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Record material recovery and mass balance</p>
            </div>
          </Link>
          <Link href="/recycler/processing" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", textAlign: "center", padding: 32 }}>
              <FileCheck size={32} color="var(--color-sealed)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Issue EPR Certificate</h3>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Generate CPCB-compliant digital certificates</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
