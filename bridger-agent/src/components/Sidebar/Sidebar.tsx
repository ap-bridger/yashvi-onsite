"use client";

import {
  CoinsIcon,
  EyeIcon,
  GearIcon,
  HouseIcon,
  ScrollIcon,
} from "@phosphor-icons/react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Sidebar = () => {
  const pathname = usePathname();

  const trackItems = [
    { label: "Overview", href: "/", icon: <HouseIcon /> },
    { label: "Transactions", href: "/transactions", icon: <CoinsIcon /> },
    { label: "Forecast", href: "/forecast", icon: <EyeIcon /> },
  ];

  const servicesItems = [{ label: "Tax", href: "/tax", icon: <ScrollIcon /> }];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <aside className="px-5 w-48 min-h-screen border-r border-slate-200 bg-white">
      <p className="text-sm font-semibold text-black py-4">Bridger</p>

      <div className="pb-6">
        <p className="mt-2 text-[11px] font-semibold tracking-wide text-slate-400">
          TRACK
        </p>
        <nav className="mt-3 space-y-1">
          {trackItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  {
                    "bg-slate-200 text-slate-900": active,
                    "text-slate-700 hover:bg-slate-100": !active,
                  },
                )}
              >
                <span className={active ? "text-slate-900" : "text-slate-700"}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pb-6">
        <p className="text-[11px] font-semibold tracking-wide text-slate-400">
          SERVICES
        </p>
        <nav className="mt-3 space-y-1">
          {servicesItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                <span className={active ? "text-slate-900" : "text-slate-700"}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
