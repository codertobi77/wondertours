import type { Metadata } from "next";
import { DashboardLayoutClient } from "./dashboard-layout-client";

export const metadata: Metadata = {
  title: "Dashboard - Wonder Tours and Services",
  description: "Panel d'administration Wonder Tours and Services",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Chrome + garde de session côté client (DashboardLayoutClient via
  // GET /api/auth/me) : l'export statique ne peut plus lire les cookies
  // serveur — l'autorisation réelle reste vérifiée par l'API PHP à
  // chaque requête.
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
