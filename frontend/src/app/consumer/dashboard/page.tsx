"use client";

import Link from "next/link";
import { Package, MapPin, Clock, Calendar, ArrowRight, Leaf, Bell } from "lucide-react";

const pickups = [
  { id: "PK-4029", status: "ASSIGNED", date: "Today, 10:00 AM", items: "2 Laptops, 1 Battery Pack", estimatedPayout: "₹680", collector: "Ramesh K." },
  { id: "PK-4025", status: "COMPLETED", date: "Yesterday, 2:30 PM", items: "5 Old Phones, Cables", estimatedPayout: "₹1,240", collector: "Suresh S." },
  { id: "PK-4018", status: "COMPLETED", date: "26 Sep, 11:00 AM", items: "Washing Machine", estimatedPayout: "₹350", collector: "Vikram P." },
];

function getStatusStyle(status: string) {
  switch (status) {
    case "REQUESTED": return "status-pill status-pending";
    case "ASSIGNED": return "status-pill status-info";
    case "COLLECTED": return "status-pill status-success";
    case "COMPLETED": return "status-pill status-success";
    default: return "status-pill";
  }
}

export default function ConsumerDashboard() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <div className="nav-top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Leaf size={20} color="var(--color-primary)" />
          <span style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: 16 }}>EcoTrace India</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Bell size={20} color="var(--color-text-secondary)" />
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>PS</div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: 16, paddingBottom: 100 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Welcome back, Priya!</h1>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Schedule a doorstep e-waste pickup</p>
        </div>

        {/* Quick Action */}
        <Link href="/consumer/pickups/new" style={{ textDecoration: "none" }}>
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, background: "var(--color-primary)", border: "none", color: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Package size={24} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Book New Pickup</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Get instant price estimates</div>
              </div>
            </div>
            <ArrowRight size={20} />
          </div>
        </Link>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total Recycled", value: "34.5 kg", color: "var(--color-primary)" },
            { label: "Total Earned", value: "₹4,270", color: "var(--color-primary)" },
            { label: "Certificates", value: "3", color: "var(--color-sealed)" },
          ].map((stat) => (
            <div key={stat.label} className="card card-compact" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Pickups List */}
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>My Pickups</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pickups.map((pickup) => (
            <Link
              key={pickup.id}
              href={`/consumer/pickups/${pickup.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="card card-compact" style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{pickup.id}</span>
                  <span className={getStatusStyle(pickup.status)}>{pickup.status}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <Package size={13} /> {pickup.items}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={12} /> {pickup.date}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-primary)" }}>{pickup.estimatedPayout}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="nav-bottom">
        <Link href="/consumer/dashboard" className="nav-bottom-item active">🏠 Home</Link>
        <Link href="/consumer/pickups/new" className="nav-bottom-item">📦 Book</Link>
        <Link href="#" className="nav-bottom-item">📜 Certificates</Link>
        <Link href="#" className="nav-bottom-item">👤 Profile</Link>
      </div>
    </div>
  );
}
