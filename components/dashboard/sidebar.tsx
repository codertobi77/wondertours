"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/lib/auth";
import {
  LayoutDashboard,
  Map,
  MapPin,
  Tag,
  Tags,
  MessageSquare,
  FileText,
  Briefcase,
  Calendar,
  Mail,
  Settings,
  Image as ImageIcon,
  Users,
  X,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Réservé aux administrateurs (ex. gestion des comptes). */
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Circuits", href: "/dashboard/circuits", icon: Map },
  { name: "Destinations", href: "/dashboard/destinations", icon: MapPin },
  { name: "Catégories", href: "/dashboard/categories", icon: Tag },
  { name: "Témoignages", href: "/dashboard/testimonials", icon: MessageSquare },
  { name: "Blog", href: "/dashboard/blog", icon: FileText },
  { name: "Catégories blog", href: "/dashboard/blog-categories", icon: Tags },
  { name: "Services", href: "/dashboard/services", icon: Briefcase },
  { name: "Réservations", href: "/dashboard/bookings", icon: Calendar },
  { name: "Contact", href: "/dashboard/contact", icon: Mail },
  { name: "Médiathèque", href: "/dashboard/media", icon: ImageIcon },
  { name: "Utilisateurs", href: "/dashboard/users", icon: Users, adminOnly: true },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
  /** Rôle de la session — masque les entrées adminOnly aux autres rôles. */
  role?: UserRole;
}

export function Sidebar({ onClose, role }: SidebarProps) {
  const pathname = usePathname();
  const items = navigation.filter((item) => !item.adminOnly || role === "admin");

  return (
    <div className="w-64 md:w-72 lg:w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center" onClick={onClose}>
          <span className="font-heading font-bold text-lg md:text-xl text-primary">
            Wonder Tours and Services
          </span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs md:text-sm text-gray-500 px-4 md:px-6 pb-3 md:pb-4">Panel d&apos;administration</p>

      {/* Navigation */}
      <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center space-x-2 md:space-x-3 px-2 md:px-3 py-2 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 md:p-4 border-t border-gray-200">
        <Link
          href="/"
          className="flex items-center space-x-2 text-xs md:text-sm text-gray-600 hover:text-primary transition-colors"
        >
          <span>← Retour au site</span>
        </Link>
      </div>
    </div>
  );
}
