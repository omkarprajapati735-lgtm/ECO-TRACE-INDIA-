"use client";

import Link from "next/link";
import { Leaf, Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
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
            <Link href="/about" className="text-sm font-medium text-[#6f7a6e] hover:text-[#0b1c30]">About Us</Link>
            <Link href="/contact" className="text-sm font-medium text-[#00652c]">Contact</Link>
          </nav>
          <Link href="/auth/login" className="rounded-full bg-[#00652c] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00652c]/90">
            Login
          </Link>
        </div>
      </header>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h1 className="font-['Geist'] text-4xl font-bold tracking-tight text-[#0b1c30]">Contact Our Team</h1>
            <p className="mt-4 text-lg text-[#3f493f]">Have questions about recycling, partnerships, or EPR compliance?</p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Info */}
            <div className="flex flex-col justify-center space-y-8 rounded-2xl bg-white p-10 shadow-sm border border-[#becabc]">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-[#eff4ff] p-3">
                  <MapPin className="h-6 w-6 text-[#00652c]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0b1c30]">Headquarters</h3>
                  <p className="mt-1 text-sm text-[#6f7a6e]">Cyber City, Phase 2<br />Gurugram, Haryana 122002<br />India</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-[#eff4ff] p-3">
                  <Phone className="h-6 w-6 text-[#00652c]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0b1c30]">Phone Support</h3>
                  <p className="mt-1 text-sm text-[#6f7a6e]">Toll-Free: 1800-123-4567<br />Mon-Sat, 9AM to 6PM</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-[#eff4ff] p-3">
                  <Mail className="h-6 w-6 text-[#00652c]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0b1c30]">Email Us</h3>
                  <p className="mt-1 text-sm text-[#6f7a6e]">support@ecotrace.in<br />partnerships@ecotrace.in</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="rounded-2xl bg-white p-10 shadow-sm border border-[#becabc]">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0b1c30]">First Name</label>
                    <input type="text" className="w-full rounded-lg border border-[#becabc] px-4 py-2.5 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0b1c30]">Last Name</label>
                    <input type="text" className="w-full rounded-lg border border-[#becabc] px-4 py-2.5 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0b1c30]">Email Address</label>
                  <input type="email" className="w-full rounded-lg border border-[#becabc] px-4 py-2.5 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]" placeholder="john@company.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0b1c30]">Message</label>
                  <textarea rows={4} className="w-full rounded-lg border border-[#becabc] px-4 py-2.5 text-sm focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]" placeholder="How can we help you?"></textarea>
                </div>
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00652c] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00652c]/90">
                  Send Message <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
