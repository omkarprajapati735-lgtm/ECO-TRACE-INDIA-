"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Recycle, Shield, FileCheck, Check, Download, AlertTriangle } from "lucide-react";

interface YieldField {
  id: string;
  label: string;
  icon: string;
  unit: string;
  value: string;
  isHazardous?: boolean;
}

const initialYieldFields: YieldField[] = [
  { id: "copper", label: "Copper Recovered", icon: "🪨", unit: "kg", value: "184.200" },
  { id: "gold", label: "Gold & Precious Metals", icon: "✨", unit: "g", value: "48.50" },
  { id: "aluminum", label: "Structural Aluminium", icon: "⚙️", unit: "kg", value: "591.300" },
  { id: "plastic", label: "Clean Plastics (HDPE/ABS)", icon: "♻️", unit: "kg", value: "412.000" },
  { id: "slag", label: "Hazardous Non-Recyclable Slag", icon: "☢️", unit: "kg", value: "62.450", isHazardous: true },
];

export default function ProcessingPage() {
  const [yields, setYields] = useState<YieldField[]>(initialYieldFields);
  const [issuedCert, setIssuedCert] = useState<{ certNo: string; sha256: string; status: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("Samsung Electronics India");
  const grossWeight = 1250;

  const totalRecovered = yields.reduce((sum, y) => {
    const val = parseFloat(y.value) || 0;
    if (y.unit === "g") return sum + val / 1000;
    return sum + val;
  }, 0);

  const massBalancePct = (totalRecovered / grossWeight) * 100;
  const isMassBalanceValid = massBalancePct <= 101.0 && massBalancePct >= 95.0;
  const certifiedWeight = totalRecovered - (parseFloat(yields.find(y => y.id === "slag")?.value || "0"));

  const updateYield = (id: string, value: string) => {
    setYields((prev) => prev.map((y) => (y.id === id ? { ...y, value } : y)));
  };

  const handleIssueCertificate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIssuedCert({
        certNo: `CPCB-EPR-2026-${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
        sha256: "8e3c7d6a5b4f1092837465abcde9876543210fedcba9876543210123456789ab",
        status: "CPCB_VERIFIED",
      });
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <div className="nav-top" style={{ maxWidth: "100%", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/recycler/dashboard" style={{ color: "var(--color-text-primary)", display: "flex" }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Recycler Processing & EPR Compliance</h1>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        {/* Batch Banner */}
        <div className="card" style={{ marginBottom: 24, borderLeft: "4px solid var(--color-primary)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Recycle size={28} color="var(--color-primary)" />
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>BATCH-2026-BLR-089</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>From: Bengaluru South Hub • Net Input: {grossWeight.toLocaleString("en-IN")}.000 kg</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{grossWeight.toLocaleString("en-IN")}.000 kg</div>
            <span className="status-pill status-info">PROCESSED</span>
          </div>
        </div>

        {/* Yield Recovery Grid */}
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Material Recovery Yields (Mass Balance Log)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
          {yields.map((y) => {
            const raw = parseFloat(y.value) || 0;
            const inKg = y.unit === "g" ? raw / 1000 : raw;
            const fraction = ((inKg / grossWeight) * 100).toFixed(2);
            return (
              <div key={y.id} className="card" style={{ border: y.isHazardous ? "1px solid var(--color-error)" : undefined, background: y.isHazardous ? "var(--color-error-tint)" : undefined }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{y.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{y.label}</span>
                </div>
                <input
                  type="number"
                  value={y.value}
                  onChange={(e) => updateYield(y.id, e.target.value)}
                  className="input-field"
                  style={{ fontWeight: 700, fontSize: 18, textAlign: "center", marginBottom: 6 }}
                  step="0.001"
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>{y.unit}</span>
                  <span className="status-pill status-success" style={{ fontSize: 10 }}>{fraction}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mass Balance Bar */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Mass Balance Conservation Guardrail</span>
            <span className={isMassBalanceValid ? "status-pill status-success" : "status-pill status-error"}>
              {massBalancePct.toFixed(2)}% conservation {isMassBalanceValid ? "✓ Valid (≤ 101%)" : "✗ Violation (> 101%)"}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8 }}>
            Total Yield: {totalRecovered.toFixed(3)} kg | Input Batch Net: {grossWeight.toLocaleString("en-IN")}.000 kg | Acceptable Margin: ≤ 1.0%
          </div>
          <div style={{ height: 10, background: "var(--color-border)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, massBalancePct)}%`, background: isMassBalanceValid ? "var(--color-primary)" : "var(--color-error)", borderRadius: "var(--radius-full)", transition: "width 0.3s ease" }} />
          </div>
        </div>

        {/* EPR Certificate Box */}
        <div className="card" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, borderBottom: "2px solid var(--color-primary)", paddingBottom: 12 }}>
            <Shield size={20} color="var(--color-primary)" />
            <span style={{ fontSize: 16, fontWeight: 600 }}>Central Pollution Control Board (CPCB) Form-2 EPR Certificate</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 2 }}>Certificate Number</div>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15 }}>{issuedCert?.certNo || "CPCB-EPR-2026-PENDING"}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 2 }}>Certified Recycled Weight</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-primary)" }}>{certifiedWeight.toFixed(3)} kg (Recoverable)</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 2 }}>CPCB Recycler License</div>
              <div style={{ fontWeight: 600 }}>R-8821 (EcoTech Metallurgical)</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 2 }}>Target Producer / Brand</div>
              <select className="input-field" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} style={{ height: 38 }}>
                <option>Samsung Electronics India</option>
                <option>Apple India Pvt Ltd</option>
                <option>Dell Technologies India</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Check size={16} color="var(--color-success)" />
            <span style={{ fontSize: 13, color: "var(--color-success-text)", fontWeight: 500 }}>
              {issuedCert ? "✓ Tamper-Evident SHA-256 Fingerprint Registered" : "Ready to Sign and Issue CPCB Form-2"}
            </span>
          </div>

          <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--color-text-muted)", marginBottom: 16, wordBreak: "break-all" }}>
            SHA-256: {issuedCert?.sha256 || "Compute on generation buffer (e.g. 8e3c7d6a5b4f1092837465abcde9876543210fedcba9876543210123456789ab)"}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-primary btn-lg" onClick={handleIssueCertificate} disabled={!isMassBalanceValid || isProcessing} style={{ flex: 1 }}>
              <FileCheck size={18} /> {isProcessing ? "Signing Certificate..." : "Issue & Sign CPCB EPR Certificate"}
            </button>
            <a href="/api/v1/epr/demo/download" download className="btn btn-secondary btn-lg" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Download size={18} /> Download Form-2 PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
