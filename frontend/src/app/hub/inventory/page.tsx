"use client";

import { PackageOpen, BarChart, LogIn, LayoutGrid, FileText, ClipboardList, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const inventory = [
  { category: "PCB High Grade", weight: "450.5 kg", lastUpdated: "2 mins ago", capacity: "65%", status: "NORMAL" },
  { category: "Lithium Batteries", weight: "84.2 kg", lastUpdated: "15 mins ago", capacity: "90%", status: "CRITICAL" },
  { category: "Copper Wire", weight: "120.0 kg", lastUpdated: "1 hour ago", capacity: "30%", status: "NORMAL" },
  { category: "Mixed Appliances", weight: "1,145.0 kg", lastUpdated: "10 mins ago", capacity: "85%", status: "WARNING" },
  { category: "CRT Monitors", weight: "320.0 kg", lastUpdated: "3 hours ago", capacity: "45%", status: "NORMAL" },
];

export default function HubInventoryPage() {
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
            <h1 className="text-2xl font-bold text-[#0b1c30]">Live Inventory</h1>
            <p className="text-sm text-[#6f7a6e]">Monitor real-time e-waste stock at Western Hub</p>
          </div>
          <Button className="gap-2 bg-[#00652c] text-white hover:bg-[#00652c]/90">
            <RefreshCw size={16} /> Sync Database
          </Button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-[#becabc]">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between text-[#6f7a6e]">
                <span className="text-sm font-medium">Total In-Stock</span>
                <PackageOpen size={18} />
              </div>
              <div className="text-3xl font-bold text-[#0b1c30]">2.11 MT</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#00652c]">
                <TrendingUp size={14} /> +0.4 MT since yesterday
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#becabc]">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between text-[#6f7a6e]">
                <span className="text-sm font-medium">Capacity Utilized</span>
                <LayoutGrid size={18} />
              </div>
              <div className="text-3xl font-bold text-[#ba1a1a]">78%</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#6f7a6e]">
                Approaching dispatch threshold
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#becabc]">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between text-[#6f7a6e]">
                <span className="text-sm font-medium">Value Estimate</span>
                <span className="font-['Geist'] font-semibold">₹</span>
              </div>
              <div className="text-3xl font-bold text-[#0b1c30]">₹4.2L</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#ba1a1a]">
                <TrendingDown size={14} /> -1.2% market shift
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Inventory Table */}
        <Card className="border-[#becabc]">
          <CardHeader className="border-b border-[#becabc] bg-white">
            <CardTitle className="text-lg">Stock by CPCB Category</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#eff4ff] text-xs uppercase text-[#6f7a6e]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Current Weight</th>
                  <th className="px-6 py-4 font-semibold">Capacity</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#becabc] bg-white">
                {inventory.map((item) => (
                  <tr key={item.category} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#0b1c30]">{item.category}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-[#00652c]">{item.weight}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-gray-200">
                          <div 
                            className={`h-2 rounded-full ${
                              item.status === "CRITICAL" ? "bg-[#ba1a1a]" : item.status === "WARNING" ? "bg-[#913e00]" : "bg-[#00652c]"
                            }`} 
                            style={{ width: item.capacity }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#6f7a6e]">{item.capacity}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={
                        item.status === "CRITICAL" ? "destructive" : 
                        item.status === "WARNING" ? "warning" : "success"
                      }>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-[#6f7a6e]">{item.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
