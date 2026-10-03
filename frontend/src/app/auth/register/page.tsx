"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Leaf, ArrowRight, ShieldCheck, Truck, Factory, User, Lock, Mail, Phone, UserCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["COLLECTOR", "HUB_MANAGER", "RECYCLER", "CONSUMER"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "COLLECTOR",
      email: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      // Create a payload that strictly matches the expected Zod schema in the backend
      const payload: any = {
        fullName: data.fullName,
        phone: data.phone,
        password: data.password,
        role: data.role,
      };
      if (data.email && data.email.trim() !== "") {
        payload.email = data.email.trim();
      }

      const response = await apiClient.post<{ user: any; accessToken: string }>("/auth/register", payload);
      
      if (response && response.user && response.accessToken) {
        login(response.user, response.accessToken);
        toast.success("Account created successfully!");
        
        // Redirect based on role
        if (data.role === "CONSUMER") router.push("/consumer/dashboard");
        else if (data.role === "COLLECTOR") router.push("/collector/dashboard");
        else if (data.role === "HUB_MANAGER") router.push("/hub/dashboard");
        else if (data.role === "RECYCLER") router.push("/recycler/dashboard");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      // Toast is handled automatically in apiClient for generic errors
    } finally {
      setIsSubmitting(false);
    }
  };

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
                type="button"
                onClick={() => setValue("role", "COLLECTOR")}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  selectedRole === "COLLECTOR" ? "border-[#00652c] bg-[#eff4ff] ring-1 ring-[#00652c]" : "border-[#becabc] hover:bg-gray-50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selectedRole === "COLLECTOR" ? "bg-[#00652c] text-white" : "bg-gray-100 text-[#6f7a6e]"}`}>
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#0b1c30]">Collector Partner</div>
                  <div className="text-xs text-[#6f7a6e]">Field Agent, Scrap Dealer, Kabadiwala</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue("role", "HUB_MANAGER")}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  selectedRole === "HUB_MANAGER" ? "border-[#00652c] bg-[#eff4ff] ring-1 ring-[#00652c]" : "border-[#becabc] hover:bg-gray-50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selectedRole === "HUB_MANAGER" ? "bg-[#00652c] text-white" : "bg-gray-100 text-[#6f7a6e]"}`}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#0b1c30]">Aggregation Hub</div>
                  <div className="text-xs text-[#6f7a6e]">Regional collection and dispatch center</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue("role", "RECYCLER")}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  selectedRole === "RECYCLER" ? "border-[#00652c] bg-[#eff4ff] ring-1 ring-[#00652c]" : "border-[#becabc] hover:bg-gray-50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selectedRole === "RECYCLER" ? "bg-[#00652c] text-white" : "bg-gray-100 text-[#6f7a6e]"}`}>
                  <Factory className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-[#0b1c30]">Formal Recycler</div>
                  <div className="text-xs text-[#6f7a6e]">CPCB Authorized dismantling/recycling facility</div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0b1c30]">Full Name / Contact Person</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7a6e]" />
                <input 
                  {...register("fullName")}
                  type="text" 
                  className={`w-full rounded-lg border pl-9 px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.fullName ? "border-[#ba1a1a] focus:ring-[#ba1a1a]" : "border-[#becabc] focus:border-[#00652c] focus:ring-[#00652c]"}`} 
                  placeholder="John Doe" 
                />
              </div>
              {errors.fullName && <p className="text-xs text-[#ba1a1a]">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0b1c30]">Mobile Number</label>
              <div className="flex relative">
                <span className="inline-flex items-center justify-center rounded-l-lg border border-r-0 border-[#becabc] bg-gray-50 px-3 text-sm text-[#6f7a6e] font-medium">+91</span>
                <input 
                  {...register("phone")}
                  type="tel" 
                  className={`w-full rounded-r-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.phone ? "border-[#ba1a1a] focus:ring-[#ba1a1a]" : "border-[#becabc] focus:border-[#00652c] focus:ring-[#00652c]"}`} 
                  placeholder="9876543210" 
                  maxLength={10}
                />
              </div>
              {errors.phone && <p className="text-xs text-[#ba1a1a]">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0b1c30]">Email Address (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7a6e]" />
                <input 
                  {...register("email")}
                  type="email" 
                  className={`w-full rounded-lg border pl-9 px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.email ? "border-[#ba1a1a] focus:ring-[#ba1a1a]" : "border-[#becabc] focus:border-[#00652c] focus:ring-[#00652c]"}`} 
                  placeholder="john@example.com" 
                />
              </div>
              {errors.email && <p className="text-xs text-[#ba1a1a]">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0b1c30]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7a6e]" />
                <input 
                  {...register("password")}
                  type="password" 
                  className={`w-full rounded-lg border pl-9 px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.password ? "border-[#ba1a1a] focus:ring-[#ba1a1a]" : "border-[#becabc] focus:border-[#00652c] focus:ring-[#00652c]"}`} 
                  placeholder="••••••••" 
                />
              </div>
              {errors.password && <p className="text-xs text-[#ba1a1a]">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00652c] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#00652c]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00652c] disabled:opacity-70"
            >
              {isSubmitting ? "Creating Account..." : "Complete Registration"}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-[#6f7a6e]">
          By registering, you agree to EcoTrace India's <br />
          <Link href="#" className="font-semibold text-[#00652c] hover:underline">Terms of Service</Link> and <Link href="#" className="font-semibold text-[#00652c] hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
