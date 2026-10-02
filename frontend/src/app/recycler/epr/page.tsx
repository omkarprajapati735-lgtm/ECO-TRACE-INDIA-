"use client";

import { useState } from "react";
import { Award, ShieldCheck, Download, Plus, LayoutDashboard, Package, Recycle, FileCheck, FileBarChart, User, Settings } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const eprCertificates = [
  { id: "EPR-992-2026", date: "2026-09-28", type: "Mixed Electronics", weight: "1.2 MT", target: "TechGiant India Pvt Ltd", hash: "a8f9c2e4...b9d3" },
  { id: "EPR-991-2026", date: "2026-09-25", type: "Lithium Batteries", weight: "450 kg", target: "PowerCell Corp", hash: "f3e1b8c2...d7a5" },
  { id: "EPR-989-2026", date: "2026-09-20", type: "PCB High Grade", weight: "890 kg", target: "Compute Systems Ltd", hash: "c4d2e9f1...a8b7" },
];

export default function EprCertificatesPage() {
  const recyclerNav = [
    {
      section: "Recycling Plant",
      items: [
        { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/recycler/dashboard" },
        { label: "Incoming Batches", icon: <Package size={18} />, href: "/recycler/batches" },
        { label: "Processing & Yields", icon: <Recycle size={18} />, href: "/recycler/processing" },
      ]
    },
    {
      section: "Compliance",
      items: [
        { label: "EPR Certificates", icon: <FileCheck size={18} />, href: "/recycler/epr" },
        { label: "Reports", icon: <FileBarChart size={18} />, href: "/recycler/reports" },
      ]
    },
    {
      section: "Account",
      items: [
        { label: "Profile", icon: <User size={18} />, href: "/recycler/profile" },
        { label: "Settings", icon: <Settings size={18} />, href: "/recycler/settings" },
      ]
    }
  ];

  return (
    <DashboardShell
      navItems={recyclerNav}
      activeRole="Recycler"
      userName="Sanjay Rao"
      userRole="Plant Manager"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1c30]">EPR Certificate Registry</h1>
            <p className="text-sm text-[#6f7a6e]">Generate and manage Extended Producer Responsibility certificates</p>
          </div>
          <Button className="gap-2 bg-[#00652c] text-white hover:bg-[#00652c]/90">
            <Plus size={16} /> Issue New EPR
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {eprCertificates.map((cert) => (
            <Card key={cert.id} className="group relative overflow-hidden border-[#becabc] transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 h-1 w-full bg-[#00652c]" />
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d3ffd5]">
                    <ShieldCheck className="h-5 w-5 text-[#00652c]" />
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-[#0b1c30]">
                    <Award size={12} className="text-[#712ae2]" /> CPCB
                  </span>
                </div>
                <h3 className="font-['Geist'] text-lg font-bold text-[#0b1c30]">{cert.id}</h3>
                <p className="mb-4 text-xs font-semibold text-[#00652c]">{cert.type}</p>
                
                <div className="mb-6 space-y-2 text-sm text-[#3f493f]">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[#6f7a6e]">Date Issued</span>
                    <span className="font-medium text-[#0b1c30]">{cert.date}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[#6f7a6e]">Producer/Brand</span>
                    <span className="font-medium text-[#0b1c30] text-right">{cert.target}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[#6f7a6e]">Volume Credit</span>
                    <span className="font-semibold text-[#00652c]">{cert.weight}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-[#6f7a6e]">SHA-256 Hash</span>
                    <span className="font-['JetBrains_Mono'] text-xs text-[#6f7a6e]">{cert.hash}</span>
                  </div>
                </div>

                <Button className="w-full gap-2 border-[#00652c] text-[#00652c]" variant="outline">
                  <Download size={16} /> Download Signed PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
