'use client';

import Link from "next/link";
import { Logo } from "@/components/logo";
import { MainNav } from "@/components/main-nav";
import { BottomNavigation } from "@/components/bottom-navigation";
import { MobileMenu, MobileMenuButton } from "@/components/mobile-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { HelpCircle, LogOut } from "lucide-react";
import type React from "react";
import { handleSignOut } from '@/app/auth/actions';
import { useState } from "react";

interface DashboardLayoutProps {
  readonly children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/help">
                <HelpCircle />
                <span>Ajuda e Suporte</span>
              </Link>
            </SidebarMenuButton>
            <form action={handleSignOut} className="w-full">
               <SidebarMenuButton type="submit" className="w-full">
                <LogOut />
                <span>Sair</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/50 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
          <SidebarTrigger className="hidden md:inline-flex" />
          <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)} />
          <div className="w-full flex-1">
            {/* Can add breadcrumbs or page title here */}
          </div>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pb-20 md:pb-6">
          {children}
        </main>
        <BottomNavigation />
      </SidebarInset>
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </SidebarProvider>
  );
}
