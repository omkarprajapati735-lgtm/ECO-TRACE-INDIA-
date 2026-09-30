"use client";

import { useState } from "react";
import { QrCode, Search, Check, AlertTriangle, Bell, Leaf } from "lucide-react";

interface ManifestItem {
  id: number;
  category: string;
  icon: string;
  count: number;
  claimedWeight: number;
  hasPhoto: boolean;
}

const manifestItems: ManifestItem[] = [
  { id: 1, category: "PCB High Grade", icon: "🔧", count: 8, claimedWeight: 12.4, hasPhoto: true },
  { id: 2, category: "Lithium Batteries", icon: "🔋", count: 15, claimedWeight: 24.5, hasPhoto: true },
  { id: 3, category: "Mixed Appliances", icon: "🏠", count: 12, claimedWeight: 32.1, hasPhoto: true },
  { id: 4, category: "Copper Cables", icon: "🔌", count: 6, claimedWeight: 15.5, hasPhoto: true },
];

const storageBins = [
  "Bin A-08: Mixed Metals",
  "Bin B-14: Lithium Cells",
  "Bin C-04: PCB Components",
  "Bin D-02: Copper & Cable",
];

export default function HubIntakePage() {
  const [hubWeight, setHubWeight] = useState("83.800");
  const [selectedBin, setSelectedBin] = useState(storageBins[1]);
  const [scanned, setScanned] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState<"IDLE" | "ACCEPTED" | "FLAGGED_DISCREPANCY">("IDLE");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const totalClaimed = manifestItems.reduce((sum, item) => sum + item.claimedWeight, 0);
  const hubWeightNum = parseFloat(hubWeight) || 0;
  const discrepancy = totalClaimed > 0 ? Math.abs(hubWeightNum - totalClaimed) / totalClaimed : 0;
  const discrepancyPct = (discrepancy * 100).toFixed(2);
  const isWithinTolerance = discrepancy <= 0.05;

  const handleVerifyLot = () => {
    if (isWithinTolerance) {
      setSubmissionStatus("ACCEPTED");
      setSubmissionMessage(`Lot verified successfully (${discrepancyPct}% discrepancy). Inventory added to ${selectedBin}, collector commission credited.`);
    } else {
      setSubmissionStatus("FLAGGED_DISCREPANCY");
      setSubmissionMessage(`Lot flagged for discrepancy (${discrepancyPct}% exceeds 5% limit). Payouts frozen and admin radar alert generated.`);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      {/* Top Nav */}
      <div className="nav-top" style={{ maxWidth: "100%", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Leaf size={20} color="var(--color-primary)" />
          <div>
            <span style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: 16 }}>Hub Operations Center</span>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginLeft: 8 }}>Gurugram Sector 18</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative" }}>
            <Bell size={20} color="var(--color-text-secondary)" />
            <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "var(--color-error)", color: "white", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-secondary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "var(--color-secondary)" }}>AV</div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Anil Verma</span>
          </div>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        {/* Status Feedback Banner */}
        {submissionStatus !== "IDLE" && (
          <div
            className={`card ${submissionStatus === "ACCEPTED" ? "status-success" : "status-error"}`}
            style={{ marginBottom: 20, padding: 16, display: "flex", alignItems: "center", gap: 12 }}
          >
            {submissionStatus === "ACCEPTED" ? (
              <Check size={24} color="var(--color-success)" />
            ) : (
              <AlertTriangle size={24} color="var(--color-error)" />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {submissionStatus === "ACCEPTED" ? "Lot Accepted into Hub Inventory" : "Lot Frozen: Discrepancy Exceeded 5%"}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                {submissionMessage}
              </div>
            </div>
          </div>
        )}

        {/* Scan Button */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button className="btn btn-primary btn-lg" onClick={() => setScanned(true)}>
            <QrCode size={18} /> Scan Collector QR Code
          </button>
          <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input className="input-field" placeholder="Search by Collector ID..." style={{ paddingLeft: 36 }} />
          </div>
        </div>

        {scanned && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Left Panel: Manifest */}
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "var(--color-primary)" }}>SK</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>Suresh Kumar - Scrap Dealer</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>#COL-4892 • Arrived: 2:35 PM, 29 Sep 2026</div>
                  </div>
                </div>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Category</th>
                      <th>Items</th>
                      <th>Claimed (kg)</th>
                      <th>Photo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifestItems.map((item, i) => (
                      <tr key={item.id}>
                        <td>{i + 1}</td>
                        <td><span style={{ marginRight: 6 }}>{item.icon}</span>{item.category}</td>
                        <td>{item.count}</td>
                        <td style={{ fontWeight: 600 }}>{item.claimedWeight.toFixed(3)}</td>
                        <td><Check size={14} color="var(--color-success)" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, padding: "8px 16px", background: "var(--color-canvas)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Total Claimed: {totalClaimed.toFixed(3)} kg</span>
                </div>
              </div>
            </div>

            {/* Right Panel: Verification */}
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Hub Scale Verification</h3>
                <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: "block" }}>Verified Hub Scale Weight (kg)</label>
                <input
                  type="number"
                  value={hubWeight}
                  onChange={(e) => setHubWeight(e.target.value)}
                  className="input-field input-weight"
                  step="0.001"
                />

                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8, fontFamily: "monospace" }}>
                    |{hubWeightNum.toFixed(3)} - {totalClaimed.toFixed(3)}| / {totalClaimed.toFixed(3)} = {discrepancyPct}%
                  </div>
                  <div className={isWithinTolerance ? "status-pill status-success" : "status-pill status-error"} style={{ fontSize: 14, padding: "8px 16px" }}>
                    {isWithinTolerance ? (
                      <><Check size={14} /> Within Tolerance (≤ 5% Rule) — PASSED</>
                    ) : (
                      <><AlertTriangle size={14} /> DISCREPANCY ALERT: Delta exceeds 5% — Supervisor required</>
                    )}
                  </div>
                </div>
              </div>

              {/* Simulated Alert */}
              <div style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--color-error-tint)", border: "2px dashed var(--color-error)", marginBottom: 16, fontSize: 13, color: "var(--color-error-text)" }}>
                <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                <strong>Alert Preview:</strong> If hub weight were 79.000 kg, delta = 6.51% (&gt;5%) — Supervisor sign-off required ⚠️
              </div>

              {/* Bin Assignment */}
              <div className="card">
                <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Assign Storage Bin</label>
                <select
                  value={selectedBin}
                  onChange={(e) => setSelectedBin(e.target.value)}
                  className="input-field"
                  style={{ height: 48, cursor: "pointer" }}
                >
                  {storageBins.map((bin) => (
                    <option key={bin} value={bin}>{bin}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {scanned && (
          <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => {
                setSubmissionStatus("FLAGGED_DISCREPANCY");
                setSubmissionMessage("Lot manually flagged for supervisory audit. Payout frozen.");
              }}
            >
              Flag for Manual Review
            </button>
            <button
              className="btn btn-primary btn-lg"
              disabled={!isWithinTolerance}
              onClick={handleVerifyLot}
            >
              <Check size={18} /> Accept & Verify Into Inventory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
