"use client";

import Link from "next/link";
import { PackageOpen, BarChart, LogIn, LayoutGrid, FileText, ClipboardList, Plus, Truck, CheckCircle2, Search } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const batches = [
  { id: "BCH-2026-891", created: "Today, 08:30 AM", type: "Mixed Electronics", weight: "1.2 MT", destination: "EcoTech Metals", status: "IN_TRANSIT" },
  { id: "BCH-2026-890", created: "Yesterday", type: "Lithium Batteries", weight: "450 kg", destination: "PowerRecycle Ltd", status: "DELIVERED" },
  { id: "BCH-2026-889", created: "28 Sep 2026", type: "PCB High Grade", weight: "890 kg", destination: "EcoTech Metals", status: "DELIVERED" },
];

export default function HubBatchesPage() {
  const hubNav = [
    {
      section: "Hub Operations",
      items: [
        { label: "Dashboard", icon: <BarChart size={18} />, href: "/hub/dashboard" },
        { label: "Collector Intake", icon: <LogIn size={18} />, href: "/hub/intake" },
        { label: "Inventory", icon: <PackageOpen size={18} />, href: "/hub/inventory" },
        { label: "Batches", icon: <LayoutGrid size={18} />, href: "/hub/batches" },
      ]
    },
    {
      section: "Reporting",
      items: [
        { label: "Reconciliation", icon: <ClipboardList size={18} />, href: "/hub/reconciliation" },
        { label: "Manifests & Reports", icon: <FileText size={18} />, href: "/hub/reports" },
      ]
    }
  ];

  return (
    <DashboardShell 
      navItems={hubNav}
      activeRole="Hub Manager" 
      userName="Rajesh Patel" 
      userRole="Ops Lead (Western Hub)"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1c30]">Dispatch Batches</h1>
            <p className="text-sm text-[#6f7a6e]">Manage sealed inventory dispatch to formal recyclers</p>
          </div>
          <Link href="/hub/batches/new">
            <Button className="gap-2 bg-[#00652c] text-white hover:bg-[#00652c]/90">
              <Plus size={16} /> Create New Batch
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="border-[#becabc] bg-white">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7a6e]" />
              <Input placeholder="Search batch ID, destination..." className="pl-9 border-[#becabc]" />
            </div>
            <Button variant="outline" className="border-[#becabc]">Filter Status</Button>
          </CardContent>
        </Card>

        {/* Batches List */}
        <div className="space-y-4">
          {batches.map((batch) => (
            <Card key={batch.id} className="border-[#becabc] transition-all hover:border-[#00652c] hover:shadow-md">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex-1 p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="font-bold text-[#0b1c30]">{batch.id}</span>
                      <Badge variant={batch.status === "IN_TRANSIT" ? "secondary" : "success"}>
                        {batch.status === "IN_TRANSIT" ? <Truck size={12} className="mr-1" /> : <CheckCircle2 size={12} className="mr-1" />}
                        {batch.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs font-medium text-[#6f7a6e]">Creation Date</p>
                        <p className="font-semibold text-[#0b1c30]">{batch.created}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#6f7a6e]">Category Type</p>
                        <p className="font-semibold text-[#0b1c30]">{batch.type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#6f7a6e]">Total Weight</p>
                        <p className="font-semibold text-[#00652c]">{batch.weight}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#6f7a6e]">Destination</p>
                        <p className="font-semibold text-[#0b1c30]">{batch.destination}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-[#becabc] bg-gray-50 p-4 md:w-48 md:flex-col md:justify-center md:border-l md:border-t-0">
                    <Button variant="outline" className="w-full gap-2 border-[#00652c] text-[#00652c] hover:bg-[#eff4ff]">
                      <FileText size={16} /> View Manifest
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
