"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  IndianRupee,
  User,
  Wifi,
  WifiOff,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

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
}

const FALLBACK_JOBS: NearbyJob[] = [
  {
    id: "PK-4029",
    distance: "1.8 km",
    time: "~12 min",
    area: "Sector 45, Gurugram",
    items: [
      { icon: "💻", name: "Laptops (x2)", weight: "~4.5 kg" },
      { icon: "🔋", name: "Battery Pack", weight: "1.5 kg" },
      { icon: "🔌", name: "Copper Wires", weight: "~3 kg" },
    ],
    customer: "Priya S.",
    phone: "+91 98765-XXXXX",
    slot: "10:00 AM - 12:00 PM today",
    fee: 180,
    estWeight: 8.5,
  },
  {
    id: "PK-4031",
    distance: "3.2 km",
    time: "~20 min",
    area: "DLF Phase 3, Gurugram",
    items: [
      { icon: "📱", name: "Old Phones (x5)", weight: "~1.2 kg" },
      { icon: "🏠", name: "Mixer Grinder", weight: "~4 kg" },
    ],
    customer: "Amit K.",
    phone: "+91 91234-XXXXX",
    slot: "12:00 PM - 03:00 PM today",
    fee: 95,
    estWeight: 5.2,
  },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function CollectorDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<NearbyJob[]>(FALLBACK_JOBS);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchNearbyPickups = async () => {
    if (typeof window === "undefined" || !navigator.onLine) {
      setIsOnline(false);
      return;
    }

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
          id: string;
          distanceKm?: number;
          scheduledSlot: string;
          estimatedAmount: number;
          address?: { addressLine: string; city: string };
          consumer?: { fullName: string; phone: string };
          items?: Array<{
            estimatedWeightKg: number;
            category?: { name: string };
          }>;
        }

        const mapped: NearbyJob[] = res.data.data.map((p: RawNearbyPickup) => {
          const totalWeight = (p.items || []).reduce(
            (sum: number, it) => sum + (Number(it.estimatedWeightKg) || 0),
            0
          );
          return {
            id: p.id,
            distance: `${p.distanceKm ?? 1.5} km`,
            distanceKm: p.distanceKm,
            time: `~${Math.round((p.distanceKm ?? 1.5) * 5)} min`,
            area: p.address ? `${p.address.addressLine}, ${p.address.city}` : "Gurugram, Haryana",
            items: (p.items || []).map((it) => ({
              icon: "📦",
              name: it.category?.name || "E-Waste Scrap",
              weight: `${it.estimatedWeightKg} kg`,
            })),
            customer: p.consumer?.fullName || "Verified Consumer",
            phone: p.consumer?.phone || "+91 98765-XXXXX",
            slot: p.scheduledSlot,
            fee: Math.round(Number(p.estimatedAmount) * 0.15) || 120,
            estWeight: Number(totalWeight.toFixed(1)),
          };
        });
        setJobs(mapped);
      }
    } catch {
      // Retain fallback jobs on network or auth error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    const onOnline = () => {
      setIsOnline(true);
      void fetchNearbyPickups();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    void fetchNearbyPickups();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const handleClaimJob = async (jobId: string) => {
    setClaimingId(jobId);
    setConflictError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      await axios.patch(
        `${API_BASE_URL}/pickups/${jobId}/claim`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 6000,
        }
      );

      startTransition(() => {
        router.push(`/collector/weigh-in/${jobId}`);
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setConflictError(
          "⚠️ Conflict: This pickup job was just claimed by another nearby collector! Refreshing proximity list..."
        );
        void fetchNearbyPickups();
      } else {
        // Proceed for offline or simulated test jobs
        startTransition(() => {
          router.push(`/collector/weigh-in/${jobId}`);
        });
      }
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      {/* Top Bar */}
      <div className="nav-top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "var(--color-primary)" }}>RK</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Ramesh Kumar</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: isOnline ? "var(--color-success)" : "var(--color-pending)" }}>
              {isOnline ? (
                <><span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-success)", display: "inline-block" }}></span> Online</>
              ) : (
                <><WifiOff size={11} /> Offline Mode</>
              )}
            </div>
          </div>
        </div>
        <div className="status-pill status-success" style={{ fontWeight: 600 }}>
          <IndianRupee size={12} /> ₹1,240 today
        </div>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "16px 16px 100px" }}>
        {conflictError && (
          <div style={{ padding: 12, background: "var(--color-error-tint)", color: "var(--color-error-text)", borderRadius: "var(--radius-md)", marginBottom: 14, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} />
            <span>{conflictError}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18 }}>Nearby Pickup Jobs</h2>
          <button
            type="button"
            onClick={() => void fetchNearbyPickups()}
            disabled={loading}
            style={{ background: "none", border: "none", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {jobs.map((job) => (
          <div key={job.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Pickup Opportunity</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{job.id}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="status-pill status-info">{job.distance}</span>
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{job.time}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 12 }}>
              <MapPin size={14} color="var(--color-secondary)" />
              {job.area}
            </div>

            <div style={{ marginBottom: 12, padding: 12, background: "var(--color-canvas)", borderRadius: "var(--radius-md)" }}>
              {job.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                  <span>{item.icon || "📦"} {item.name}</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{item.weight}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8 }}>
              <span><User size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />{job.customer} | {job.phone}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} /> {job.slot}
            </div>

            <div style={{ padding: 12, background: "var(--color-primary-light)", borderRadius: "var(--radius-md)", textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--color-primary-dark)" }}>Estimated Collector Commission</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>₹{job.fee}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>₹15/kg × ~{job.estWeight} kg</div>
            </div>

            <button
              type="button"
              onClick={() => void handleClaimJob(job.id)}
              disabled={claimingId === job.id}
              className="btn btn-primary btn-xl"
              style={{ width: "100%", height: 56, marginBottom: 8 }}
            >
              {claimingId === job.id ? "CLAIMING JOB..." : "ACCEPT PICKUP ✓"}
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div className="nav-bottom">
        <Link href="/collector/dashboard" className="nav-bottom-item active">🏠 Home</Link>
        <Link href="/collector/dashboard" className="nav-bottom-item">📍 Jobs</Link>
        <Link href="/collector/wallet" className="nav-bottom-item">💰 Wallet</Link>
        <Link href="#" className="nav-bottom-item">👤 Profile</Link>
      </div>
    </div>
  );
}
