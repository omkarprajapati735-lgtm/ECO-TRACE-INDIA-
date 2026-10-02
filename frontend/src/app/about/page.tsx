"use client";

import Link from "next/link";
import { Leaf, Users, Globe, ArrowRight } from "lucide-react";

export default function AboutPage() {
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
            <Link href="/how-it-works" className="text-sm font-medium text-[#6f7a6e] hover:text-[#0b1c30]">How it Works</Link>
            <Link href="/about" className="text-sm font-medium text-[#00652c]">About Us</Link>
            <Link href="/contact" className="text-sm font-medium text-[#6f7a6e] hover:text-[#0b1c30]">Contact</Link>
          </nav>
          <Link href="/auth/login" className="rounded-full bg-[#00652c] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00652c]/90">
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#0b1c30] py-24 text-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 className="font-['Geist'] text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Formalizing India&apos;s <br />
            <span className="text-[#95f8a7]">E-Waste Ecosystem</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#becabc]">
            We are not building a new collection network. We are digitizing, organizing, and empowering the millions of informal collectors, kabadiwalas, and scrap dealers who already power India&apos;s circular economy.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-10 shadow-sm border border-[#becabc]">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#d3ffd5]">
                <Globe className="h-6 w-6 text-[#00652c]" />
              </div>
              <h3 className="font-['Geist'] text-2xl font-bold text-[#0b1c30]">Our Mission</h3>
              <p className="mt-4 text-base leading-relaxed text-[#3f493f]">
                To provide a unified digital coordination layer that bridges the gap between informal waste collectors and formal, CPCB-authorized recyclers, ensuring fair wages, safe handling, and 100% transparent traceability of electronic waste.
              </p>
            </div>
            
            <div className="rounded-2xl bg-white p-10 shadow-sm border border-[#becabc]">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#eff4ff]">
                <Users className="h-6 w-6 text-[#712ae2]" />
              </div>
              <h3 className="font-['Geist'] text-2xl font-bold text-[#0b1c30]">Our Vision</h3>
              <p className="mt-4 text-base leading-relaxed text-[#3f493f]">
                A zero-waste India where every discarded electronic device is tracked, properly dismantled, and recycled back into the manufacturing supply chain, creating a truly circular economy while elevating the social status of field collectors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#eff4ff] py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-['Geist'] text-3xl font-bold text-[#0b1c30]">Ready to make an impact?</h2>
          <p className="mt-4 text-lg text-[#3f493f]">Join the network as a consumer, collector, or recycler today.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/auth/register" className="flex items-center gap-2 rounded-full bg-[#00652c] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#00652c]/90">
              Join the Network <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
