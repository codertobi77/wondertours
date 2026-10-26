"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/api-client";

// Pages d'authentification : sans chrome ET sans garde (la connexion
// elle-même doit rester accessible sans session).
const AUTH_PAGES = [
  "/dashboard/login",
  "/dashboard/forgot-password",
  "/dashboard/reset-password",
];

/**
 * Chrome du dashboard (sidebar + header) et garde de session côté
 * client : GET /api/auth/me au montage.
 *
 * - pas de session (401) → /dashboard/login ;
 * - /dashboard/users* hors admin → /dashboard (miroir de l'ancien
 *   proxy.ts ; l'API répond de toute façon 403 aux non-admins) ;
 * - pages d'auth : rendues sans chrome ni garde.
 *
 * L'autorisation réelle reste côté API PHP — chaque requête dashboard
 * y est re-vérifiée via le cookie wt_session.
 */
export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();

  const isAuthPage = AUTH_PAGES.includes(pathname);

  useEffect(() => {
    if (loading || isAuthPage) return;
    if (!session) {
      router.replace("/dashboard/login");
      return;
    }
    // Gestion des comptes : admin uniquement.
    if (session.role !== "admin" && pathname.startsWith("/dashboard/users")) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthPage, session, pathname, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading || !session) {
    // Garde en cours (ou redirection imminente) : ni chrome ni contenu.
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500" role="status">
          Chargement…
        </p>
      </div>
    );
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
        <Sidebar onClose={() => setSidebarOpen(false)} role={session.role} />
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
