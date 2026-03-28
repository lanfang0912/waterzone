"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin/dashboard",     label: "Dashboard",        icon: "▦" },
  { href: "/admin/landing-pages", label: "Landing Pages",    icon: "◫" },
  { href: "/admin/subscribers",   label: "Subscribers",      icon: "◑" },
  { href: "/admin/email-logs",    label: "Email Logs",       icon: "✉" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200">
        <span className="font-bold text-gray-900 text-base">Urland Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm
                     text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <span className="text-base leading-none">→</span>
          登出
        </button>
      </div>
    </aside>
  );
}
