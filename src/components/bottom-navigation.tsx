"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FilePlus2,
  MapPin,
  User,
  Home,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const bottomNavItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/dashboard/map",
    label: "Mapa",
    icon: MapPin,
  },
  {
    href: "/dashboard/report",
    label: "Reportar",
    icon: FilePlus2,
  },
  {
    href: "/dashboard/alerts",
    label: "Alertas",
    icon: Bell,
  },
  {
    href: "/dashboard/profile",
    label: "Perfil",
    icon: User,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
