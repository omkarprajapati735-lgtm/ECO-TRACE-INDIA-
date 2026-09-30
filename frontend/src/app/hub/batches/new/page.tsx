"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, QrCode, Check, Printer, Shield } from "lucide-react";

const inventory = [
  { id: "PCB_HIGH_GRADE", name: "High Grade PCB", available: 350.2, bin: "Bin C-04" },
  { id: "LITHIUM_BATTERY", name: "Lithium Battery Cells", available: 420.5, bin: "Bin B-14" },
  { id: "MIXED_APPLIANCE", name: "Mixed Appliance Scrap", available: 185.8, bin: "Bin A-08" },
  { id: "METALS", name: "Copper Wire & Cable", available: 92.4, bin: "Bin D-02" },
];

const recyclers = [
  "EcoTech Metallurgical Solutions (CPCB Reg: R-8821)",
  "GreenMetal Refinery Pvt Ltd (CPCB Reg: R-6432)",
  "PureRecycle India (CPCB Reg: R-9104)",
];

export default function NewBatchPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>(["PCB_HIGH_GRADE", "LITHIUM_BATTERY"]);
  const [batchWeight, setBatchWeight] = useState("400.000");
  const [sealId, setSealId] = useState("SL-8831");
  const [selectedRecycler, setSelectedRecycler] = useState(recyclers[0]);
  const [vehicleNo, setVehicleNo] = useState("KA-01-AB-1234");
  const [batchStatus, setBatchStatus] = useState<"DRAFT" | "SEALED">("DRAFT");
  const [batchCode] = useState("BATCH-2026-BLR-089");
  const [batchId] = useState("b4d21e89-6b45-4df3-bc42-fa0184e1b592");

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSealBatch = () => {
    setBatchStatus("SEALED");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <div className="nav-top" style={{ maxWidth: "100%", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/hub/dashboard" style={{ color: "var(--color-text-primary)", display: "flex" }}><ArrowLeft size={20} /></Link>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Batch Consolidation & QR Manifest</h1>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        {/* Batch Header */}
        <div className="card card-compact" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Package size={24} color="var(--color-sealed)" />
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>{batchCode}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Created: 29 Sep 2026, 4:15 PM • Gurugram Sector 18 Hub</div>
            </div>
          </div>
          <span className={batchStatus === "SEALED" ? "status-pill status-success" : "status-pill status-pending"}>
            {batchStatus}
          </span>
        </div>

        {/* 3-Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {/* Left: Available Inventory */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Available Inventory</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {inventory.map((item) => {
                const selected = selectedItems.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className="card card-compact"
                    style={{
                      border: selected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      background: selected ? "var(--color-primary-light)" : "white",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{item.bin}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="status-pill status-success" style={{ fontSize: 12 }}>{item.available.toFixed(1)} kg</span>
                      {selected && <Check size={16} color="var(--color-primary)" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: Batch Configuration */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Batch Configuration</h3>
            <div className="card">
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: "block" }}>Batch Net Weight (kg)</label>
              <input type="number" value={batchWeight} onChange={(e) => setBatchWeight(e.target.value)} className="input-field" style={{ fontWeight: 700, fontSize: 18, marginBottom: 14 }} step="0.001" disabled={batchStatus === "SEALED"} />

              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: "block" }}>Tamper Seal ID</label>
              <input value={sealId} onChange={(e) => setSealId(e.target.value)} className="input-field" style={{ fontFamily: "monospace", marginBottom: 14 }} disabled={batchStatus === "SEALED"} />

              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: "block" }}>Destination Recycler</label>
              <select value={selectedRecycler} onChange={(e) => setSelectedRecycler(e.target.value)} className="input-field" style={{ cursor: "pointer", marginBottom: 14 }} disabled={batchStatus === "SEALED"}>
                {recyclers.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-success)" }}>
                <Shield size={12} /> CPCB Verified
              </div>

              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: "block", marginTop: 14 }}>Transport Vehicle No.</label>
              <input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="input-field" style={{ fontFamily: "monospace" }} disabled={batchStatus === "SEALED"} />
            </div>
          </div>

          {/* Right: QR Manifest Preview */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>QR Manifest Preview</h3>
            <div className="card" style={{ textAlign: "center" }}>
              <div className="qr-code-container" style={{ marginBottom: 16 }}>
                <div style={{ width: 180, height: 180, background: "var(--color-canvas)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--color-border)", margin: "0 auto" }}>
                  <QrCode size={80} color="var(--color-text-primary)" />
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{batchCode}</div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--color-primary)", marginBottom: 8 }}>
                ecotrace://batch/{batchId}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8 }}>
                {selectedItems.length} categories, {batchWeight} kg, sealed with {sealId}
              </div>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--color-text-muted)", marginBottom: 16, wordBreak: "break-all" }}>
                SHA-256: a1b2c3d4e5f6890123456789abcdef0123456789abcdef0123456789abcdef01
              </div>

              <button
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: 8 }}
                onClick={handleSealBatch}
                disabled={batchStatus === "SEALED" || selectedItems.length === 0}
              >
                <Package size={16} /> {batchStatus === "SEALED" ? "Batch Sealed & Verified" : "Seal Batch & Generate Manifest"}
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: "100%" }}
                onClick={handlePrint}
                disabled={batchStatus !== "SEALED"}
              >
                <Printer size={16} /> Print Shipping Label
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
