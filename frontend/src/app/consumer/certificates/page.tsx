"use client";

import { Award, FileText, Download, ShieldCheck, LayoutDashboard, Package, Wallet, Bell, User, Settings } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const certificates = [
  { id: "CERT-2026-902", date: "2026-09-28", type: "EPR Compliance", items: "5 Laptops", recycler: "EcoTech Metals", co2Saved: "45.2 kg" },
  { id: "CERT-2026-844", date: "2026-08-15", type: "EPR Compliance", items: "1 Refrigerator", recycler: "GreenCycle India", co2Saved: "112.5 kg" },
  { id: "CERT-2026-710", date: "2026-07-22", type: "EPR Compliance", items: "Mixed Cables (12kg)", recycler: "EcoTech Metals", co2Saved: "18.4 kg" },
];

export default function CertificatesPage() {
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
          <h1 className="text-2xl font-bold text-[#0b1c30]">My Certificates</h1>
          <p className="text-sm text-[#6f7a6e]">Download your CPCB-verified recycling certificates</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card key={cert.id} className="group relative overflow-hidden border-[#becabc] transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 h-1 w-full bg-[#00652c]" />
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d3ffd5]">
                    <Award className="h-5 w-5 text-[#00652c]" />
                  </div>
                  <ShieldCheck className="h-5 w-5 text-[#00652c]" />
                </div>
                <h3 className="font-['Geist'] text-lg font-bold text-[#0b1c30]">{cert.id}</h3>
                <p className="mb-4 text-xs font-semibold text-[#00652c]">{cert.type}</p>
                
                <div className="mb-6 space-y-2 text-sm text-[#3f493f]">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[#6f7a6e]">Date Issue</span>
                    <span className="font-medium text-[#0b1c30]">{cert.date}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[#6f7a6e]">Recycler</span>
                    <span className="font-medium text-[#0b1c30]">{cert.recycler}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-[#6f7a6e]">CO₂ Saved</span>
                    <span className="font-semibold text-[#00652c]">{cert.co2Saved}</span>
                  </div>
                </div>

                <Button className="w-full gap-2" variant="outline">
                  <Download size={16} /> Download PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State placeholder if 0 certificates */}
        {certificates.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#becabc] bg-gray-50 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-6 w-6 text-[#6f7a6e]" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-[#0b1c30]">No Certificates Yet</h3>
            <p className="text-sm text-[#6f7a6e]">Complete your first e-waste pickup to earn a certificate.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
