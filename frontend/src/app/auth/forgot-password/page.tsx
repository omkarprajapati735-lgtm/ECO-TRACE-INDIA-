"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, ArrowRight, ShieldAlert } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9ff] px-6 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#00652c] shadow-lg">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-['Geist'] text-2xl font-bold tracking-tight text-[#0b1c30]">
            Recover Account
          </h1>
          <p className="mt-2 text-sm text-[#6f7a6e]">
            Enter your email or mobile number to receive a reset link/OTP.
          </p>
        </div>

        <div className="rounded-2xl border border-[#becabc] bg-white p-6 shadow-sm sm:p-8">
          {!submitted ? (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0b1c30]">Email or Mobile Number</label>
                <input 
                  type="text" 
                  required
                  className="w-full rounded-lg border border-[#becabc] px-3 py-2 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]" 
                  placeholder="name@company.com or 9876543210" 
                />
              </div>

              <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00652c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00652c]/90">
                Send Recovery Instructions <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d3ffd5]">
                <ShieldAlert className="h-8 w-8 text-[#00652c]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-[#0b1c30]">Check Your Inbox/SMS</h3>
              <p className="text-sm text-[#6f7a6e]">
                If an account exists with that information, we have sent instructions to reset your password.
              </p>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-[#6f7a6e]">
          Remember your password?{" "}
          <Link href="/auth/login" className="font-semibold text-[#00652c] hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
