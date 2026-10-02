"use client";

import Link from "next/link";
import { Leaf, Search, Truck, Factory, ShieldCheck, IndianRupee } from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      icon: <Search className="h-8 w-8 text-[#00652c]" />,
      title: "1. Request a Pickup",
      desc: "Consumers schedule a doorstep pickup through the EcoTrace portal, selecting their e-waste category and preferred time slot."
    },
    {
      icon: <Truck className="h-8 w-8 text-[#712ae2]" />,
      title: "2. Collector Assignment",
      desc: "Our algorithm routes the request to the nearest verified field collector (kabadiwala) who claims the job and arrives for weigh-in."
    },
    {
      icon: <IndianRupee className="h-8 w-8 text-[#00652c]" />,
      title: "3. Digital Weigh-in & Payment",
      desc: "The collector weighs the scrap via Bluetooth scales and the consumer is instantly paid via UPI based on live regional scrap rates."
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-[#913e00]" />,
      title: "4. Hub Aggregation",
      desc: "Collectors drop off their daily haul at regional hubs where it is verified, consolidated, and sealed with tamper-evident QR manifests."
    },
    {
      icon: <Factory className="h-8 w-8 text-[#00652c]" />,
      title: "5. Formal Recycling & EPR",
      desc: "Batches are dispatched to CPCB-authorized recyclers who process the materials and issue digital EPR (Extended Producer Responsibility) certificates."
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#becabc] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-[#00652c]" />
            <span className="font-['Geist'] text-lg font-bold text-[#0b1c30]">EcoTrace India</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/how-it-works" className="text-sm font-medium text-[#00652c]">How it Works</Link>
            <Link href="/about" className="text-sm font-medium text-[#6f7a6e] hover:text-[#0b1c30]">About Us</Link>
            <Link href="/contact" className="text-sm font-medium text-[#6f7a6e] hover:text-[#0b1c30]">Contact</Link>
          </nav>
          <Link href="/auth/login" className="rounded-full bg-[#00652c] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00652c]/90">
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-20 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-['Geist'] text-4xl font-bold tracking-tight text-[#0b1c30] sm:text-5xl">
            The Circular Journey of E-Waste
          </h1>
          <p className="mt-6 text-lg text-[#3f493f]">
            EcoTrace provides a 100% transparent chain of custody from your doorstep to the metallurgical refinery.
          </p>
        </div>
      </section>

      {/* Steps Timeline */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col gap-8 md:flex-row md:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#eff4ff] shadow-sm border border-[#becabc]">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-['Geist'] text-2xl font-bold text-[#0b1c30]">{step.title}</h3>
                  <p className="mt-3 text-base text-[#3f493f]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
