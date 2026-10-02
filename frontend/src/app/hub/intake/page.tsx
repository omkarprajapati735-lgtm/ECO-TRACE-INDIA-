"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";

/* ---------- Types ---------- */
interface ManifestItem {
  id: number;
  category: string;
  icon: string;
  count: number;
  claimedWeight: number;
  hasPhoto: boolean;
}

interface BatchRow {
  id: string;
  sealId: string;
  material: string;
  materialSub: string;
  weight: number;
  recycler: string;
  facility: string;
  status: string;
  statusIcon: string;
  statusStyle: string;
  action: string;
}

/* ---------- Static Data ---------- */
const manifestItems: ManifestItem[] = [
  { id: 1, category: "PCB High Grade", icon: "🔧", count: 8, claimedWeight: 12.4, hasPhoto: true },
  { id: 2, category: "Lithium Batteries", icon: "🔋", count: 15, claimedWeight: 24.5, hasPhoto: true },
  { id: 3, category: "Mixed Appliances", icon: "🏠", count: 12, claimedWeight: 32.1, hasPhoto: true },
  { id: 4, category: "Copper Cables", icon: "🔌", count: 6, claimedWeight: 15.5, hasPhoto: true },
];

const BATCH_ROWS: BatchRow[] = [
  {
    id: "#BTH-2025-0881", sealId: "Seal #TP-9921",
    material: "Printed Circuit Boards", materialSub: "Telecom & PC Motherboards",
    weight: 125.65, recycler: "Attero Recycling Ltd.", facility: "Haridwar Facility (CPCB-REG-44)",
    status: "SEALED (TAMPER-PROOF)", statusIcon: "", statusStyle: "tag-tertiary",
    action: "Print QR Shipping Manifest",
  },
  {
    id: "#BTH-2025-0879", sealId: "Seal #TP-9890",
    material: "Spent Lithium-Ion Cathodes", materialSub: "EV Battery Packs & Cells",
    weight: 450.00, recycler: "Lohum Cleantech", facility: "Greater Noida R&D Plant",
    status: "IN TRANSIT (GPS)", statusIcon: "navigation", statusStyle: "tag-secondary",
    action: "Live Telematics",
  },
  {
    id: "#BTH-2025-0875", sealId: "Seal #TP-9820",
    material: "Shredded Copper & Heat Sinks", materialSub: "High-Conductivity Non-Ferrous",
    weight: 820.00, recycler: "Karo Sambhav Facility", facility: "Faridabad Processing Complex",
    status: "PROCESSED (EPR CREDITED)", statusIcon: "done_all", statusStyle: "tag-primary",
    action: "View EPR Certificate",
  },
];

const BAYS = [
  { name: "BAY A-02 (Lithium)", weight: "1,820 kg", percent: 62, status: "Normal Aggregate", critical: false },
  { name: "BAY C-14 (PCBs)", weight: "2,410 kg", percent: 88, status: "Sealing Required Soon", critical: true },
  { name: "BAY E-09 (Cu Shreds)", weight: "4,420 kg", percent: 71, status: "Ready for Batch Freight", critical: false },
];

export default function HubIntakePage() {
  const [hubWeight, setHubWeight] = useState("2.780");
  const [scanned] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState<"IDLE" | "ACCEPTED" | "FLAGGED_DISCREPANCY">("IDLE");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const fieldWeight = 2.780;
  const hubWeightNum = parseFloat(hubWeight) || 0;
  const delta = Math.abs(hubWeightNum - fieldWeight);
  const deltaPct = fieldWeight > 0 ? ((delta / fieldWeight) * 100).toFixed(1) : "0.0";
  const isMatch = delta < 0.001;

  return (
    <DashboardShell activeRole="Hub Mgr" userName="Rajesh Patel" userRole="Ops Lead (Western Hub)">
      {/* Top Header */}
      <div className="card" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-md)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-sm)" }}>
            <span className="tag tag-primary" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>CPCB Node Validated</span>
            <span className="text-label-code" style={{ color: "var(--color-outline)" }}>•</span>
            <span className="text-label-code" style={{ color: "var(--color-outline)", textTransform: "uppercase" }}>E-Waste Rules 2022 Compliance</span>
            <span className="text-label-code" style={{ color: "var(--color-outline)" }}>•</span>
            <span className="text-label-code" style={{ color: "var(--color-primary-container)", fontWeight: 600 }}>Active Shift: Desk 02-B</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            <h1 className="text-headline-lg" style={{ color: "var(--color-on-surface)", letterSpacing: "-0.015em" }}>EcoTrace Mumbai Central Intake Hub</h1>
            <span className="tag tag-surface" style={{ fontSize: 11 }}>ID: #HB-04 (New Delhi Industrial Area Phase-II)</span>
          </div>
          <p className="text-body-md" style={{ color: "var(--color-on-surface-variant)" }}>Material Recovery, Precision Digital Reconciliation &amp; Tamper-Sealed Batch Freight Dispatch</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", alignSelf: "center" }}>
          <button type="button" className="btn btn-secondary">Current Batch Status</button>
          <button type="button" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_box</span>
            Attached Notice
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-md)" }}>
        <div className="metric-card">
          <div className="metric-card-header">
            <div>
              <div className="metric-label">Today&apos;s Received Intake</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)", marginTop: 4 }}>
                <span className="metric-value">1,420.50</span>
                <span className="metric-unit">KG</span>
              </div>
            </div>
            <div className="metric-icon-box"><span className="material-symbols-outlined" style={{ fontSize: 24 }}>move_to_inbox</span></div>
          </div>
          <div className="metric-card-footer">
            <span className="footer-label">From 24 Registered Collectors</span>
            <span className="footer-value" style={{ color: "var(--color-primary)" }}>+18.4%</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card-header">
            <div>
              <div className="metric-label">Current Floor Inventory</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)", marginTop: 4 }}>
                <span className="metric-value">8,650.00</span>
                <span className="metric-unit">KG</span>
              </div>
            </div>
            <div className="metric-icon-box" style={{ color: "var(--color-secondary)" }}><span className="material-symbols-outlined" style={{ fontSize: 24 }}>inventory_2</span></div>
          </div>
          <div className="metric-card-footer">
            <span className="footer-label">Allocated Across 6 Bays</span>
            <span className="footer-value" style={{ color: "var(--color-on-surface)" }}>8.65 MT Active</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card-header">
            <div>
              <div className="metric-label">Reconciliation Accuracy</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)", marginTop: 4 }}>
                <span className="metric-value" style={{ color: "var(--color-primary)" }}>99.8%</span>
                <span className="material-symbols-outlined" style={{ color: "var(--color-primary)", fontSize: 20 }}>verified</span>
              </div>
            </div>
            <div className="metric-icon-box" style={{ background: "rgba(0,101,44,0.1)" }}><span className="material-symbols-outlined" style={{ fontSize: 24 }}>verified_user</span></div>
          </div>
          <div className="metric-card-footer">
            <span className="footer-label">Discrepancy Flags (48h)</span>
            <span className="footer-value" style={{ color: "var(--color-tertiary)" }}>1 Case Open</span>
          </div>
        </div>
        <div className="metric-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-outline)" }}>Hub Storage Capacity</span>
            <span className="tag tag-tertiary" style={{ fontWeight: 700 }}>72% CRITICAL</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
              <span className="text-headline-sm" style={{ fontWeight: 700 }}>8.65 / 12.0 MT</span>
              <span className="text-label-code" style={{ color: "var(--color-on-surface-variant)" }}>Max Rating</span>
            </div>
            <div className="progress-bar-track" style={{ height: 12 }}>
              <div className="progress-bar-fill primary" style={{ width: "55%" }}></div>
              <div className="progress-bar-fill tertiary" style={{ width: "17%" }}></div>
            </div>
          </div>
          <p className="text-body-sm" style={{ color: "var(--color-tertiary)", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
            Batch sealing recommended for PCB Bay C-14
          </p>
        </div>
      </div>

      {/* Discrepancy Alert */}
      <div className="alert-callout alert-callout-warning">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-sm)", flex: 1 }}>
          <div className="alert-callout-icon warning">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>report_problem</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", flexWrap: "wrap" }}>
              <span className="text-label-sm" style={{ color: "var(--color-tertiary)", fontWeight: 700 }}>DISCREPANCY ALERT: Consignment #IN-9912</span>
              <span className="tag tag-tertiary-solid" style={{ fontSize: 11 }}>Requires Supervisor Override</span>
            </div>
            <p className="text-body-md" style={{ color: "var(--color-on-surface)" }}>
              Field agent reported <span className="text-label-code" style={{ fontWeight: 600 }}>14.50 kg</span> (Gross), but Scale #04 captured <span className="text-label-code" style={{ fontWeight: 600, color: "var(--color-tertiary)" }}>12.80 kg</span> (Gross). Net Variance: <strong className="text-label-code" style={{ color: "var(--color-tertiary)" }}>-1.70 kg (-11.7%)</strong>.
            </p>
            <span className="text-label-sm" style={{ color: "var(--color-on-surface-variant)" }}>Assigned Agent: Mohan Lal (#GC-7719) • Material: CRT Glass Residue • Bay Quarantined</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", flexShrink: 0, alignSelf: "center" }}>
          <button type="button" className="btn btn-secondary" style={{ fontSize: 12 }}>Audit Video Log</button>
          <button type="button" className="btn btn-tertiary" style={{ fontSize: 12 }}>Supervisor Sign-Off</button>
        </div>
      </div>

      {/* Status Banner */}
      {submissionStatus !== "IDLE" && (
        <div className={`alert-callout ${submissionStatus === "ACCEPTED" ? "alert-callout-success" : "alert-callout-warning"}`} style={{ alignItems: "center" }}>
          <div className={`alert-callout-icon ${submissionStatus === "ACCEPTED" ? "success" : "warning"}`}>
            <span className="material-symbols-outlined">{submissionStatus === "ACCEPTED" ? "check_circle" : "error"}</span>
          </div>
          <div>
            <div className="text-headline-sm">{submissionStatus === "ACCEPTED" ? "Lot Accepted into Hub Inventory" : "Lot Frozen: Discrepancy Exceeded 5%"}</div>
            <div className="text-body-sm" style={{ color: "var(--color-on-surface-variant)" }}>{submissionMessage}</div>
          </div>
        </div>
      )}

      {/* Main 2-Column Work Area */}
      {scanned && (
        <div className="grid-12">
          {/* Left: Intake Verification (7 cols) */}
          <div className="col-span-7" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
              {/* Live Intake Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                  <span className="animate-pulse" style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }}></span>
                  <h2 className="text-headline-sm" style={{ color: "var(--color-on-surface)" }}>Live Intake Verification &amp; Floor Scale #02</h2>
                </div>
                <div className="tag tag-surface" style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-primary)" }}>sensors</span>
                  <span className="text-label-code">CALIBRATED: RS232 STREAM</span>
                </div>
              </div>

              {/* Collector Strip */}
              <div style={{ background: "var(--color-surface-container-low)", padding: "var(--space-md)", borderRadius: "var(--radius-lg)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", background: "var(--color-primary-container)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-on-primary-container)", fontWeight: 700, fontSize: 14 }}>SK</div>
                  <div>
                    <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-outline)" }}>Collector Handover QR Scanned</span>
                    <p className="text-headline-sm" style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>Suresh Kumar</p>
                    <div className="text-label-code" style={{ color: "var(--color-on-surface-variant)" }}>Badge #GC-8842 • South Delhi Green Ward</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="tag tag-primary" style={{ textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>qr_code_scanner</span>
                    Handover Verified
                  </span>
                  <p className="text-label-code" style={{ color: "var(--color-outline)", marginTop: 4 }}>Ref: #COL-2025-9941</p>
                </div>
              </div>

              {/* Weight Comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
                <div style={{ background: "rgba(239,244,255,0.7)", padding: "var(--space-md)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--color-on-surface-variant)" }}>
                    <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>Field Mobile Scan Weight</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>smartphone</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)" }}>
                    <span className="text-metric-display" style={{ color: "var(--color-on-surface)" }}>2.780</span>
                    <span className="text-label-code" style={{ color: "var(--color-outline)", fontWeight: 600 }}>KG</span>
                  </div>
                  <p className="text-body-sm" style={{ color: "var(--color-on-surface-variant)" }}>Logged at 11:42 AM • Digital Scale Hook</p>
                </div>
                <div style={{ background: "var(--color-surface-container)", padding: "var(--space-md)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xs)", position: "relative", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, color: "var(--color-on-surface)" }}>Hub Scale (Serial COM-4)</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-primary)" }}>check_circle</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)" }}>
                    <input
                      type="number"
                      value={hubWeight}
                      onChange={(e) => setHubWeight(e.target.value)}
                      step="0.001"
                      style={{
                        fontFamily: "var(--font-headline)", fontSize: 32, fontWeight: 700,
                        color: "var(--color-primary)", background: "transparent", border: "none",
                        outline: "none", width: "120px", lineHeight: "38px", letterSpacing: "-0.02em",
                      }}
                    />
                    <span className="text-label-code" style={{ color: "var(--color-primary)", fontWeight: 600 }}>KG</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: isMatch ? "var(--color-primary)" : "var(--color-tertiary)" }}></span>
                    <p className="text-label-code" style={{ color: isMatch ? "var(--color-primary)" : "var(--color-tertiary)", fontWeight: 700, fontSize: 11 }}>
                      Delta: {delta.toFixed(3)} kg ({isMatch ? "100% Match" : `${deltaPct}% Variance`})
                    </p>
                  </div>
                </div>
              </div>

              {/* Bin Assignment */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-outline)" }}>Automated Bin &amp; Bay Allocation</span>
                <div style={{ padding: "var(--space-md)", borderRadius: "var(--radius-lg)", background: "var(--color-surface-container-low)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-sm)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "var(--radius-lg)", background: "rgba(113,42,226,0.1)", color: "var(--color-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: "var(--font-code)" }}>C-14</div>
                    <div>
                      <h3 className="text-headline-sm" style={{ fontWeight: 600, color: "var(--color-on-surface)" }}>Bin C-14: High-Grade Electronics</h3>
                      <p className="text-body-sm" style={{ color: "var(--color-on-surface-variant)" }}>Server Motherboards, Telecom PCB Trays &amp; Memory Assemblies</p>
                    </div>
                  </div>
                  <span className="text-label-code" style={{ color: "var(--color-secondary)", background: "var(--color-surface-container-lowest)", padding: "var(--space-xs) var(--space-sm)", borderRadius: "var(--radius-md)", fontWeight: 700, boxShadow: "var(--shadow-sm)" }}>Bay Occupancy: 84%</span>
                </div>
              </div>

              {/* Action */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 var(--space-xs)" }}>
                  <span className="text-label-code" style={{ color: "var(--color-on-surface-variant)", fontSize: 11 }}>Direct Bank Deposit / UPI Trigger:</span>
                  <span className="text-label-code" style={{ fontWeight: 700, color: "var(--color-on-surface)", fontSize: 11 }}>₹ 444.80 (@ ₹160/kg rate)</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-xl"
                  onClick={() => {
                    setSubmissionStatus("ACCEPTED");
                    setSubmissionMessage("Lot verified successfully. Inventory added to Bin C-14, collector commission credited. CPCB ledger updated.");
                  }}
                  style={{ borderRadius: "var(--radius-md)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-sm)", boxShadow: "var(--shadow-md)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>assignment_turned_in</span>
                  Approve Hub Intake &amp; Release Collector Deposit
                </button>
                <p className="text-label-code" style={{ textAlign: "center", color: "var(--color-outline)", fontSize: 11 }}>Consignment will immediately stamp to CPCB ledger and auto-generate physical barcode tag #TAG-8821</p>
              </div>
            </div>

            {/* Storage Bays */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 className="text-headline-sm" style={{ color: "var(--color-on-surface)" }}>Hub Storage Bays (Current Load Breakdown)</h3>
                  <p className="text-body-sm" style={{ color: "var(--color-on-surface-variant)" }}>Live telemetry from floor load-cells in Okhla Grid Section B</p>
                </div>
                <span className="tag tag-surface">6/6 Sensors Online</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-sm)" }}>
                {BAYS.map((bay) => (
                  <div key={bay.name} style={{ padding: "var(--space-sm)", background: "var(--color-surface-container-low)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="text-label-sm" style={{ color: bay.critical ? "var(--color-tertiary)" : "var(--color-outline)", fontWeight: bay.critical ? 600 : 400 }}>{bay.name}</span>
                      <span className="text-label-code" style={{ fontWeight: 700, color: bay.critical ? "var(--color-tertiary)" : "var(--color-on-surface)" }}>{bay.weight}</span>
                    </div>
                    <div className="progress-bar-track" style={{ height: 6 }}>
                      <div className={`progress-bar-fill ${bay.critical ? "tertiary" : "primary"}`} style={{ width: `${bay.percent}%` }}></div>
                    </div>
                    <span className="text-label-code" style={{ fontSize: 10, color: bay.critical ? "var(--color-tertiary)" : "var(--color-on-surface-variant)", fontWeight: bay.critical ? 700 : 400 }}>{bay.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: QR Manifest (5 cols) */}
          <div className="col-span-5" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-outline)" }}>Dispatch Manifest Generator</span>
                  <h2 className="text-headline-sm" style={{ color: "var(--color-on-surface)" }}>Tamper-Proof Batch Pass</h2>
                </div>
                <span className="tag tag-surface" style={{ fontWeight: 700 }}>FORM-6 CPCB</span>
              </div>

              {/* QR Code */}
              <div style={{ background: "var(--color-surface-container-low)", borderRadius: "var(--radius-xl)", padding: "var(--space-md)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-md)" }}>
                <div style={{ background: "var(--color-surface-container-lowest)", padding: "var(--space-md)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                  <svg width="176" height="176" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: "var(--color-on-surface)" }}>
                    <rect x="10" y="10" width="40" height="40" rx="2" stroke="currentColor" strokeWidth="6" fill="none" />
                    <rect x="20" y="20" width="20" height="20" fill="currentColor" />
                    <rect x="110" y="10" width="40" height="40" rx="2" stroke="currentColor" strokeWidth="6" fill="none" />
                    <rect x="120" y="20" width="20" height="20" fill="currentColor" />
                    <rect x="10" y="110" width="40" height="40" rx="2" stroke="currentColor" strokeWidth="6" fill="none" />
                    <rect x="20" y="120" width="20" height="20" fill="currentColor" />
                    <rect x="60" y="15" width="8" height="8" fill="currentColor" />
                    <rect x="75" y="15" width="8" height="8" fill="currentColor" />
                    <rect x="90" y="25" width="8" height="8" fill="currentColor" />
                    <rect x="60" y="35" width="8" height="8" fill="currentColor" />
                    <rect x="75" y="45" width="8" height="8" fill="currentColor" />
                    <rect x="58" y="58" width="44" height="44" rx="4" fill="#00652c" />
                    <path d="M72 80L78 86L90 74" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="115" y="60" width="8" height="8" fill="currentColor" />
                    <rect x="135" y="75" width="8" height="8" fill="currentColor" />
                    <rect x="120" y="90" width="8" height="8" fill="currentColor" />
                    <rect x="60" y="115" width="8" height="8" fill="currentColor" />
                    <rect x="75" y="125" width="8" height="8" fill="currentColor" />
                    <rect x="110" y="125" width="8" height="8" fill="currentColor" />
                    <rect x="125" y="140" width="8" height="8" fill="currentColor" />
                    <rect x="140" y="125" width="8" height="8" fill="currentColor" />
                  </svg>
                  <div className="text-label-code" style={{ fontWeight: 700, letterSpacing: "0.1em", marginTop: "var(--space-xs)" }}>BATCH #BTH-2025-0881</div>
                  <span className="text-label-code" style={{ fontSize: 10, color: "var(--color-outline)" }}>CRYPTOGRAPHIC SEAL: SHA256-OKHLA-NODE</span>
                </div>

                {/* Meta Attributes */}
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--space-xs)", textAlign: "left" }}>
                  {[
                    ["Designated Recycler:", "Attero Recycling Ltd.", true],
                    ["Destination Facility:", "Roorkee/Haridwar Hub #FZ-09", false],
                    ["Net Consolidated Weight:", "125.65 KG", true],
                    ["Tamper RFID Seal:", "#TP-9921-ACTIVE", false],
                    ["Transit Freight Vehicle:", "DL-1M-AA-4209 (GPS Online)", false],
                  ].map(([label, value, bold]) => (
                    <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", padding: "4px var(--space-sm)", background: "var(--color-surface-container-lowest)", borderRadius: "var(--radius-md)" }}>
                      <span className="text-body-sm" style={{ color: "var(--color-outline)" }}>{label}</span>
                      <span className="text-label-code" style={{ fontWeight: bold ? 700 : 600, color: String(label).includes("Weight") ? "var(--color-primary)" : String(label).includes("RFID") ? "var(--color-secondary)" : "var(--color-on-surface)" }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ width: "100%", display: "flex", gap: "var(--space-xs)" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                    Print QR Manifest
                  </button>
                  <button type="button" className="btn btn-purple" style={{ flex: 1, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
                    Lock &amp; Dispatch
                  </button>
                </div>
              </div>

              {/* Chain of Custody */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-outline)" }}>Batch Chain-of-Custody Validation</span>
                {[
                  { time: "08:15 AM", text: "Intake Batch Bin C-14 Filled (125.65 kg)", active: false },
                  { time: "10:40 AM", text: "RFID Tamper Tag #TP-9921 Bound & Locked", active: false },
                  { time: "PENDING", text: "Carrier Logistics Handover Gate 4", active: true },
                ].map((entry, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", padding: "var(--space-xs)", borderRadius: "var(--radius-md)", background: "var(--color-surface-container-low)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.active ? "var(--color-tertiary)" : "var(--color-primary)", flexShrink: 0 }} className={entry.active ? "animate-ping" : ""}></span>
                    <span className="text-label-code" style={{ color: entry.active ? "var(--color-tertiary)" : "var(--color-outline)", fontWeight: entry.active ? 700 : 400 }}>{entry.time}</span>
                    <span className="text-label-code" style={{ color: "var(--color-on-surface)" }}>{entry.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Camera Feed */}
            <div className="card card-compact" style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-outline)" }}>Bay C-14 Inspection Feed</span>
                <span className="text-label-code" style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: 11 }}>CAM-04 LIVE</span>
              </div>
              <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", height: 144, background: "linear-gradient(135deg, #1a2a1a, #0a1a0a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: "rgba(255,255,255,0.3)" }}>videocam</span>
                <div style={{ position: "absolute", bottom: 8, left: 8, padding: "2px 8px", borderRadius: "var(--radius-md)", background: "rgba(33,49,69,0.8)", backdropFilter: "blur(4px)", color: "var(--color-inverse-on-surface)" }}>
                  <span className="text-label-code" style={{ fontSize: 10 }}>AI CLASSIFICATION: GRADE-A PCB (98.4% PURITY)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Consolidation Table */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-sm)" }}>
          <div>
            <h2 className="text-headline-sm" style={{ fontWeight: 700 }}>Consolidated Outbound Batches &amp; Recycler Logistics</h2>
            <p className="text-body-sm" style={{ color: "var(--color-on-surface-variant)" }}>Formal recyclers authorized under CPCB Registry</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            <div className="tag tag-surface" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>filter_list</span>
              All Statuses (3 Active)
            </div>
            <button type="button" className="btn btn-primary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Create New Batch
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch ID &amp; QR Tag</th>
                <th>Material Stream</th>
                <th>Net Weight</th>
                <th>Designated Recycler</th>
                <th>Current Status</th>
                <th style={{ textAlign: "right" }}>Dispatch Control</th>
              </tr>
            </thead>
            <tbody>
              {BATCH_ROWS.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--color-surface-container-high)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{row.statusIcon === "done_all" ? "check_circle" : row.statusIcon === "navigation" ? "local_shipping" : "qr_code_2"}</span>
                      </div>
                      <div>
                        <span className="text-label-code" style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>{row.id}</span>
                        <p className="text-label-code" style={{ fontSize: 11, color: "var(--color-outline)" }}>{row.sealId}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--color-on-surface)" }}>{row.material}</span>
                    <p className="text-body-sm" style={{ color: "var(--color-on-surface-variant)" }}>{row.materialSub}</p>
                  </td>
                  <td>
                    <span className="text-headline-sm" style={{ fontWeight: 700 }}>{row.weight.toFixed(2)}</span>
                    <span className="text-label-code" style={{ color: "var(--color-outline)", fontWeight: 500, marginLeft: 4 }}>kg</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, color: "var(--color-on-surface)" }}>{row.recycler}</span>
                    <p className="text-label-code" style={{ fontSize: 11, color: "var(--color-outline)" }}>{row.facility}</p>
                  </td>
                  <td>
                    <span className={`tag ${row.statusStyle}`} style={{ textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {row.statusIcon && <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{row.statusIcon}</span>}
                      {row.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button type="button" className={`btn ${row.statusStyle === "tag-primary" ? "btn-primary" : "btn-secondary"}`} style={{ fontSize: 11 }}>{row.action}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-sm)", background: "var(--color-surface-container-low)", padding: "var(--space-sm)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-primary)" }}>cloud_done</span>
            <span className="text-label-code" style={{ color: "var(--color-on-surface-variant)", fontSize: 11 }}>Central Registry Block Height #8,912,410 • Timestamp Synchronized with MoEFCC CPCB Server</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <span className="text-label-code" style={{ fontSize: 11 }}>Total Consolidated: <strong style={{ color: "var(--color-on-surface)" }}>1,395.65 KG</strong></span>
            <span>•</span>
            <a href="#" className="text-label-code" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none", fontSize: 11 }}>Download Form-6 Ledger (PDF)</a>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
