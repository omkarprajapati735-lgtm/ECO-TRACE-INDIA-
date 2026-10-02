"use client";

import { History, Search, Filter, Calendar, MapPin, ListTodo, Wallet, Bell, User, Settings, ShieldCheck } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const jobHistory = [
  { id: "PK-4025", date: "2026-09-28", time: "14:30", type: "Domestic", items: "5 Laptops", weight: "12.4 kg", payout: "₹1,240", status: "HUB_DELIVERED" },
  { id: "PK-4018", date: "2026-09-26", time: "11:00", type: "Domestic", items: "Washing Machine", weight: "45.0 kg", payout: "₹350", status: "HUB_DELIVERED" },
  { id: "PK-3988", date: "2026-09-20", time: "16:45", type: "Commercial", items: "Mixed Cables", weight: "8.5 kg", payout: "₹580", status: "HUB_DELIVERED" },
];

export default function CollectorHistoryPage() {
  const collectorNav = [
    {
      section: "Collector",
      items: [
        { label: "Nearby Jobs", icon: <ListTodo size={18} />, href: "/collector/dashboard" },
        { label: "My Wallet", icon: <Wallet size={18} />, href: "/collector/wallet" },
        { label: "Job History", icon: <History size={18} />, href: "/collector/history" },
      ]
    },
    {
      section: "Account",
      items: [
        { label: "Notifications", icon: <Bell size={18} />, href: "/collector/notifications" },
        { label: "Profile", icon: <User size={18} />, href: "/collector/profile" },
        { label: "Settings", icon: <Settings size={18} />, href: "/collector/settings" },
      ]
    }
  ];

  return (
    <DashboardShell 
      navItems={collectorNav}
      activeRole="Collector" 
      userName="Suresh Kumar" 
      userRole="Field Collector (Zone 4)"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1c30]">Job History</h1>
            <p className="text-sm text-[#6f7a6e]">View your completed pickups and hub deliveries</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar size={16} /> Last 30 Days
            </Button>
            <Button variant="outline" className="gap-2">
              <Filter size={16} /> Filters
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {jobHistory.map((job) => (
            <Card key={job.id} className="border-[#becabc] hover:border-[#00652c] hover:shadow-md transition-all">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Left Section: Details */}
                  <div className="flex-1 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#0b1c30]">{job.id}</span>
                        <Badge variant="success" className="gap-1 rounded-full px-2 py-0.5">
                          <ShieldCheck size={12} /> {job.status}
                        </Badge>
                      </div>
                      <span className="font-semibold text-[#00652c] md:hidden">{job.payout}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-xs font-medium text-[#6f7a6e]">Date & Time</div>
                        <div className="text-sm font-semibold text-[#0b1c30]">{job.date} • {job.time}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#6f7a6e]">Items</div>
                        <div className="text-sm font-semibold text-[#0b1c30]">{job.items}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#6f7a6e]">Total Weight</div>
                        <div className="text-sm font-semibold text-[#0b1c30]">{job.weight}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#6f7a6e]">Customer Type</div>
                        <div className="text-sm font-semibold text-[#0b1c30]">{job.type}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Payout Desktop */}
                  <div className="hidden w-48 flex-col items-center justify-center border-l border-[#becabc] bg-[#eff4ff] p-6 md:flex">
                    <span className="text-xs font-medium text-[#6f7a6e]">Total Payout</span>
                    <span className="text-2xl font-bold text-[#00652c]">{job.payout}</span>
                    <Button variant="link" className="mt-2 h-auto p-0 text-xs text-[#712ae2]">View Receipt</Button>
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
