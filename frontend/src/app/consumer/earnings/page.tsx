"use client";

import { Wallet, TrendingUp, IndianRupee, ArrowDownToLine, Filter, Calendar as CalendarIcon, LayoutDashboard, Package, Award, Bell, User, Settings } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const transactions = [
  { id: "TXN-9092", date: "2026-09-28", type: "PAYOUT", amount: 1240, method: "UPI", status: "SUCCESS", ref: "PK-4025" },
  { id: "TXN-8742", date: "2026-09-26", type: "PAYOUT", amount: 350, method: "UPI", status: "SUCCESS", ref: "PK-4018" },
  { id: "TXN-8201", date: "2026-08-15", type: "PAYOUT", amount: 890, method: "UPI", status: "SUCCESS", ref: "PK-3902" },
  { id: "TXN-7945", date: "2026-07-22", type: "PAYOUT", amount: 1790, method: "Bank Transfer", status: "SUCCESS", ref: "PK-3844" },
];

export default function EarningsPage() {
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1c30]">My Earnings</h1>
            <p className="text-sm text-[#6f7a6e]">Track payouts from your e-waste recycling</p>
          </div>
          <Button variant="outline" className="gap-2">
            <ArrowDownToLine size={16} /> Download Statement
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-[#becabc] bg-[#00652c] text-white">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between opacity-90">
                <span className="text-sm font-medium">Total Lifetime Earnings</span>
                <IndianRupee size={18} />
              </div>
              <div className="text-3xl font-bold">₹4,270</div>
              <div className="mt-4 flex items-center gap-1 text-xs text-[#95f8a7]">
                <TrendingUp size={14} /> +₹1,240 this month
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#becabc]">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between text-[#6f7a6e]">
                <span className="text-sm font-medium">Pending Payouts</span>
                <Wallet size={18} />
              </div>
              <div className="text-3xl font-bold text-[#0b1c30]">₹680</div>
              <div className="mt-4 text-xs text-[#6f7a6e]">
                Will be credited after PK-4029 completion
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#becabc]">
          <CardHeader className="border-b border-[#becabc] bg-[#eff4ff]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Payout History</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1 border-[#becabc] bg-white">
                  <CalendarIcon size={14} /> Date
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1 border-[#becabc] bg-white">
                  <Filter size={14} /> Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-[#6f7a6e]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Transaction ID</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Pickup Ref</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Method</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#becabc] bg-white">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-[#0b1c30]">{txn.id}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#3f493f]">{txn.date}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#00652c] hover:underline cursor-pointer font-medium">{txn.ref}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-bold text-[#0b1c30]">₹{txn.amount}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#6f7a6e]">{txn.method}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant="success">SUCCESS</Badge>
                    </td>
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
