"use client";

import { LogOut, Menu, ChevronDown, Upload, Search } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useState } from "react";
import type { Session } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  editor: "Éditeur",
  viewer: "Lecteur",
};

interface HeaderProps {
  onMenuClick?: () => void;
  /** Session courante (passée par le layout serveur) — nom, email, rôle. */
  user?: Session | null;
}

export function Header({ onMenuClick, user }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  async function handlePublish() {
    setPublishing(true);
    setPublishMsg(null);
    try {
      const res = await fetch("/api/dashboard/publish", { method: "POST" });
      if (res.ok) {
        setPublishMsg("Rebuild déclenché — le site sera mis à jour dans ~3 min.");
      } else {
        setPublishMsg("Échec du déclenchement.");
      }
    } catch {
      setPublishMsg("Erreur réseau.");
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishMsg(null), 5000);
    }
  }

  const userName = user?.name ?? user?.email ?? "Utilisateur";
  const userInitial = userName.charAt(0).toUpperCase();
  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : null;

  /** Déconnexion : invalide le cookie de session côté API puis recharge —
   * la garde client du layout renvoie alors vers /dashboard/login. */
  async function handleLogout() {
    setShowUserMenu(false);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.assign("/dashboard/login");
  }

  const canPublish = user?.role === "admin" || user?.role === "editor";


  return (
    <>
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:text-primary transition-colors"
          >
            <Menu className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            {canPublish && (
              <button
                onClick={() => void handlePublish()}
                disabled={publishing}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-full transition-colors disabled:opacity-50"
                title="Rebuild et redéploie le site public"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden md:inline">{publishing ? "Publication…" : "Publier le site"}</span>
              </button>
            )}
            {publishMsg && (
              <span className="text-xs text-gray-600 max-w-[200px] truncate">{publishMsg}</span>
            )}
            {publishing && (
              <div className="w-24">
                <ProgressBar active={publishing} />
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 pl-1 sm:pl-2 md:pl-4 border-l border-gray-200 relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1 md:gap-2"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 bg-black rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-lg border-2 border-amber-500">
                  {userInitial}
                </div>
                <span className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium text-gray-900">{userName}</span>
                  {roleLabel && (
                    <span className="text-xs text-gray-500">{roleLabel}</span>
                  )}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600 md:hidden" />
              </button>
              <button
                className="hidden md:block p-2 text-gray-600 hover:text-red-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleLogout();
                }}
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Mobile User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 md:hidden">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-amber-500">
                        {userInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{userName}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        {roleLabel && (
                          <p className="text-xs text-gray-400">{roleLabel}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => {
                        void handleLogout();
                      }}
                    >
                      <LogOut className="w-5 h-5 text-red-600" />
                      <span className="text-red-600">Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

    </>
  );
}
