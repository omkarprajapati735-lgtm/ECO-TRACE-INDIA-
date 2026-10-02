"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { Menu, X, Leaf, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
}

export interface NavSection {
  section?: string;
  items: NavItem[];
}

interface DashboardShellProps {
  children: ReactNode;
  navItems: NavSection[];
  activeRole?: string;
  userName?: string;
  userRole?: string;
  profileImage?: string;
}

export default function DashboardShell({
  children,
  navItems,
  activeRole = "Dashboard",
  userName = "User",
  userRole = "Role",
  profileImage,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[#f8f9ff]">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[288px] flex-col justify-between bg-white shadow-sm transition-transform duration-300 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex h-[64px] items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00652c]">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-['Geist'] text-base font-semibold leading-none tracking-tight text-[#0b1c30]">EcoTrace</span>
                <span className="font-['JetBrains_Mono'] text-xs font-medium uppercase leading-tight tracking-wider text-[#00652c]">India&nbsp;</span>
              </div>
            </div>
            <button className="lg:hidden" onClick={() => setIsMobileOpen(false)}>
              <X className="h-5 w-5 text-[#3f493f]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {navItems.map((section, idx) => (
              <div key={idx}>
                {section.section && (
                  <div className="px-2 pb-2 font-['Inter'] text-[11px] font-semibold uppercase tracking-widest text-[#6f7a6e]">
                    {section.section}
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 font-['Inter'] text-sm transition-colors",
                          isActive 
                            ? "bg-[#15803d] font-semibold text-white" 
                            : "text-[#3f493f] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                        )}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile Mini */}
          <div className="m-4 rounded-xl bg-[#eff4ff] p-4">
             <div className="flex items-center gap-3">
                {profileImage ? (
                  <img src={profileImage} alt={userName} className="h-10 w-10 rounded-full bg-[#15803d]" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#15803d] text-sm font-bold text-[#d3ffd5]">
                    {userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0b1c30]">{userName}</span>
                  <span className="text-xs text-[#6f7a6e]">{userRole}</span>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex flex-1 flex-col lg:pl-[288px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between bg-white/90 px-6 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu className="h-5 w-5 text-[#0b1c30]" />
            </button>
            <h1 className="hidden font-['Geist'] text-lg font-semibold text-[#0b1c30] sm:block">
              {activeRole}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-[#3f493f] hover:text-[#0b1c30]">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ba1a1a] text-[10px] font-bold text-white">
                3
              </span>
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
