"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { CategoryItem, SavedAddress, bookingFormZodSchema } from "@/types/booking";
import { BookingStepItems } from "@/components/consumer/booking-step-items";
import { BookingStepSchedule } from "@/components/consumer/booking-step-schedule";
import { BookingStepReview } from "@/components/consumer/booking-step-review";

const defaultCategories: CategoryItem[] = [
  { id: "PCB_HIGH_GRADE", code: "PCB_HIGH_GRADE", name: "Old Phones & PCBs", iconName: "Smartphone", baseRate: 450, minRate: 400, maxRate: 600, description: "Gold-bearing phone & server boards" },
  { id: "DISPLAY_UNIT", code: "DISPLAY_UNIT", name: "Laptops & Displays", iconName: "Laptop", baseRate: 320, minRate: 280, maxRate: 420, description: "Laptops, monitors & all-in-ones" },
  { id: "LITHIUM_BATTERY", code: "LITHIUM_BATTERY", name: "Lithium Batteries", iconName: "Battery", baseRate: 110, minRate: 90, maxRate: 140, description: "Li-ion & polymer cells" },
  { id: "MIXED_APPLIANCE", code: "MIXED_APPLIANCE", name: "Home Appliances", iconName: "Home", baseRate: 35, minRate: 25, maxRate: 55, description: "Microwaves, mixers, small appliances" },
  { id: "METALS", code: "METALS", name: "Copper Scrap & Cables", iconName: "Wrench", baseRate: 280, minRate: 240, maxRate: 320, description: "Copper wiring, aluminum heat sinks" },
  { id: "PLASTIC_CASING", code: "PLASTIC_CASING", name: "Plastic Casings", iconName: "Cpu", baseRate: 18, minRate: 12, maxRate: 25, description: "ABS & high-impact polymer enclosures" },
];

const timeSlots = ["09:00 AM - 12:00 PM", "12:00 PM - 03:00 PM", "03:00 PM - 06:00 PM"];

const initialAddresses: SavedAddress[] = [
  { id: "addr-home", label: "Home", addressLine: "Flat 402, Tower B, Sector 45", city: "Gurugram", state: "Haryana", postalCode: "122003", latitude: 28.4595, longitude: 77.0266 },
  { id: "addr-office", label: "Office", addressLine: "Floor 5, DLF Cyber Hub, DLF Phase 2", city: "Gurugram", state: "Haryana", postalCode: "122002", latitude: 28.4986, longitude: 77.0878 },
];

export default function NewPickupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["PCB_HIGH_GRADE"]);
  const [weight, setWeight] = useState(8.5);
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddresses[0].id);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [scheduledSlot, setScheduledSlot] = useState(timeSlots[0]);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((c) => c !== id) : prev) : [...prev, id]
    );
  };

  const selectedCatObjects = defaultCategories.filter((c) => selectedCategories.includes(c.id));
  const avgBase = selectedCatObjects.reduce((acc, c) => acc + c.baseRate, 0) / (selectedCatObjects.length || 1);
  const avgMin = selectedCatObjects.reduce((acc, c) => acc + c.minRate, 0) / (selectedCatObjects.length || 1);
  const avgMax = selectedCatObjects.reduce((acc, c) => acc + c.maxRate, 0) / (selectedCatObjects.length || 1);

  const estimatedMin = Math.round(weight * avgMin);
  const estimatedMax = Math.round(weight * avgMax);
  const estimatedBase = Math.round(weight * avgBase);

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1 && selectedCategories.length === 0) {
      setErrorMsg("Please select at least one category to proceed");
      return;
    }
    setStep((prev) => Math.min(3, prev + 1));
  };

  const handleSubmitBooking = async () => {
    setErrorMsg(null);
    const validation = bookingFormZodSchema.safeParse({
      selectedCategories,
      totalWeightKg: weight,
      addressId: selectedAddressId,
      scheduledDate,
      scheduledSlot,
      notes: notes || undefined,
    });

    if (!validation.success) {
      setErrorMsg(validation.error.errors[0]?.message || "Validation failed");
      return;
    }

    setIsSubmitting(true);
    const pickupId = `PK-${Math.floor(1000 + Math.random() * 9000)}`;
    const chosenAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

    const pickupRecord = {
      id: pickupId,
      status: "REQUESTED" as const,
      scheduledDate,
      scheduledSlot,
      createdAt: new Date().toISOString(),
      estimatedAmount: estimatedBase,
      minEstimatedAmount: estimatedMin,
      maxEstimatedAmount: estimatedMax,
      finalAmount: null,
      doorstepOtp: String(Math.floor(1000 + Math.random() * 9000)),
      address: chosenAddress,
      collector: null,
      items: selectedCatObjects.map((c) => ({
        name: c.name,
        code: c.code,
        weightKg: Number((weight / selectedCatObjects.length).toFixed(1)),
        ratePerKg: c.baseRate,
        subtotal: Math.round((weight / selectedCatObjects.length) * c.baseRate),
      })),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(`ecotrace_pickup_${pickupId}`, JSON.stringify(pickupRecord));
    }

    router.push(`/consumer/pickups/${pickupId}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <header className="nav-top">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/consumer/dashboard" style={{ color: "var(--color-text-primary)", display: "flex" }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Book Doorstep Pickup</h1>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 120px" }}>
        {/* Stepper */}
        <div className="stepper" style={{ justifyContent: "center", marginBottom: 20 }}>
          {[{ num: 1, label: "Items" }, { num: 2, label: "Schedule" }, { num: 3, label: "Review" }].map((s, i) => (
            <div key={s.num} style={{ display: "flex", alignItems: "center" }}>
              <div className={`stepper-step ${step === s.num ? "active" : step > s.num ? "completed" : ""}`}>
                <div className="stepper-circle">{step > s.num ? <Check size={14} /> : s.num}</div>
                <span style={{ fontSize: 13 }}>{s.label}</span>
              </div>
              {i < 2 && <div className={`stepper-line ${step > s.num ? "completed" : ""}`} style={{ width: 40 }} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <BookingStepItems
            categories={defaultCategories}
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            weight={weight}
            onWeightChange={setWeight}
            estimatedMin={estimatedMin}
            estimatedMax={estimatedMax}
            estimatedBase={estimatedBase}
          />
        )}

        {step === 2 && (
          <BookingStepSchedule
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
            onAddNewAddress={(newAddr) => setAddresses((prev) => [newAddr, ...prev])}
            scheduledDate={scheduledDate}
            onDateChange={setScheduledDate}
            scheduledSlot={scheduledSlot}
            onSlotChange={setScheduledSlot}
            notes={notes}
            onNotesChange={setNotes}
            timeSlots={timeSlots}
          />
        )}

        {step === 3 && (
          <BookingStepReview
            categories={defaultCategories}
            selectedCategories={selectedCategories}
            weight={weight}
            selectedAddress={addresses.find((a) => a.id === selectedAddressId)}
            scheduledDate={scheduledDate}
            scheduledSlot={scheduledSlot}
            notes={notes}
            estimatedMin={estimatedMin}
            estimatedMax={estimatedMax}
            estimatedBase={estimatedBase}
            validationError={errorMsg}
          />
        )}
      </main>

      {/* Sticky Bottom Actions */}
      <footer className="sticky-bottom">
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          {step < 3 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, justifyContent: "center" }}>
              <ShieldCheck size={14} color="var(--color-primary)" />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                Guaranteed calibrated digital weighing at doorstep
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="btn btn-secondary" style={{ flex: 1 }}>
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={step === 1 && selectedCategories.length === 0}
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitBooking}
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Booking..." : "Confirm Booking"} <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
