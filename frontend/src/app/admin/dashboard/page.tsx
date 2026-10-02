"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Leaf, Bell, Package, Users, IndianRupee, AlertTriangle,
  TrendingUp, Pencil, ChevronRight, Shield, Radar, LayoutDashboard, Settings, Activity
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

const chartData = [
  { month: "Apr", pcb: 22, battery: 15, appliance: 28, metal: 12 },
  { month: "May", pcb: 25, battery: 18, appliance: 30, metal: 14 },
  { month: "Jun", pcb: 28, battery: 20, appliance: 32, metal: 16 },
  { month: "Jul", pcb: 30, battery: 22, appliance: 29, metal: 18 },
  { month: "Aug", pcb: 32, battery: 24, appliance: 35, metal: 20 },
  { month: "Sep", pcb: 35, battery: 28, appliance: 38, metal: 22 },
];

const fraudAlerts = [
  { id: "#FRD-892", date: "29 Sep", hub: "Suresh Kumar / Sector 18 Hub", issue: "Weight Discrepancy > 8.5%", risk: "HIGH" },
  { id: "#FRD-891", date: "28 Sep", hub: "Vikram Scrap / South Delhi Hub", issue: "Variance Exceeded 6.2%", risk: "MEDIUM" },
  { id: "#FRD-889", date: "27 Sep", hub: "Arun Kumar / Noida Hub", issue: "Volume > 100kg (Domestic)", risk: "LOW" },
];

const scrapRates = [
  { name: "PCB High Grade", rate: 850, updated: "3 days ago" },
  { name: "Lithium Battery", rate: 420, updated: "3 days ago" },
  { name: "Mixed Appliance", rate: 45, updated: "5 days ago" },
  { name: "Copper Cable", rate: 680, updated: "3 days ago" },
];

function getRiskStyle(risk: string): string {
  switch (risk) {
    case "HIGH": return "status-pill status-error";
    case "MEDIUM": return "status-pill status-pending";
    case "LOW": return "status-pill status-success";
    default: return "status-pill";
  }
}

export default function AdminDashboard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const adminNav = [
    {
      section: "Command Center",
      items: [
        { label: "Overview", icon: <LayoutDashboard size={18} />, href: "/admin/dashboard" },
        { label: "Fraud Radar", icon: <Radar size={18} />, href: "/admin/fraud" },
        { label: "Live Platform Sync", icon: <Activity size={18} />, href: "/admin/analytics" },
      ]
    },
    {
      section: "Network",
      items: [
        { label: "Users & Roles", icon: <Users size={18} />, href: "/admin/users" },
        { label: "Hub Operations", icon: <Package size={18} />, href: "/admin/hubs" },
        { label: "Financials", icon: <IndianRupee size={18} />, href: "/admin/payments" },
        { label: "Settings", icon: <Settings size={18} />, href: "/admin/settings" },
      ]
    }
  ];

  return (
    <DashboardShell 
      navItems={adminNav}
      activeRole="Admin"
      userName="Rajesh Mehta"
      userRole="Central Operations"
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { icon: Package, label: "Total E-Waste Collected", value: "184.2 T", trend: "+12.4% this month", color: "var(--color-primary)", href: undefined },
            { icon: Users, label: "Active Collectors", value: "1,420", trend: "+89 verified", color: "var(--color-secondary)", href: undefined },
            { icon: IndianRupee, label: "Total Consumer Payouts", value: "₹68.4L", trend: "+₹8.2L this month", color: "var(--color-primary)", href: undefined },
            { icon: AlertTriangle, label: "Discrepancy Alerts (>5%)", value: "3 Active", trend: "Action Required", color: "var(--color-error)", href: "/admin/fraud" },
          ].map((kpi) => {
            const cardContent = (
              <div className="metric-card" style={{ cursor: kpi.href ? "pointer" : "default" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <kpi.icon size={20} color={kpi.color} />
                  <TrendingUp size={14} color={kpi.color} />
                </div>
                <div className="metric-label" style={{ marginTop: 8 }}>{kpi.label}</div>
                <div className="metric-value" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="metric-trend metric-trend-up">{kpi.trend}</div>
              </div>
            );
            return kpi.href ? (
              <Link key={kpi.label} href={kpi.href} style={{ textDecoration: "none" }}>
                {cardContent}
              </Link>
            ) : (
              <div key={kpi.label}>{cardContent}</div>
            );
          })}
        </div>

        {/* Chart with Zero Hydration Errors Guard */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Monthly Collection Trends by Material Category</h3>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>CPCB EPR Categories (Tonnes)</span>
          </div>
          <div style={{ width: "100%", height: 300, minHeight: 300 }}>
            {isMounted ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#475569" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#475569" }} label={{ value: "Tonnes", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: "#475569" } }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="pcb" name="PCB Components" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="battery" name="Lithium Batteries" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="appliance" name="Mixed Appliances" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="metal" name="Copper & Metals" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                Loading analytics trends...
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Fraud Radar Link + Pricing */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 24 }}>
          {/* Fraud Alerts */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={18} color="var(--color-error)" />
                High-Priority Fraud & Discrepancy Alerts
              </h3>
              <Link href="/admin/fraud" className="btn btn-secondary" style={{ fontSize: 12, padding: "4px 12px", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                <Radar size={13} /> Open Radar
              </Link>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Date</th>
                  <th>Hub / Collector</th>
                  <th>Issue Type</th>
                  <th>Risk</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {fraudAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{alert.id}</td>
                    <td>{alert.date}</td>
                    <td style={{ fontSize: 13 }}>{alert.hub}</td>
                    <td><span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-full)", background: alert.risk === "HIGH" ? "var(--color-error-tint)" : alert.risk === "MEDIUM" ? "var(--color-pending-tint)" : "var(--color-success-tint)" }}>{alert.issue}</span></td>
                    <td><span className={getRiskStyle(alert.risk)}>{alert.risk}</span></td>
                    <td>
                      <Link href="/admin/fraud" className="btn btn-secondary" style={{ height: 30, fontSize: 12, padding: "0 10px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        Review <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Controls */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Regional Scrap Rate Overview</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {scrapRates.map((rate) => (
                <div key={rate.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{rate.name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Updated: {rate.updated}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>₹{rate.rate}/kg</span>
                    <button style={{ width: 28, height: 28, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Pencil size={12} color="var(--color-text-secondary)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 16, display: "flex", alignItems: "center", gap: 4 }}>
              <Shield size={11} /> All price changes are audit-logged automatically
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
