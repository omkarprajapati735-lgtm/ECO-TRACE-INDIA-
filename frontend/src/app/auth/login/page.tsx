"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, Globe, Eye, EyeOff, Lock, Phone, ArrowRight, CheckCircle2 } from "lucide-react";

type RoleType = "CONSUMER" | "COLLECTOR" | "HUB_MANAGER" | "RECYCLER" | "ADMIN";
type AuthStep = "role" | "phone" | "otp" | "email";

const roles: { value: RoleType; label: string; authType: "phone" | "email" }[] = [
  { value: "CONSUMER", label: "Consumer", authType: "phone" },
  { value: "COLLECTOR", label: "Collector", authType: "phone" },
  { value: "HUB_MANAGER", label: "Hub Manager", authType: "email" },
  { value: "RECYCLER", label: "Recycler", authType: "email" },
  { value: "ADMIN", label: "Admin", authType: "email" },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<RoleType>("CONSUMER");
  const [step, setStep] = useState<AuthStep>("role");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [countdown, setCountdown] = useState(42);

  const currentRole = roles.find((r) => r.value === selectedRole)!;
  const isPhoneAuth = currentRole.authType === "phone";

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSendOtp = () => {
    if (phoneNumber.length === 10) {
      setStep("otp");
      setCountdown(42);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {/* Language Toggle */}
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <button
          onClick={() => setLang(lang === "en" ? "hi" : "en")}
          style={{ fontSize: 12, padding: "4px 10px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)", background: "white", cursor: "pointer" }}
        >
          <Globe size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
          {lang === "en" ? "EN | हि" : "हि | EN"}
        </button>
      </div>

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: "var(--radius-lg)", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Leaf size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-headline)" }}>EcoTrace India</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>Verified E-Waste Recycling Platform</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Role Selector */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10, display: "block" }}>I am a...</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => { setSelectedRole(role.value); setStep("role"); }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: selectedRole === role.value ? "none" : "1px solid var(--color-border)",
                    background: selectedRole === role.value ? "var(--color-primary)" : "white",
                    color: selectedRole === role.value ? "white" : "var(--color-text-secondary)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone OTP Flow */}
          {isPhoneAuth && step !== "otp" && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: "block" }}>Mobile Number</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ height: 48, padding: "0 12px", display: "flex", alignItems: "center", background: "var(--color-canvas)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text-secondary)", flexShrink: 0 }}>
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="input-field"
                  style={{ flex: 1 }}
                />
              </div>
              <button
                onClick={handleSendOtp}
                className="btn btn-primary btn-xl"
                style={{ marginTop: 16 }}
                disabled={phoneNumber.length !== 10}
              >
                Send OTP <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* OTP Verification */}
          {isPhoneAuth && step === "otp" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Verify Your Number</h3>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  OTP sent to +91 {phoneNumber.slice(0, 5)}-XXXXX
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    style={{
                      width: 48,
                      height: 56,
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: 700,
                      border: digit ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      outline: "none",
                      background: "white",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; e.target.style.boxShadow = "0 0 0 2px rgba(5,150,105,0.15)"; }}
                    onBlur={(e) => { if (!digit) { e.target.style.borderColor = "var(--color-border)"; } e.target.style.boxShadow = "none"; }}
                  />
                ))}
              </div>
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
                Resend OTP in 0:{countdown.toString().padStart(2, "0")}
              </p>
              <Link href={selectedRole === "CONSUMER" ? "/consumer/dashboard" : "/collector/dashboard"}>
                <button className="btn btn-primary btn-xl">
                  Verify & Login <CheckCircle2 size={18} />
                </button>
              </Link>
              <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-muted)", marginTop: 12, cursor: "pointer" }}>
                Didn&apos;t receive OTP? <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>Resend via SMS</span>
              </p>
            </div>
          )}

          {/* Email / Password Flow */}
          {!isPhoneAuth && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: "block" }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                className="input-field"
                style={{ marginBottom: 14 }}
              />
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: "block" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field"
                  style={{ paddingRight: 44 }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Link href={
                selectedRole === "HUB_MANAGER" ? "/hub/dashboard" :
                selectedRole === "RECYCLER" ? "/recycler/dashboard" :
                "/admin/dashboard"
              }>
                <button className="btn btn-primary btn-xl" style={{ marginTop: 16 }}>
                  Login <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Trust */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Lock size={13} />
            Your data is protected under DPDP Act 2023
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 12 }}>
            New here?{" "}
            <Link href="/auth/register" style={{ color: "var(--color-primary)", fontWeight: 500, textDecoration: "none" }}>
              Register as Collector Partner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
