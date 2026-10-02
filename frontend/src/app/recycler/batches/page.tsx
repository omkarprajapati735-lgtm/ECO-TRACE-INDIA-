"use client";

import Link from "next/link";
import { Package, Recycle, FileCheck, FileBarChart, User, Settings, LayoutDashboard, Search, Filter, ShieldCheck, Truck, Clock } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const incomingBatches = [
  { id: "BCH-2026-891", received: "Today, 11:30 AM", type: "Mixed Electronics", weight: "1.2 MT", origin: "Western Hub (Gurugram)", status: "QUEUED" },
  { id: "BCH-2026-890", received: "Yesterday", type: "Lithium Batteries", weight: "450 kg", origin: "Northern Hub (Delhi)", status: "PROCESSING" },
  { id: "BCH-2026-885", received: "27 Sep 2026", type: "PCB High Grade", weight: "890 kg", origin: "Western Hub (Gurugram)", status: "COMPLETED" },
];

export default function RecyclerBatchesPage() {
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
            <h1 className="text-2xl font-bold text-[#0b1c30]">Incoming Batches</h1>
            <p className="text-sm text-[#6f7a6e]">Manage and process sealed e-waste batches from regional hubs</p>
          </div>
          <Button className="gap-2 bg-[#00652c] text-white hover:bg-[#00652c]/90">
            Scan QR Manifest
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-[#becabc] bg-white">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7a6e]" />
              <Input placeholder="Search batch ID, origin hub..." className="pl-9 border-[#becabc]" />
            </div>
            <Button variant="outline" className="border-[#becabc] gap-2">
              <Filter size={16} /> Filters
            </Button>
          </CardContent>
        </Card>

        {/* Batches List */}
        <div className="space-y-4">
          {incomingBatches.map((batch) => (
            <Card key={batch.id} className="border-[#becabc] transition-all hover:border-[#00652c] hover:shadow-md">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex-1 p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="font-bold text-[#0b1c30]">{batch.id}</span>
                      <Badge variant={batch.status === "COMPLETED" ? "success" : batch.status === "PROCESSING" ? "warning" : "secondary"}>
                        {batch.status === "COMPLETED" && <ShieldCheck size={12} className="mr-1" />}
                        {batch.status === "PROCESSING" && <Recycle size={12} className="mr-1" />}
                        {batch.status === "QUEUED" && <Clock size={12} className="mr-1" />}
                        {batch.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs font-medium text-[#6f7a6e]">Received Date</p>
                        <p className="font-semibold text-[#0b1c30]">{batch.received}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#6f7a6e]">Material Type</p>
                        <p className="font-semibold text-[#0b1c30]">{batch.type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#6f7a6e]">Total Weight</p>
                        <p className="font-semibold text-[#00652c]">{batch.weight}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#6f7a6e]">Origin</p>
                        <p className="font-semibold text-[#0b1c30]">{batch.origin}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-[#becabc] bg-gray-50 p-4 md:w-48 md:flex-col md:justify-center md:border-l md:border-t-0 space-y-2">
                    {batch.status === "QUEUED" && (
                      <Link href="/recycler/processing">
                        <Button className="w-full gap-2 bg-[#00652c] text-white hover:bg-[#00652c]/90">
                          <Recycle size={16} /> Process
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" className="w-full gap-2 border-[#00652c] text-[#00652c] hover:bg-[#eff4ff]">
                      <FileText size={16} /> Manifest
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
