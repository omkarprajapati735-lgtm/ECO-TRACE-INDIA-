"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, ArrowRight, ShieldCheck, Truck, Factory, User } from "lucide-react";

export default function RegisterPage() {
  const [role, setRole] = useState<"COLLECTOR" | "HUB_MANAGER" | "RECYCLER">("COLLECTOR");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9ff] px-6 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#00652c] shadow-lg">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-['Geist'] text-2xl font-bold tracking-tight text-[#0b1c30]">
            Join EcoTrace India
          </h1>
          <p className="mt-2 text-sm text-[#6f7a6e]">
            Register your business or collection operation
          </p>
        </div>

        <div className="rounded-2xl border border-[#becabc] bg-white p-6 shadow-sm sm:p-8">
          {/* Role Selection */}
          <div className="mb-6 space-y-3">
            <label className="text-sm font-medium text-[#0b1c30]">I am registering as a...</label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setRole("COLLECTOR")}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  role === "COLLECTOR" ? "border-[#00652c] bg-[#eff4ff] ring-1 ring-[#00652c]" : "border-[#becabc] hover:bg-gray-50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${role === "COLLECTOR" ? "bg-[#00652c] text-white" : "bg-gray-100 text-[#6f7a6e]"}`}>
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#0b1c30]">Collector Partner</div>
                  <div className="text-xs text-[#6f7a6e]">Field Agent, Scrap Dealer, Kabadiwala</div>
                </div>
              </button>

              <button
                onClick={() => setRole("HUB_MANAGER")}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  role === "HUB_MANAGER" ? "border-[#00652c] bg-[#eff4ff] ring-1 ring-[#00652c]" : "border-[#becabc] hover:bg-gray-50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${role === "HUB_MANAGER" ? "bg-[#00652c] text-white" : "bg-gray-100 text-[#6f7a6e]"}`}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#0b1c30]">Aggregation Hub</div>
                  <div className="text-xs text-[#6f7a6e]">Regional collection and dispatch center</div>
                </div>
              </button>

              <button
                onClick={() => setRole("RECYCLER")}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  role === "RECYCLER" ? "border-[#00652c] bg-[#eff4ff] ring-1 ring-[#00652c]" : "border-[#becabc] hover:bg-gray-50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${role === "RECYCLER" ? "bg-[#00652c] text-white" : "bg-gray-100 text-[#6f7a6e]"}`}>
                  <Factory className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#0b1c30]">Formal Recycler</div>
                  <div className="text-xs text-[#6f7a6e]">CPCB Authorized dismantling/recycling facility</div>
                </div>
              </button>
            </div>
          </div>

          <form className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0b1c30]">Full Name / Contact Person</label>
              <input type="text" className="w-full rounded-lg border border-[#becabc] px-3 py-2 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]" placeholder="John Doe" />
            </div>

            {role !== "COLLECTOR" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0b1c30]">Company Name</label>
                <input type="text" className="w-full rounded-lg border border-[#becabc] px-3 py-2 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]" placeholder="ABC Scrap Traders" />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0b1c30]">Mobile Number</label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-[#becabc] bg-gray-50 px-3 text-sm text-[#6f7a6e]">+91</span>
                <input type="tel" className="w-full rounded-r-lg border border-[#becabc] px-3 py-2 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]" placeholder="98765 43210" />
              </div>
            </div>

            {role !== "COLLECTOR" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0b1c30]">Email Address</label>
                <input type="email" className="w-full rounded-lg border border-[#becabc] px-3 py-2 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]" placeholder="contact@company.com" />
              </div>
            )}

            {role === "RECYCLER" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0b1c30]">CPCB License Number (Optional for now)</label>
                <input type="text" className="w-full rounded-lg border border-[#becabc] px-3 py-2 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]" placeholder="E-WASTE/REG/..." />
              </div>
            )}

            <button type="button" className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00652c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00652c]/90">
              Continue to Verification <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-[#6f7a6e]">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-[#00652c] hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
