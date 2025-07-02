"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useUserNavigation } from "@/hooks/use-user-navigation";

export function MainNav() {
  const pathname = usePathname();
  const { userNavItems } = useUserNavigation();

  return (
    <SidebarMenu>
      {userNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.description || item.label}
          >
            <Link href={item.href}>
              {/* This span wrapper fixes a bug where `asChild` causes a crash when the Link has multiple children */}
              <span className="flex items-center gap-2">
                <item.icon />
                <span>{item.label}</span>
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
