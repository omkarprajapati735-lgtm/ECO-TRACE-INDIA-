"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { PickupTrackerData, TrackerStage } from "@/types/booking";
import { PickupTrackerTimeline } from "@/components/consumer/pickup-tracker-timeline";
import { PickupTrackerCollector } from "@/components/consumer/pickup-tracker-collector";

const defaultPickupData: PickupTrackerData = {
  id: "PK-4029",
  status: "ASSIGNED",
  scheduledDate: "Today, 10:00 AM",
  scheduledSlot: "09:00 AM - 12:00 PM",
  createdAt: new Date().toISOString(),
  estimatedAmount: 680,
  minEstimatedAmount: 580,
  maxEstimatedAmount: 790,
  finalAmount: null,
  doorstepOtp: "4029",
  address: {
    addressLine: "Flat 402, Tower B, Sector 45",
    city: "Gurugram",
    state: "Haryana",
    postalCode: "122003",
    latitude: 28.4595,
    longitude: 77.0266,
  },
  collector: {
    fullName: "Ramesh Kumar",
    phone: "+91 98765 43210",
    rating: 4.9,
    totalTrips: 184,
    vehicleNumber: "HR-26-EK-4029",
    isVerified: true,
  },
  items: [
    { name: "Laptops & Displays", code: "DISPLAY_UNIT", weightKg: 4.0, ratePerKg: 320, subtotal: 1280 },
    { name: "Lithium Batteries", code: "LITHIUM_BATTERY", weightKg: 1.5, ratePerKg: 110, subtotal: 165 },
  ],
};

function getStatusPillClass(status: TrackerStage) {
  switch (status) {
    case "REQUESTED": return "status-pill status-pending";
    case "ASSIGNED": return "status-pill status-info";
    case "COLLECTOR_ARRIVED": return "status-pill status-info";
    case "COLLECTED": return "status-pill status-success";
    case "COMPLETED": return "status-pill status-success";
    default: return "status-pill";
  }
}

export default function PickupStatusPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id || "PK-4029";
  const [pickup, setPickup] = useState<PickupTrackerData>(defaultPickupData);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`ecotrace_pickup_${id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as PickupTrackerData;
          setPickup(parsed);
        } catch {
          // fallback to default
        }
      } else {
        setPickup((prev) => ({ ...prev, id }));
      }
    }
  }, [id]);

  const handleAdvanceStage = (stage: TrackerStage) => {
    setPickup((prev) => {
      const updated: PickupTrackerData = {
        ...prev,
        status: stage,
        finalAmount: stage === "COLLECTED" || stage === "COMPLETED" ? prev.estimatedAmount : null,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(`ecotrace_pickup_${id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      {/* Top Bar */}
      <header className="nav-top">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/consumer/dashboard" style={{ color: "var(--color-text-primary)", display: "flex" }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Pickup #{pickup.id}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Doorstep Reverse Logistics</div>
          </div>
        </div>
        <span className={getStatusPillClass(pickup.status)}>{pickup.status.replace("_", " ")}</span>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Progress Tracker */}
        <PickupTrackerTimeline currentStatus={pickup.status} onAdvanceStage={handleAdvanceStage} />

        {/* Collector Profile & OTP */}
        <PickupTrackerCollector pickup={pickup} />

        {/* Scrap Items & Payout Breakdown */}
        <section className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Scrap Items Breakdown</h3>
            <span style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>Fair Price Guarantee</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pickup.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    {item.weightKg} kg × ₹{item.ratePerKg}/kg
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>
                  ₹{item.subtotal.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {pickup.finalAmount ? "Final Verified Payout:" : "Estimated Payout Range:"}
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--color-primary)" }}>
              {pickup.finalAmount
                ? `₹${pickup.finalAmount.toLocaleString("en-IN")}`
                : `₹${pickup.minEstimatedAmount.toLocaleString("en-IN")} - ₹${pickup.maxEstimatedAmount.toLocaleString("en-IN")}`}
            </span>
          </div>
        </section>

        {/* Address & Logistics Card */}
        <section className="card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Logistics & Coordinates</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--color-text-secondary)" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <MapPin size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div>{pickup.address.addressLine}, {pickup.address.city}, {pickup.address.state} - {pickup.address.postalCode}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                  GPS: {pickup.address.latitude.toFixed(4)}, {pickup.address.longitude.toFixed(4)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Clock size={16} color="var(--color-primary)" />
              <span>{pickup.scheduledDate} • {pickup.scheduledSlot}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Actions */}
      <footer className="sticky-bottom">
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", gap: 10 }}>
          <Link href="/consumer/dashboard" style={{ flex: 1, textDecoration: "none" }}>
            <button className="btn btn-secondary" style={{ width: "100%" }}>
              Back to Dashboard
            </button>
          </Link>
          <Link href="/consumer/pickups/new" style={{ flex: 1, textDecoration: "none" }}>
            <button className="btn btn-primary" style={{ width: "100%" }}>
              Book Another
            </button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
