"use client";

import Link from "next/link";
import { Package, Calendar, ArrowRight, Wallet, Award, Bell, User, Settings, LayoutDashboard } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pickups = [
  { id: "PK-4029", status: "ASSIGNED", date: "Today, 10:00 AM", items: "2 Laptops, 1 Battery Pack", estimatedPayout: "₹680", collector: "Ramesh K." },
  { id: "PK-4025", status: "COMPLETED", date: "Yesterday, 2:30 PM", items: "5 Old Phones, Cables", estimatedPayout: "₹1,240", collector: "Suresh S." },
  { id: "PK-4018", status: "COMPLETED", date: "26 Sep, 11:00 AM", items: "Washing Machine", estimatedPayout: "₹350", collector: "Vikram P." },
];

function getStatusVariant(status: string) {
  switch (status) {
    case "REQUESTED": return "warning";
    case "ASSIGNED": return "secondary";
    case "COLLECTED": 
    case "COMPLETED": return "success";
    default: return "default";
  }
}

export default function ConsumerDashboard() {
  const consumerNav = [
    {
      section: "Recycling",
      items: [
        { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/consumer/dashboard" },
        { label: "My Pickups", icon: <Package size={18} />, href: "/consumer/pickups" },
        { label: "Earnings", icon: <Wallet size={18} />, href: "/consumer/earnings" },
        { label: "Certificates", icon: <Award size={18} />, href: "/consumer/certificates" },
      ]
    },
    {
      section: "Account",
      items: [
        { label: "Notifications", icon: <Bell size={18} />, href: "/consumer/notifications" },
        { label: "Profile", icon: <User size={18} />, href: "/consumer/profile" },
        { label: "Settings", icon: <Settings size={18} />, href: "/consumer/settings" },
      ]
    }
  ];

  return (
    <DashboardShell 
      navItems={consumerNav} 
      activeRole="Consumer" 
      userName="Priya Sharma" 
      userRole="Eco Warrior"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1c30]">Welcome back, Priya!</h1>
          <p className="text-sm text-[#6f7a6e]">Track your e-waste impact and earnings</p>
        </div>

        {/* Quick Action */}
        <Link href="/consumer/pickups/new" className="block">
          <div className="flex items-center justify-between rounded-xl bg-[#00652c] p-6 text-white shadow-md transition-transform hover:scale-[1.01]">
            <div className="flex items-center gap-4">
              <Package size={28} />
              <div>
                <div className="text-lg font-semibold">Book New Pickup</div>
                <div className="text-sm opacity-90">Get instant price estimates for your e-waste</div>
              </div>
            </div>
            <ArrowRight size={24} />
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Recycled", value: "34.5 kg", color: "text-[#00652c]" },
            { label: "Total Earned", value: "₹4,270", color: "text-[#00652c]" },
            { label: "Certificates", value: "3", color: "text-[#712ae2]" },
          ].map((stat) => (
            <Card key={stat.label} className="border-[#becabc]">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6f7a6e]">{stat.label}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pickups List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0b1c30]">Recent Pickups</h2>
            <Link href="/consumer/pickups" className="text-sm font-semibold text-[#00652c] hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {pickups.map((pickup) => (
              <Link key={pickup.id} href={`/consumer/pickups/${pickup.id}`} className="block">
                <Card className="border-[#becabc] transition-colors hover:bg-[#eff4ff]">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-semibold text-[#0b1c30]">{pickup.id}</span>
                      <Badge variant={getStatusVariant(pickup.status) as any}>{pickup.status}</Badge>
                    </div>
                    <div className="mb-1 flex items-center gap-2 text-sm text-[#3f493f]">
                      <Package size={14} className="text-[#6f7a6e]" /> {pickup.items}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-[#6f7a6e]">
                        <Calendar size={12} /> {pickup.date}
                      </span>
                      <span className="font-semibold text-[#00652c]">{pickup.estimatedPayout}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
