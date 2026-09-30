"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Leaf,
  ArrowRight,
  Smartphone,
  Scale,
  Banknote,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Globe,
  Phone,
  ChevronRight,
  Recycle,
  Truck,
  Factory,
  FileCheck,
  CheckCircle2,
  Zap,
} from "lucide-react";

const scrapRates = [
  { name: "PCB High Grade", code: "PCB_HIGH_GRADE", rate: 850, trend: "up", change: "+4.2%" },
  { name: "Lithium Batteries", code: "LITHIUM_BATTERY", rate: 420, trend: "up", change: "+1.8%" },
  { name: "Copper Wires", code: "METALS", rate: 680, trend: "down", change: "-0.9%" },
  { name: "Mixed Appliances", code: "MIXED_APPLIANCE", rate: 45, trend: "stable", change: "Stable" },
];

const traceabilitySteps = [
  { icon: Smartphone, label: "Consumer", desc: "Doorstep verification" },
  { icon: Truck, label: "Collector", desc: "Geo-tagged QR bag" },
  { icon: Factory, label: "Hub", desc: "Material segregation" },
  { icon: Recycle, label: "Recycler", desc: "Certified refining" },
  { icon: FileCheck, label: "EPR Certificate", desc: "CPCB compliance" },
];

export default function LandingPage() {
  const [counter, setCounter] = useState(142580);
  const [lang, setLang] = useState<"en" | "hi">("en");

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      {/* ===== TOP NAVIGATION ===== */}
      <nav className="nav-top" style={{ maxWidth: 1280, margin: "0 auto", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Leaf size={20} color="white" />
          </div>
          <span style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: 18, color: "var(--color-text-primary)" }}>
            EcoTrace India
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }} className="desktop-only">
          <Link href="#how-it-works" style={{ fontSize: 14, color: "var(--color-text-secondary)", textDecoration: "none" }}>How It Works</Link>
          <Link href="#rates" style={{ fontSize: 14, color: "var(--color-text-secondary)", textDecoration: "none" }}>Scrap Rates</Link>
          <Link href="/auth/login" style={{ fontSize: 14, color: "var(--color-text-secondary)", textDecoration: "none" }}>For Collectors</Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            style={{ fontSize: 12, padding: "4px 10px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)", background: "white", cursor: "pointer", color: "var(--color-text-secondary)" }}
          >
            <Globe size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {lang === "en" ? "EN" : "हि"}
          </button>
          <Link href="/auth/login" className="btn btn-secondary" style={{ height: 36, fontSize: 13 }}>Login</Link>
          <Link href="/consumer/pickups/new" className="btn btn-primary" style={{ height: 36, fontSize: 13 }}>Book Pickup</Link>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section style={{ padding: "80px 24px 60px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div className="animate-fade-in" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: "var(--radius-full)", background: "var(--color-primary-light)", marginBottom: 24 }}>
          <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)" }}></span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary-dark)" }}>
            {counter.toLocaleString("en-IN")} kg e-waste responsibly recycled
          </span>
        </div>
        <h1 className="animate-slide-up" style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 20, fontFamily: "var(--font-headline)" }}>
          Turn India&apos;s E-Waste into{" "}
          <span style={{ color: "var(--color-primary)" }}>Verified Value</span>
        </h1>
        <p className="animate-slide-up" style={{ fontSize: 17, color: "var(--color-text-secondary)", lineHeight: 1.7, maxWidth: 640, margin: "0 auto 32px" }}>
          India&apos;s first fully transparent doorstep e-waste collection platform. Fair pricing, instant digital payments, and CPCB-certified recycling — from your home to the refinery.
        </p>
        <div className="animate-slide-up" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/consumer/pickups/new" className="btn btn-primary btn-lg" style={{ gap: 8 }}>
            Schedule Free Pickup <ArrowRight size={18} />
          </Link>
          <Link href="/auth/login" className="btn btn-secondary btn-lg">
            Collector Partner Login
          </Link>
        </div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
          {["CPCB Registered", "Instant UPI Payout", "Zero Landfill"].map((badge) => (
            <div key={badge} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-secondary)" }}>
              <CheckCircle2 size={15} color="var(--color-primary)" />
              {badge}
            </div>
          ))}
        </div>
      </section>

      {/* ===== 3-STEP WORKFLOW ===== */}
      <section id="how-it-works" style={{ padding: "60px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="status-pill status-success" style={{ marginBottom: 12, display: "inline-flex" }}>Simple & Certified Process</span>
          <h2 style={{ fontSize: 28, marginTop: 12 }}>How It Works</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: Smartphone, step: "1", title: "Request Doorstep Pickup", desc: "Select your e-waste items, get instant price estimates, and book a convenient time slot." },
            { icon: Scale, step: "2", title: "Verified Digital Weigh-In", desc: "Our certified collectors weigh your items with calibrated digital scales and photographic proof." },
            { icon: Banknote, step: "3", title: "Instant UPI Payment", desc: "Receive fair market-rate payment directly to your UPI account within minutes." },
          ].map((item) => (
            <div key={item.step} className="card" style={{ textAlign: "center", padding: 32 }}>
              <div style={{ width: 56, height: 56, borderRadius: "var(--radius-lg)", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <item.icon size={28} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary)", marginBottom: 8 }}>STEP {item.step}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== LIVE SCRAP RATES ===== */}
      <section id="rates" style={{ padding: "60px 24px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 24 }}>Today&apos;s Scrap Rates</h2>
              <p className="text-caption" style={{ marginTop: 4 }}>
                <Zap size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Updated 10 min ago • Mandi Indexed
              </p>
            </div>
            <Link href="/pricing" className="btn btn-secondary" style={{ height: 36, fontSize: 13 }}>
              View All 30+ Items <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
            {scrapRates.map((item) => (
              <div key={item.code} className="card card-compact" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>₹{item.rate}<span style={{ fontSize: 14, fontWeight: 400, color: "var(--color-text-secondary)" }}>/kg</span></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  {item.trend === "up" && <TrendingUp size={20} color="var(--color-success)" />}
                  {item.trend === "down" && <TrendingDown size={20} color="var(--color-error)" />}
                  {item.trend === "stable" && <Minus size={20} color="var(--color-text-muted)" />}
                  <span style={{ fontSize: 12, fontWeight: 500, color: item.trend === "up" ? "var(--color-success)" : item.trend === "down" ? "var(--color-error)" : "var(--color-text-muted)" }}>
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CHAIN OF CUSTODY ===== */}
      <section style={{ padding: "60px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 24, textAlign: "center", marginBottom: 40 }}>End-to-End Chain of Custody</h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
          {traceabilitySteps.map((step, i) => (
            <div key={step.label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center", minWidth: 120 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", border: "2px solid var(--color-primary)" }}>
                  <step.icon size={24} color="var(--color-primary)" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{step.label}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{step.desc}</div>
              </div>
              {i < traceabilitySteps.length - 1 && (
                <ChevronRight size={20} color="var(--color-primary)" style={{ margin: "0 4px", flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
          {["CPCB Authorization", "ISO 14001 Certified", "DPDP Act 2023 Compliant"].map((badge) => (
            <div key={badge} className="status-pill status-sealed">{badge}</div>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: "var(--color-text-primary)", color: "white", padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Leaf size={20} color="var(--color-primary)" />
              <span style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: 16 }}>EcoTrace India</span>
            </div>
            <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6 }}>
              India&apos;s first transparent, CPCB-certified e-waste reverse logistics platform connecting consumers, collectors, and recyclers.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Compliance</h4>
            <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 2 }}>
              <div><Shield size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />CPCB Authorized Facility Network</div>
              <div><Shield size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />DPDP Act 2023 — Bank-grade encryption</div>
              <div><Shield size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />E-Waste Management Rules 2022</div>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Emergency Contact</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94A3B8" }}>
              <Phone size={14} />
              +91 1800-ECO-TRACE (Toll-Free)
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "32px auto 0", paddingTop: 24, borderTop: "1px solid #334155", textAlign: "center", fontSize: 12, color: "#64748B" }}>
          © {new Date().getFullYear()} EcoTrace India. All rights reserved. Verified under CPCB E-Waste Framework.
        </div>
      </footer>
    </div>
  );
}
