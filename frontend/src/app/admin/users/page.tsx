"use client";

import { useState } from "react";
import { Users, Search, Filter, ShieldCheck, UserCheck, UserX, LayoutDashboard, Radar, Activity, Package, IndianRupee, Settings, MoreVertical } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const usersData = [
  { id: "USR-092", name: "Suresh Kumar", role: "COLLECTOR", contact: "+91 98765 43210", joined: "2026-05-12", status: "ACTIVE" },
  { id: "USR-144", name: "Priya Sharma", role: "CONSUMER", contact: "+91 99887 76655", joined: "2026-08-20", status: "ACTIVE" },
  { id: "USR-031", name: "Rajesh Patel", role: "HUB_MANAGER", contact: "rajesh.p@ecotrace.in", joined: "2026-02-15", status: "ACTIVE" },
  { id: "USR-205", name: "Arun Kumar", role: "COLLECTOR", contact: "+91 88776 65544", joined: "2026-09-01", status: "SUSPENDED" },
  { id: "USR-018", name: "Sanjay Rao", role: "RECYCLER", contact: "sanjay@ecotech.in", joined: "2026-01-10", status: "ACTIVE" },
];

function getRoleBadge(role: string) {
  switch (role) {
    case "CONSUMER": return "secondary";
    case "COLLECTOR": return "warning";
    case "HUB_MANAGER": return "success";
    case "RECYCLER": return "default";
    default: return "outline";
  }
}

export default function AdminUsersPage() {
  const adminNav = [
    {
      section: "Command Center",
      items: [
        { label: "Overview", icon: <LayoutDashboard size={18} />, href: "/admin/dashboard" },
        { label: "Fraud Radar", icon: <Radar size={18} />, href: "/admin/fraud" },
        { label: "Live Platform Sync", icon: <Activity size={18} />, href: "/admin/analytics" },
      ]
    },
    {
      section: "Network",
      items: [
        { label: "Users & Roles", icon: <Users size={18} />, href: "/admin/users" },
        { label: "Hub Operations", icon: <Package size={18} />, href: "/admin/hubs" },
        { label: "Financials", icon: <IndianRupee size={18} />, href: "/admin/payments" },
        { label: "Settings", icon: <Settings size={18} />, href: "/admin/settings" },
      ]
    }
  ];

  return (
    <DashboardShell
      navItems={adminNav}
      activeRole="Admin"
      userName="Rajesh Mehta"
      userRole="Central Operations"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1c30]">Users & Roles</h1>
            <p className="text-sm text-[#6f7a6e]">Manage access, roles, and verify network participants</p>
          </div>
          <Button className="gap-2 bg-[#00652c] text-white hover:bg-[#00652c]/90">
            <UserCheck size={16} /> Invite User
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="border-[#becabc]">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#6f7a6e]">Consumers</p>
                <p className="text-2xl font-bold text-[#0b1c30]">8,245</p>
              </div>
              <div className="rounded-full bg-[#eff4ff] p-3 text-[#712ae2]">
                <Users size={20} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#becabc]">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#6f7a6e]">Collectors</p>
                <p className="text-2xl font-bold text-[#0b1c30]">1,420</p>
              </div>
              <div className="rounded-full bg-[#ffdbca] p-3 text-[#913e00]">
                <Users size={20} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#becabc]">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#6f7a6e]">Hub Staff</p>
                <p className="text-2xl font-bold text-[#0b1c30]">45</p>
              </div>
              <div className="rounded-full bg-[#d3ffd5] p-3 text-[#00652c]">
                <ShieldCheck size={20} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#becabc]">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#6f7a6e]">Suspended</p>
                <p className="text-2xl font-bold text-[#ba1a1a]">12</p>
              </div>
              <div className="rounded-full bg-[#ffdad6] p-3 text-[#ba1a1a]">
                <UserX size={20} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#becabc] bg-white">
          <CardHeader className="border-b border-[#becabc] bg-[#eff4ff]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Network Directory</CardTitle>
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7a6e]" />
                  <Input placeholder="Search name, ID, phone..." className="pl-9 h-8 text-xs border-[#becabc]" />
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1 border-[#becabc] bg-white">
                  <Filter size={14} /> Filter Role
                </Button>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-[#6f7a6e]">
                <tr>
                  <th className="px-6 py-4 font-semibold">User Details</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#becabc] bg-white">
                {usersData.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-semibold text-[#0b1c30]">{user.name}</div>
                      <div className="text-xs font-['JetBrains_Mono'] text-[#6f7a6e]">{user.id}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={getRoleBadge(user.role) as any}>{user.role}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#3f493f]">{user.contact}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#6f7a6e]">{user.joined}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`text-xs font-bold ${user.status === "ACTIVE" ? "text-[#00652c]" : "text-[#ba1a1a]"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#6f7a6e]">
                        <MoreVertical size={16} />
                      </Button>
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
