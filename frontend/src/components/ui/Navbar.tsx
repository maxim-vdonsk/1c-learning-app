"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { BookOpen, LayoutDashboard, Code2, LogOut, Zap, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  const navItems = [
    { href: "/dashboard", icon: <LayoutDashboard size={16} />, label: "Главная" },
    { href: "/lessons", icon: <BookOpen size={16} />, label: "Уроки" },
    { href: "/tasks", icon: <Code2 size={16} />, label: "Задачи" },
  ];

  return (
    <nav
      style={{
        background: "rgba(13, 13, 26, 0.95)",
        borderBottom: "1px solid var(--cyber-border)",
        backdropFilter: "blur(12px)",
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="level-badge text-xs">1C</div>
          <span
            className="font-display font-bold text-sm tracking-wider glow-red"
            style={{ color: "var(--neon-red)" }}
          >
            АКАДЕМИЯ
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all
                  ${active ? "text-white" : "text-gray-400 hover:text-gray-200"}`}
                style={
                  active
                    ? {
                        background: "rgba(255, 34, 0, 0.15)",
                        border: "1px solid rgba(255, 34, 0, 0.3)",
                        color: "var(--neon-red)",
                      }
                    : {}
                }
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <Zap size={12} style={{ color: "var(--neon-orange)" }} />
                <span className="xp-badge">{user.xp_points} XP</span>
                <span className="level-badge text-xs" style={{ width: 28, height: 28, fontSize: "0.7rem" }}>
                  {user.level}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-mono hidden sm:block">
                {user.username}
              </span>
            </>
          )}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 hover:text-red-400 transition-colors"
            title="Выйти"
          >
            <LogOut size={14} />
          </button>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white transition-colors"
            style={{ border: "1px solid var(--cyber-border)" }}
            aria-label="Меню"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div
          className="sm:hidden border-t"
          style={{ borderColor: "var(--cyber-border)", background: "rgba(10, 10, 20, 0.98)" }}
        >
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-mono transition-all w-full"
                  style={
                    active
                      ? {
                          background: "rgba(255, 34, 0, 0.15)",
                          border: "1px solid rgba(255, 34, 0, 0.3)",
                          color: "var(--neon-red)",
                        }
                      : { color: "#aaa", border: "1px solid transparent" }
                  }
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}

            {user && (
              <div className="pt-3 mt-2 border-t" style={{ borderColor: "var(--cyber-border)" }}>
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap size={12} style={{ color: "var(--neon-orange)" }} />
                    <span className="xp-badge">{user.xp_points} XP</span>
                    <span
                      className="level-badge text-xs flex-shrink-0"
                      style={{ width: 24, height: 24, fontSize: "0.65rem" }}
                    >
                      {user.level}
                    </span>
                    <span className="text-xs text-gray-400 font-mono truncate">{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                    title="Выйти"
                  >
                    <LogOut size={14} />
                    <span className="font-mono">Выйти</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
