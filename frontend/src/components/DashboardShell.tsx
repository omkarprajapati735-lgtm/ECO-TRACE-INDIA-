"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
  /** The active role tab (e.g., "Ops Hub", "Collector", "Hub Mgr", "Recycler") */
  activeRole?: string;
  /** User display name */
  userName?: string;
  /** User role subtitle */
  userRole?: string;
  /** Profile image URL (optional) */
  profileImage?: string;
}

const NAV_ITEMS = [
  { section: "Operations Core", items: [
    { label: "Overview & Lifecycle", icon: "hub", href: "/" },
  ]},
  { section: "Circularity Value Chain", items: [
    { label: "Consumer Portal", icon: "recycling", href: "/consumer/dashboard" },
    { label: "Collector Operations", icon: "local_shipping", href: "/collector/dashboard" },
    { label: "Hub Intake & Inventory", icon: "warehouse", href: "/hub/intake" },
    { label: "Recycler & EPR Credits", icon: "verified", href: "/recycler/dashboard" },
  ]},
  { section: "Governance", items: [
    { label: "Admin Command", icon: "admin_panel_settings", href: "/admin/dashboard" },
  ]},
];

const ROLE_TABS = ["Ops Hub", "Consumer", "Collector", "Hub Mgr", "Recycler"];

export default function DashboardShell({
  children,
  activeRole = "Ops Hub",
  userName = "Rajesh Patel",
  userRole = "Ops Lead (Western Hub)",
  profileImage,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Brand */}
          <div className="dashboard-sidebar-brand">
            <div style={{
              width: 32, height: 32, borderRadius: "8px",
              background: "var(--color-primary)", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
              <span className="material-symbols-outlined" style={{ color: "white", fontSize: 20 }}>eco</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="brand-name" style={{ fontFamily: "var(--font-headline)", fontWeight: 600, fontSize: 16, color: "var(--color-on-surface)", letterSpacing: "-0.01em", lineHeight: 1 }}>EcoTrace</span>
              <span className="brand-sub" style={{ fontFamily: "var(--font-code)", fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", color: "var(--color-primary)", textTransform: "uppercase", lineHeight: 1.2 }}>India&nbsp;</span>
            </div>
          </div>

          {/* Registry Pill */}
          <div style={{ padding: "0 var(--space-md)", marginBottom: "var(--space-sm)" }}>
            <div className="sidebar-registry-pill">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }}></span>
                <span className="text-label-sm" style={{ color: "var(--color-on-surface)" }}>CPCB Registry</span>
              </div>
              <span className="text-label-code" style={{ color: "var(--color-primary)", fontWeight: 600 }}>V3.8-SYNC</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((section) => (
              <div key={section.section}>
                <div className="sidebar-nav-section">{section.section}</div>
                {section.items.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link ${isActive ? "active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
                      <span className="text-body-md">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer EPR Quota */}
          <div className="sidebar-footer">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="text-label-sm" style={{ color: "var(--color-on-surface-variant)" }}>Western Node Intake</span>
              <span className="text-label-code" style={{ color: "var(--color-primary)", fontWeight: 700 }}>84.2 MT</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill primary" style={{ width: "72%" }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="text-label-code" style={{ color: "var(--color-on-surface-variant)" }}>EPR Quota Target</span>
              <span className="text-label-code" style={{ color: "var(--color-on-surface)", fontWeight: 600 }}>116 MT</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area (right of sidebar) */}
      <div style={{ paddingLeft: "var(--sidebar-width)" }}>
        {/* Header */}
        <header className="dashboard-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
            {/* Role Switcher */}
            <div className="header-role-switcher">
              {ROLE_TABS.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`header-role-btn ${role === activeRole ? "active" : ""}`}
                >
                  {role}
                </button>
              ))}
            </div>
            {/* System Status */}
            <div className="header-status-badge" style={{ display: "none" }}>
              <span className="dot"></span>
              <span>All Systems Operational • CPCB Node Connected</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
            {/* Notifications */}
            <button type="button" className="header-notification-btn" aria-label="Notifications">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
              <span className="badge"></span>
            </button>
            {/* Profile */}
            <div className="header-profile" style={{ paddingLeft: "var(--space-sm)" }}>
              <div className="header-profile-text">
                <span className="name">{userName}</span>
                <span className="role">{userRole}</span>
              </div>
              {profileImage ? (
                <img alt="Profile" className="header-profile-avatar" src={profileImage} />
              ) : (
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "var(--color-primary-container)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "var(--color-on-primary-container)"
                }}>
                  {userName.split(" ").map(n => n[0]).join("").toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="dashboard-main" style={{ marginLeft: 0 }}>
          <div className="dashboard-content">
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-sidebar { display: none !important; }
          .dashboard-header { left: 0 !important; }
          [style*="padding-left: var(--sidebar-width)"] {
            padding-left: 0 !important;
          }
          .header-status-badge { display: none !important; }
        }
        @media (min-width: 1280px) {
          .header-status-badge { display: flex !important; }
        }
      `}</style>
    </>
  );
}
