"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Leaf, Bell, AlertTriangle, CheckCircle2, XCircle, ArrowLeft,
  Filter, ShieldAlert, Scale, RefreshCw, FileText
} from "lucide-react";
import { toast } from "sonner";

interface DiscrepancyItem {
  id: string;
  date: string;
  collectorName: string;
  collectorPhone: string;
  hubName: string;
  claimedWeightKg: number;
  verifiedWeightKg: number;
  variancePercent: number;
  status: "FLAGGED_DISCREPANCY" | "DELIVERED_TO_HUB" | "CANCELLED";
  notes?: string;
}

const initialDiscrepancies: DiscrepancyItem[] = [
  {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
    date: "Today, 14:20",
    collectorName: "Suresh Kumar",
    collectorPhone: "+91 98765 43210",
    hubName: "Gurugram Central Hub",
    claimedWeightKg: 100.0,
    verifiedWeightKg: 108.5,
    variancePercent: 8.5,
    status: "FLAGGED_DISCREPANCY",
    notes: "High moisture content suspected in bulk PCB lot",
  },
  {
    id: "b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e",
    date: "Yesterday, 17:45",
    collectorName: "Vikram Scrap Solutions",
    collectorPhone: "+91 98765 43211",
    hubName: "South Delhi Aggregation Hub",
    claimedWeightKg: 250.0,
    verifiedWeightKg: 265.5,
    variancePercent: 6.2,
    status: "FLAGGED_DISCREPANCY",
    notes: "Lead-acid battery weight discrepancy on platform scale",
  },
  {
    id: "c3d4e5f6-a1b2-4c3d-ae4f-5a6b7c8d9e0f",
    date: "27 Sep, 11:10",
    collectorName: "Arun Patel",
    collectorPhone: "+91 98765 43212",
    hubName: "Noida Sector 62 Hub",
    claimedWeightKg: 75.0,
    verifiedWeightKg: 81.2,
    variancePercent: 8.3,
    status: "FLAGGED_DISCREPANCY",
    notes: "Mixed appliances lot with broken casing stones",
  },
];

export default function FraudRadarPage() {
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>(initialDiscrepancies);
  const [selectedLot, setSelectedLot] = useState<DiscrepancyItem | null>(null);
  const [resolutionAction, setResolutionAction] = useState<"APPROVE" | "FORFEIT" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = (lot: DiscrepancyItem, action: "APPROVE" | "FORFEIT") => {
    setSelectedLot(lot);
    setResolutionAction(action);
    setAdminNotes(action === "APPROVE" ? "Approved after supervisor physical re-inspection." : "Forfeited due to material adulteration.");
  };

  const handleConfirmResolve = async () => {
    if (!selectedLot || !resolutionAction) return;
    setIsSubmitting(true);

    try {
      // Simulate backend resolution or live patch
      await new Promise((r) => setTimeout(r, 400));
      setDiscrepancies((prev) =>
        prev.map((item) =>
          item.id === selectedLot.id
            ? {
                ...item,
                status: resolutionAction === "APPROVE" ? "DELIVERED_TO_HUB" : "CANCELLED",
                notes: adminNotes,
              }
            : item
        )
      );

      toast.success(
        `Lot ${selectedLot.id.slice(0, 8)} ${resolutionAction === "APPROVE" ? "Approved & Admitted" : "Forfeited"}`
      );
      setSelectedLot(null);
      setResolutionAction(null);
    } catch {
      toast.error("Failed to submit resolution. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      {/* Top Bar */}
      <div className="nav-top" style={{ maxWidth: "100%", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={18} />
          </Link>
          <Leaf size={20} color="var(--color-primary)" />
          <span style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: 16 }}>Discrepancy & Fraud Radar</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Threshold: &gt; 5.0% Variance</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "var(--color-primary)" }}>RM</div>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {/* KPI Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="metric-card">
            <div className="metric-label">Active Discrepancies</div>
            <div className="metric-value" style={{ color: "var(--color-error)" }}>
              {discrepancies.filter((d) => d.status === "FLAGGED_DISCREPANCY").length} Lots
            </div>
            <div className="metric-trend" style={{ color: "var(--color-text-muted)" }}>Auto-locked payouts</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Avg Variance Over Target</div>
            <div className="metric-value" style={{ color: "var(--color-pending)" }}>+7.67%</div>
            <div className="metric-trend" style={{ color: "var(--color-error)" }}>Above 5.0% threshold</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Frozen Value (Estimated)</div>
            <div className="metric-value" style={{ color: "var(--color-primary)" }}>₹42,850</div>
            <div className="metric-trend" style={{ color: "var(--color-success)" }}>Protected from loss</div>
          </div>
        </div>

        {/* Radar Table */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldAlert size={18} color="var(--color-error)" />
              High-Priority Flagged Weigh-In Lots
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 12px", display: "flex", alignItems: "center", gap: 4 }}>
                <RefreshCw size={12} /> Refresh Live Feed
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", minWidth: 800 }}>
              <thead>
                <tr>
                  <th>Lot ID</th>
                  <th>Date</th>
                  <th>Collector</th>
                  <th>Hub Facility</th>
                  <th>Claimed vs Verified</th>
                  <th>Variance</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Governance Action</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>
                      #{item.id.slice(0, 8)}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{item.date}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.collectorName}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{item.collectorPhone}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{item.hubName}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{item.claimedWeightKg} kg <span style={{ color: "var(--color-text-muted)" }}>claimed</span></div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-error)" }}>{item.verifiedWeightKg} kg <span style={{ fontWeight: 400 }}>scale</span></div>
                    </td>
                    <td>
                      <span className="status-pill status-error" style={{ fontWeight: 700 }}>
                        +{item.variancePercent}%
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${item.status === "FLAGGED_DISCREPANCY" ? "status-error" : item.status === "DELIVERED_TO_HUB" ? "status-success" : "status-pending"}`}>
                        {item.status === "FLAGGED_DISCREPANCY" ? "FROZEN" : item.status === "DELIVERED_TO_HUB" ? "APPROVED" : "FORFEITED"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {item.status === "FLAGGED_DISCREPANCY" ? (
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ height: 28, fontSize: 11, padding: "0 8px", background: "var(--color-success-tint)", color: "var(--color-success-text)", border: "1px solid var(--color-success)" }}
                            onClick={() => handleOpenModal(item, "APPROVE")}
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ height: 28, fontSize: 11, padding: "0 8px", background: "var(--color-error-tint)", color: "var(--color-error-text)", border: "1px solid var(--color-error)" }}
                            onClick={() => handleOpenModal(item, "FORFEIT")}
                          >
                            <XCircle size={12} /> Forfeit
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Resolution Dialog Modal */}
      {selectedLot && resolutionAction && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ maxWidth: 480, width: "100%", padding: 24, boxShadow: "var(--shadow-xl)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              {resolutionAction === "APPROVE" ? <CheckCircle2 size={20} color="var(--color-success)" /> : <XCircle size={20} color="var(--color-error)" />}
              {resolutionAction === "APPROVE" ? "Approve Lot into Hub Inventory" : "Forfeit & Void Discrepant Lot"}
            </h3>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
              Lot #{selectedLot.id.slice(0, 8)} ({selectedLot.collectorName}) has {selectedLot.variancePercent}% variance.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Audit Resolution Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                style={{ width: "100%", minHeight: 80, padding: 8, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", fontSize: 13, resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLot(null)} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: resolutionAction === "APPROVE" ? "var(--color-primary)" : "var(--color-error)" }}
                onClick={handleConfirmResolve}
                disabled={isSubmitting || adminNotes.trim().length < 3}
              >
                {isSubmitting ? "Processing..." : `Confirm ${resolutionAction === "APPROVE" ? "Approval" : "Forfeiture"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
