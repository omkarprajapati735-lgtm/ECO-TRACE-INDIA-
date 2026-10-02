"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import DashboardShell from "@/components/DashboardShell";
import { ListTodo, Wallet, History, Bell, User, Settings } from "lucide-react";

/* ---------- Types ---------- */
interface NearbyJobItem {
  icon?: string;
  name: string;
  weight: string;
}

interface NearbyJob {
  id: string;
  distance: string;
  distanceKm?: number;
  time: string;
  area: string;
  items: NearbyJobItem[];
  customer: string;
  phone: string;
  slot: string;
  fee: number;
  estWeight: number;
  status: string;
}

interface WeighItem {
  name: string;
  detail: string;
  grade: string;
  gradeColor: string;
  weight: string;
  rate: string;
  value: string;
}

/* ---------- Static Data ---------- */
const FALLBACK_JOBS: NearbyJob[] = [
  {
    id: "PK-7821", distance: "2.5 km", time: "~8 min",
    area: "B-4/112, Pocket 4, Vasant Kunj, New Delhi",
    items: [
      { icon: "💻", name: "Laptop, Smartphone & Li-ion", weight: "~₹1,200" },
    ],
    customer: "Rohit Sharma", phone: "+91 98112-XXXXX",
    slot: "10:00 AM - 12:00 PM", fee: 1200, estWeight: 2.78,
    status: "ARRIVED",
  },
  {
    id: "PK-7824", distance: "4.1 km", time: "~15 min",
    area: "A-14, Green Park Extension, Hauz Khas",
    items: [
      { icon: "📺", name: "Old CRT Monitor & Inverter", weight: "Est. 18 kg" },
    ],
    customer: "Priya Mathur", phone: "+91 97XXX-XXXXX",
    slot: "Next in Queue", fee: 950, estWeight: 18,
    status: "ACCEPTED",
  },
  {
    id: "PK-7830", distance: "—", time: "4:00 PM",
    area: "Tower C, District Centre, Saket",
    items: [
      { icon: "🗄️", name: "Server Racks & Cabling", weight: "~65.0 kg" },
    ],
    customer: "GreenTech Coworking Hub", phone: "",
    slot: "4:00 PM today", fee: 3500, estWeight: 65,
    status: "BULK DISPATCH",
  },
];

const WEIGH_ITEMS: WeighItem[] = [
  {
    name: "ThinkPad T480 (Motherboard & Magnesium Chassis)",
    detail: "Category I: Information Technology & Telecom E-Waste",
    grade: "GRADE A", gradeColor: "var(--color-primary)",
    weight: "2.350 kg", rate: "₹250.00/kg", value: "₹587.50",
  },
  {
    name: "Mixed Smartphone Motherboards",
    detail: "PCB High-Yield Gold Wire Bonded (12 units aggregated)",
    grade: "GRADE S", gradeColor: "var(--color-secondary)",
    weight: "0.250 kg", rate: "₹400.00/kg", value: "₹100.00",
  },
  {
    name: "Secondary Li-ion Battery Cells",
    detail: "Hazmat Grade Class 9 Packaging Required",
    grade: "HAZMAT", gradeColor: "var(--color-tertiary)",
    weight: "0.180 kg", rate: "₹300.00/kg", value: "₹54.00",
  },
];

const ROUTE_STEPS = [
  { label: "Munirka DDA Flats", detail: "Completed 10:15 AM • 14.8 kg", status: "completed" as const },
  { label: "Malviya Nagar Market", detail: "Completed 12:40 PM • 28.0 kg", status: "completed" as const },
  { label: "Vasant Kunj (Active)", detail: "In Progress • ~2.78 kg", status: "active" as const },
  { label: "Saket District Centre", detail: "Upcoming 4:00 PM • ~65 kg", status: "upcoming" as const },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/* ---------- Component ---------- */
export default function CollectorDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<NearbyJob[]>(FALLBACK_JOBS);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchNearbyPickups = async () => {
    if (typeof window === "undefined" || !navigator.onLine) { setIsOnline(false); return; }
    setLoading(true);
    setConflictError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE_URL}/pickups/nearby`, {
        params: { lat: 28.4595, lng: 77.0266, radiusKm: 10 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 5000,
      });
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        interface RawNearbyPickup {
          id: string; distanceKm?: number; scheduledSlot: string;
          estimatedAmount: number;
          address?: { addressLine: string; city: string };
          consumer?: { fullName: string; phone: string };
          items?: Array<{ estimatedWeightKg: number; category?: { name: string } }>;
        }
        const mapped: NearbyJob[] = res.data.data.map((p: RawNearbyPickup) => {
          const totalWeight = (p.items || []).reduce((s: number, it) => s + (Number(it.estimatedWeightKg) || 0), 0);
          return {
            id: p.id, distance: `${p.distanceKm ?? 1.5} km`, distanceKm: p.distanceKm,
            time: `~${Math.round((p.distanceKm ?? 1.5) * 5)} min`,
            area: p.address ? `${p.address.addressLine}, ${p.address.city}` : "Gurugram, Haryana",
            items: (p.items || []).map((it) => ({ icon: "📦", name: it.category?.name || "E-Waste Scrap", weight: `${it.estimatedWeightKg} kg` })),
            customer: p.consumer?.fullName || "Verified Consumer",
            phone: p.consumer?.phone || "+91 98765-XXXXX",
            slot: p.scheduledSlot, fee: Math.round(Number(p.estimatedAmount) * 0.15) || 120,
            estWeight: Number(totalWeight.toFixed(1)), status: "ARRIVED",
          };
        });
        setJobs(mapped);
      }
    } catch { /* Retain fallback */ } finally { setLoading(false); }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const onOnline = () => { setIsOnline(true); void fetchNearbyPickups(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    void fetchNearbyPickups();
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  const handleClaimJob = async (jobId: string) => {
    setClaimingId(jobId); setConflictError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      await axios.patch(`${API_BASE_URL}/pickups/${jobId}/claim`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}, timeout: 6000,
      });
      startTransition(() => { router.push(`/collector/weigh-in/${jobId}`); });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setConflictError("Conflict: This pickup job was just claimed by another collector! Refreshing...");
        void fetchNearbyPickups();
      } else {
        startTransition(() => { router.push(`/collector/weigh-in/${jobId}`); });
      }
    } finally { setClaimingId(null); }
  };

  const collectorNav = [
    {
      section: "Collector",
      items: [
        { label: "Nearby Jobs", icon: <ListTodo size={18} />, href: "/collector/dashboard" },
        { label: "My Wallet", icon: <Wallet size={18} />, href: "/collector/wallet" },
        { label: "Job History", icon: <History size={18} />, href: "/collector/history" },
      ]
    },
    {
      section: "Account",
      items: [
        { label: "Notifications", icon: <Bell size={18} />, href: "/collector/notifications" },
        { label: "Profile", icon: <User size={18} />, href: "/collector/profile" },
        { label: "Settings", icon: <Settings size={18} />, href: "/collector/settings" },
      ]
    }
  ];

  return (
    <DashboardShell 
      navItems={collectorNav}
      activeRole="Collector" 
      userName="Suresh Kumar" 
      userRole="Field Collector (Zone 4)"
    >
      {/* Field Worker Status Header */}
      <section className="card" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-primary-container)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-on-primary-container)", fontSize: 20, fontWeight: 700 }}>SK</div>
            <span style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, background: "var(--color-primary)", borderRadius: "50%", border: "2px solid var(--color-surface-container-lowest)" }}></span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-xs)" }}>
              <h1 className="text-headline-md" style={{ color: "var(--color-on-surface)" }}>Suresh Kumar</h1>
              <span className="tag tag-surface">#GC-8842</span>
              <span className="tag tag-primary-container">Certified Field Collector</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-sm)" }}>
              <span className="text-body-sm" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-on-surface-variant)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-primary)" }}>location_on</span>
                South Delhi &amp; Saket Cluster (Zone 4)
              </span>
              <span style={{ color: "var(--color-outline-variant)" }}>•</span>
              <div className="tag tag-surface" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }}></span>
                <span className="text-label-code">{isOnline ? "Online • Auto-syncing" : "Offline Mode"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Metrics Ribbon */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-md)", background: "var(--color-surface-container-low)", padding: "var(--space-sm)", borderRadius: "var(--radius-lg)", flexShrink: 0 }}>
          <div style={{ padding: "0 var(--space-sm)" }}>
            <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-on-surface-variant)" }}>Collected Today</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
              <span className="text-headline-sm" style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>42.80</span>
              <span className="text-label-code" style={{ color: "var(--color-primary)", fontWeight: 600 }}>kg</span>
            </div>
            <span className="text-label-sm" style={{ color: "var(--color-outline)" }}>8 pickups done</span>
          </div>
          <div style={{ padding: "0 var(--space-sm)", background: "var(--color-surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
            <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-on-surface-variant)" }}>Disbursed UPI</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginTop: 2 }}>
              <span className="text-label-code" style={{ color: "var(--color-on-surface-variant)" }}>₹</span>
              <span className="text-headline-sm" style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>14,250</span>
            </div>
            <span className="text-label-sm" style={{ color: "var(--color-primary)", fontWeight: 500 }}>Auto-approved</span>
          </div>
          <div style={{ padding: "0 var(--space-sm)" }}>
            <span className="text-label-sm" style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-on-surface-variant)" }}>Wallet Balance</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginTop: 2 }}>
              <span className="text-label-code" style={{ color: "var(--color-primary)", fontWeight: 700 }}>₹</span>
              <span className="text-headline-sm" style={{ fontWeight: 700, color: "var(--color-primary)" }}>6,840</span>
            </div>
            <button type="button" className="text-label-sm" style={{ color: "var(--color-secondary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "none" }}>Instant Withdraw</button>
          </div>
        </div>
      </section>

      {conflictError && (
        <div className="alert-callout alert-callout-warning" style={{ alignItems: "center" }}>
          <div className="alert-callout-icon warning">
            <span className="material-symbols-outlined">report_problem</span>
          </div>
          <span className="text-body-md" style={{ color: "var(--color-on-surface)" }}>{conflictError}</span>
        </div>
      )}

      {/* Main 12-Column Grid: Queue + Weigh-In */}
      <div className="grid-12">
        {/* Left: Assigned Queue (4 cols) */}
        <div className="col-span-4" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--color-primary)", fontSize: 20 }}>assignment_turned_in</span>
              <h2 className="text-headline-sm">Assigned Queue ({jobs.length})</h2>
            </div>
            <span className="tag tag-surface-neutral">REALTIME</span>
          </div>

          {jobs.map((job, idx) => {
            const isActive = idx === 0;
            const statusTag = job.status === "ARRIVED"
              ? <span className="tag tag-primary-solid">ARRIVED</span>
              : job.status === "BULK DISPATCH"
              ? <span className="tag tag-tertiary">BULK DISPATCH</span>
              : <span className="tag tag-surface-neutral">{job.status}</span>;

            return (
              <div
                key={job.id}
                className="card card-compact"
                style={{
                  display: "flex", flexDirection: "column", gap: "var(--space-sm)",
                  opacity: isActive ? 1 : (idx === 1 ? 0.9 : 0.8),
                  transition: "opacity 0.2s",
                  ...(isActive ? { boxShadow: "0 0 0 2px var(--color-primary-container)" } : {}),
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.opacity = idx === 1 ? "0.9" : "0.8"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                    <span className="text-label-code" style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>#{job.id}</span>
                    {statusTag}
                  </div>
                  <span className="text-label-code" style={{ color: isActive ? "var(--color-primary)" : "var(--color-on-surface-variant)", fontWeight: 600 }}>{job.distance}</span>
                </div>
                <div>
                  <h3 className="text-headline-sm" style={{ color: "var(--color-on-surface)" }}>{job.customer}</h3>
                  <p className="text-body-sm" style={{ color: "var(--color-on-surface-variant)" }}>{job.area}</p>
                </div>
                <div style={{ padding: "var(--space-sm)", background: "var(--color-surface-container-low)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-outline)" }}>devices</span>
                    <span className="text-body-sm" style={{ fontWeight: 500 }}>{job.items.map(i => i.name).join(", ")}</span>
                  </div>
                  <span className="text-label-code" style={{ fontWeight: 700, color: isActive ? "var(--color-primary)" : "var(--color-outline)" }}>
                    {isActive ? `~₹${job.fee.toLocaleString("en-IN")}` : `Est. ${job.estWeight} kg`}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "var(--space-xs)" }}>
                  {job.phone ? (
                    <span className="text-label-sm" style={{ color: "var(--color-outline)", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>call</span>
                      {job.phone}
                    </span>
                  ) : (
                    <span className="text-label-sm" style={{ color: "var(--color-outline)" }}>Scheduled: {job.slot}</span>
                  )}
                  {isActive ? (
                    <span className="text-label-code" style={{ color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>scale</span>
                      Terminal Active
                    </span>
                  ) : idx === 1 ? (
                    <button type="button" className="text-label-sm" style={{ color: "var(--color-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Start Navigation</button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Inspection & Scale (8 cols) */}
        <div className="col-span-8" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {/* Bluetooth Scale Bar */}
          <div className="card card-compact" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--radius-lg)", background: "var(--color-surface-container-low)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>bluetooth_connected</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="text-headline-sm" style={{ color: "var(--color-on-surface)" }}>Digital Scale DS-400</span>
                  <span className="animate-pulse" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }}></span>
                </div>
                <span className="text-label-code" style={{ color: "var(--color-on-surface-variant)" }}>CPCB Verified Weigh-Sensor • Precision ±0.005 kg</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", background: "var(--color-surface-container-low)", padding: "var(--space-xs) var(--space-md)", borderRadius: "var(--radius-lg)" }}>
              <span className="text-label-sm" style={{ color: "var(--color-on-surface-variant)" }}>Live Scale Beam:</span>
              <span className="text-headline-md" style={{ color: "var(--color-primary)", fontWeight: 700 }}>2.780 kg</span>
              <span className="tag tag-primary" style={{ fontWeight: 700 }}>LOCKED</span>
            </div>
          </div>

          {/* Itemized Weighing Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "var(--space-md)", background: "var(--color-surface-container-low)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--color-primary)", fontSize: 20 }}>fact_check</span>
                <h3 className="text-headline-sm" style={{ color: "var(--color-on-surface)" }}>Itemized Weighing &amp; CPCB Rate Engine</h3>
              </div>
              <span className="text-label-code" style={{ color: "var(--color-on-surface-variant)" }}>JOB REF: PK-7821-DEL</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: "var(--space-md)" }}>Classification &amp; Component</th>
                    <th>Grade</th>
                    <th style={{ textAlign: "right" }}>Net Weight</th>
                    <th style={{ textAlign: "right" }}>Govt Base Rate</th>
                    <th style={{ textAlign: "right", paddingRight: "var(--space-md)" }}>Disbursal Value</th>
                  </tr>
                </thead>
                <tbody>
                  {WEIGH_ITEMS.map((item, i) => (
                    <tr key={i}>
                      <td style={{ paddingLeft: "var(--space-md)" }}>
                        <div className="text-body-md" style={{ fontWeight: 600 }}>{item.name}</div>
                        <div className="text-label-code" style={{ color: item.gradeColor === "var(--color-tertiary)" ? "var(--color-tertiary)" : "var(--color-outline)" }}>{item.detail}</div>
                      </td>
                      <td>
                        <span className="tag" style={{ background: "var(--color-surface-container-high)", color: item.gradeColor, fontWeight: 600 }}>{item.grade}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="text-body-md" style={{ fontWeight: 600 }}>{item.weight}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="text-body-sm" style={{ color: "var(--color-on-surface-variant)" }}>{item.rate}</span>
                      </td>
                      <td style={{ textAlign: "right", paddingRight: "var(--space-md)" }}>
                        <span className="text-body-md" style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>{item.value}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Total Bar */}
            <div style={{ background: "var(--color-surface-container-low)", padding: "var(--space-md)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="text-label-sm" style={{ textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>Aggregated Net Weight</span>
                  <span className="text-headline-sm" style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>2.780 kg</span>
                </div>
                <div style={{ height: 32, width: 1, background: "var(--color-outline-variant)" }}></div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="text-label-sm" style={{ textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>CPCB EPR Offset Credit</span>
                  <span className="text-label-code" style={{ color: "var(--color-primary)", fontWeight: 700 }}>+18.4 EPR Units</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)" }}>
                <span className="text-body-md" style={{ color: "var(--color-on-surface-variant)" }}>Consumer Payout Total:</span>
                <span className="text-metric-display" style={{ color: "var(--color-primary)", fontWeight: 700 }}>₹741.50</span>
              </div>
            </div>
          </div>

          {/* AI + Proof Camera Grid */}
          <div className="grid-12">
            {/* AI Classifier */}
            <div className="col-span-7 card card-compact" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "var(--space-sm)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--color-primary)", fontSize: 22 }}>smart_toy</span>
                  <div>
                    <h4 className="text-body-md" style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>AI Optical Classifier Active</h4>
                    <span className="text-label-code" style={{ color: "var(--color-primary)" }}>YOLO-v8 E-Waste Edge Model</span>
                  </div>
                </div>
                <span className="tag tag-primary" style={{ fontWeight: 700 }}>91% MATCH</span>
              </div>
              <p className="text-body-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                Camera analyzed motherboard circuit density and IC architecture: Classified as <strong style={{ color: "var(--color-on-surface)" }}>Grade A High-Value Substrate</strong>. Automatic government floor tariff matched.
              </p>
              <div className="tag" style={{ background: "var(--color-surface-container-low)", padding: "var(--space-xs)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-primary)" }}>verified</span>
                <span className="text-label-code" style={{ color: "var(--color-on-surface)" }}>Visual verification logged to immutable chain of custody</span>
              </div>
            </div>

            {/* Camera Preview */}
            <div className="col-span-5" style={{ position: "relative", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)", minHeight: 200, background: "linear-gradient(135deg, #1a2a1a, #0a1a0a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48 }}>photo_camera</span>
                <p className="text-body-sm" style={{ marginTop: 8 }}>Geotagged Proof Camera</p>
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent, rgba(0,0,0,0.3))", padding: "var(--space-sm)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="tag tag-error" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="animate-ping" style={{ width: 6, height: 6, background: "white", borderRadius: "50%", display: "inline-block" }}></span>
                    REC
                  </span>
                  <span className="text-label-code" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "2px 8px", borderRadius: "var(--radius-md)", color: "white" }}>28.5355° N, 77.1587° E</span>
                </div>
                <div>
                  <div className="text-label-code" style={{ fontWeight: 700, color: "white" }}>PROOF-STAMP-GEO-DELHI</div>
                  <div className="text-label-code" style={{ opacity: 0.8, color: "white" }}>2023-11-20 14:28:11 IST</div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Action Panel */}
          <div className="card card-compact" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-md)" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="text-label-sm" style={{ color: "var(--color-outline)" }}>Target Payout Destination</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-primary)" }}>account_balance_wallet</span>
                <span className="text-body-md" style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>rohit.sharma@okaxis (UPI)</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-sm)" }}>
              <button type="button" className="btn btn-secondary">Record Local / Hub Handoff</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleClaimJob(jobs[0]?.id || "PK-7821")}
                disabled={claimingId !== null}
                style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", transition: "transform 0.1s" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>bolt</span>
                {claimingId ? "Processing..." : "Confirm & Instant UPI Payout (₹741.50)"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Route & Transit Log */}
      <section className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-sm)" }}>
          <div>
            <h2 className="text-headline-md" style={{ color: "var(--color-on-surface)" }}>Today&apos;s Field Route &amp; Transit Log</h2>
            <p className="text-body-sm" style={{ color: "var(--color-on-surface-variant)" }}>Live telemetry, completed nodes, and nearest aggregation weigh-bridge</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
            <span className="text-label-code" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-on-surface)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-primary)" }}>route</span>
              Traversed: <strong>14.2 km</strong>
            </span>
            <span style={{ color: "var(--color-outline-variant)" }}>•</span>
            <span className="text-label-code" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-on-surface)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-tertiary)" }}>warehouse</span>
              Nearest Facility: <strong>Okhla Central Hub (3.8 km away)</strong>
            </span>
          </div>
        </div>

        <div className="grid-12" style={{ alignItems: "center" }}>
          {/* Route Map Placeholder */}
          <div className="col-span-8" style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)", position: "relative", height: 288, background: "linear-gradient(135deg, var(--color-surface-container-low), var(--color-surface-container))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, color: "var(--color-outline-variant)" }}>map</span>
            <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", padding: "var(--space-sm)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-primary)", boxShadow: "0 0 0 4px rgba(0,101,44,0.2)" }}></span>
                <span className="text-label-code" style={{ fontWeight: 600, color: "var(--color-on-surface)" }}>Active: PK-7821</span>
              </div>
              <div style={{ height: 16, width: 1, background: "var(--color-outline-variant)" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-outline)" }}></span>
                <span className="text-label-code" style={{ color: "var(--color-on-surface-variant)" }}>2 Pending Stops</span>
              </div>
              <div style={{ height: 16, width: 1, background: "var(--color-outline-variant)" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-tertiary)" }}></span>
                <span className="text-label-code" style={{ color: "var(--color-tertiary)", fontWeight: 700 }}>Okhla Hub Gate 2</span>
              </div>
            </div>
          </div>

          {/* Route Stepper */}
          <div className="col-span-4" style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {ROUTE_STEPS.map((step, i) => (
              <div key={i} className={`stepper-step ${step.status}`}>
                <div className={`stepper-circle ${step.status}`}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="text-body-md" style={{ fontWeight: step.status === "active" ? 700 : 600, color: "var(--color-on-surface)" }}>{step.label}</div>
                  <div className="text-label-code" style={{ color: step.status === "upcoming" ? "var(--color-outline)" : "var(--color-primary)", fontWeight: step.status === "active" ? 600 : 500 }}>{step.detail}</div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: step.status === "completed" ? "var(--color-primary)" : step.status === "active" ? "var(--color-primary)" : "var(--color-outline)" }}>
                  {step.status === "completed" ? "check_circle" : step.status === "active" ? "sync" : "schedule"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
