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

interface Props {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  className?: string;
}

const SidebarLink = ({ href, icon, label, active, className }: Props) => {
  return (
    <Link
      key={href}
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        {
          "bg-slate-200 text-slate-900": active,
          "text-slate-700 hover:bg-slate-100": !active,
        },
        className,
      )}
    >
      <span className={active ? "text-slate-900" : "text-slate-700"}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
};

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
    <aside className="relative px-5 w-48 min-h-screen border-r border-slate-200 bg-white">
      <p className="text-sm font-semibold text-black py-4">Bridger</p>

      <div className="pb-6">
        <p className="mt-2 text-[11px] font-semibold tracking-wide text-slate-400">
          TRACK
        </p>
        <nav className="mt-3 space-y-1">
          {trackItems.map((item) => {
            const active = isActive(item.href);
            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={active}
              />
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
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={active}
              />
            );
          })}
        </nav>
      </div>

      <SidebarLink
        href="/settings"
        icon={<GearIcon />}
        label="Settings"
        active={isActive("/settings")}
        className="absolute bottom-5 left-5"
      />
    </aside>
  );
};
