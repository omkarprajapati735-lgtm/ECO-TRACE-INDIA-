"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Leaf, Globe, Eye, EyeOff, Lock, Phone, ArrowRight, Mail } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";

type RoleType = "CONSUMER" | "COLLECTOR" | "HUB_MANAGER" | "RECYCLER" | "ADMIN";
type AuthStep = "role" | "phone" | "otp" | "email";

const roles: { value: RoleType; label: string; authType: "phone" | "email" }[] = [
  { value: "CONSUMER", label: "Consumer", authType: "phone" },
  { value: "COLLECTOR", label: "Collector", authType: "phone" },
  { value: "HUB_MANAGER", label: "Hub Manager", authType: "email" },
  { value: "RECYCLER", label: "Recycler", authType: "email" },
  { value: "ADMIN", label: "Admin", authType: "email" },
];

const loginSchema = z.object({
  identifier: z.string().min(3, "Email or Phone is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [selectedRole, setSelectedRole] = useState<RoleType>("CONSUMER");
  const [step, setStep] = useState<AuthStep>("role");
  
  // Phone/OTP state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  // Email/Password state
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [countdown, setCountdown] = useState(42);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

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

  const handleSendOtp = async () => {
    if (phoneNumber.length === 10) {
      setIsSendingOtp(true);
      try {
        await apiClient.post("/auth/send-otp", { phone: phoneNumber });
        toast.success("OTP Sent Successfully");
        setStep("otp");
        setCountdown(60);
      } catch (err) {
        // Error toast handled by apiClient
      } finally {
        setIsSendingOtp(false);
      }
    } else {
      toast.error("Please enter a valid 10-digit number");
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length === 6) {
      setIsVerifyingOtp(true);
      try {
        const res = await apiClient.post<{ user: any; accessToken: string }>("/auth/verify-otp", {
          phone: phoneNumber,
          otp: fullOtp,
          role: selectedRole
        });
        
        login(res.user, res.accessToken);
        toast.success("Login Successful");
        
        if (selectedRole === "CONSUMER") router.push("/consumer/dashboard");
        else if (selectedRole === "COLLECTOR") router.push("/collector/dashboard");
      } catch (err) {
        // Error handled by apiClient
      } finally {
        setIsVerifyingOtp(false);
      }
    } else {
      toast.error("Please enter a 6-digit OTP");
    }
  };

  const onPasswordLogin = async (data: LoginFormValues) => {
    try {
      const res = await apiClient.post<{ user: any; accessToken: string }>("/auth/login", {
        identifier: data.identifier,
        password: data.password,
      });
      
      login(res.user, res.accessToken);
      toast.success("Login Successful");
      
      if (res.user.role === "ADMIN") router.push("/admin/dashboard");
      else if (res.user.role === "HUB_MANAGER") router.push("/hub/dashboard");
      else if (res.user.role === "RECYCLER") router.push("/recycler/dashboard");
    } catch (err) {
      // Error handled by apiClient
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9ff] p-6 relative">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setLang(lang === "en" ? "hi" : "en")}
          className="flex items-center text-xs px-3 py-1.5 rounded-full border border-[#becabc] bg-white cursor-pointer hover:bg-gray-50"
        >
          <Globe size={14} className="mr-1" />
          {lang === "en" ? "EN | हि" : "हि | EN"}
        </button>
      </div>

      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-[#00652c] flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Leaf size={28} color="white" />
          </div>
          <h1 className="text-2xl font-bold font-['Geist'] text-[#0b1c30]">EcoTrace India</h1>
          <p className="text-sm text-[#6f7a6e] mt-1">Verified E-Waste Recycling Platform</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#becabc] p-7 shadow-sm">
          {/* Role Selector */}
          <div className="mb-6">
            <label className="text-sm font-medium text-[#0b1c30] mb-2.5 block">I am a...</label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => { 
                    setSelectedRole(role.value); 
                    setStep(role.authType === "phone" ? "phone" : "email"); 
                    setPhoneNumber("");
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedRole === role.value 
                      ? "bg-[#00652c] text-white border border-[#00652c]" 
                      : "bg-white text-[#6f7a6e] border border-[#becabc] hover:bg-gray-50"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone OTP Flow */}
          {isPhoneAuth && step !== "otp" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0b1c30]">Mobile Number</label>
                <div className="flex">
                  <span className="inline-flex items-center justify-center rounded-l-lg border border-r-0 border-[#becabc] bg-gray-50 px-3 text-sm font-medium text-[#6f7a6e]">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-r-lg border border-[#becabc] px-3 py-2.5 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]"
                    placeholder="9876543210"
                  />
                </div>
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={phoneNumber.length !== 10 || isSendingOtp}
                className="w-full bg-[#00652c] hover:bg-[#00652c]/90 text-white rounded-xl h-11"
              >
                {isSendingOtp ? "Sending OTP..." : "Get OTP"} <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}

          {isPhoneAuth && step === "otp" && (
            <div className="space-y-4">
              <p className="text-sm text-[#0b1c30]">
                Enter the 6-digit OTP sent to <span className="font-semibold">+91 {phoneNumber}</span>
              </p>
              <div className="flex gap-2 justify-between">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-[#becabc] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]"
                  />
                ))}
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6f7a6e]">
                  {countdown > 0 ? `Resend code in ${countdown}s` : ""}
                </span>
                {countdown === 0 && (
                  <button onClick={handleSendOtp} className="text-[#00652c] font-semibold hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={otp.join("").length !== 6 || isVerifyingOtp}
                className="w-full bg-[#00652c] hover:bg-[#00652c]/90 text-white rounded-xl h-11"
              >
                {isVerifyingOtp ? "Verifying..." : "Verify & Login"}
              </Button>
              <button
                onClick={() => setStep("phone")}
                className="w-full mt-2 text-xs font-semibold text-[#6f7a6e] hover:text-[#0b1c30]"
              >
                Change Mobile Number
              </button>
            </div>
          )}

          {/* Email/Password Flow */}
          {!isPhoneAuth && (
            <form onSubmit={handleSubmit(onPasswordLogin)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0b1c30]">Work Email / ID</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7a6e]" />
                  <input
                    {...register("identifier")}
                    type="text"
                    className="w-full rounded-lg border border-[#becabc] pl-9 pr-3 py-2.5 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]"
                    placeholder="admin@ecotrace.in"
                  />
                </div>
                {errors.identifier && <p className="text-xs text-[#ba1a1a]">{errors.identifier.message}</p>}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-[#0b1c30]">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs font-semibold text-[#00652c] hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7a6e]" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-lg border border-[#becabc] pl-9 pr-10 py-2.5 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f7a6e] hover:text-[#0b1c30]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-[#ba1a1a]">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00652c] hover:bg-[#00652c]/90 text-white rounded-xl h-11 mt-2"
              >
                {isSubmitting ? "Authenticating..." : "Login to Portal"}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-[#6f7a6e]">
          New to EcoTrace India?{" "}
          <Link href="/auth/register" className="font-semibold text-[#00652c] hover:underline">
            Register your operation
          </Link>
        </p>
      </div>
    </div>
  );
}
