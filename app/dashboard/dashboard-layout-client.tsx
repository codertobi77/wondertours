"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@/lib/auth";

export function DashboardLayoutClient({
  children,
  session,
}: {
  children: React.ReactNode;
  /** Session lue côté serveur (layout.tsx) — toujours absente sur /dashboard/login. */
  session: Session | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Les pages d'authentification (connexion, mot de passe oublié,
  // réinitialisation) s'affichent sans chrome (sidebar/header).
  const AUTH_PAGES = [
    "/dashboard/login",
    "/dashboard/forgot-password",
    "/dashboard/reset-password",
  ];
  if (AUTH_PAGES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} role={session?.role} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header onMenuClick={() => setSidebarOpen(true)} user={session} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
