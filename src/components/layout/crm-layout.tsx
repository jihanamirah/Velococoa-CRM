"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  PlusCircle,
  Package,
  ArrowUpRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState, useEffect } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Daftar Leads', href: '/leads' },
  { icon: Kanban, label: 'Pipeline Kanban', href: '/kanban' },
  { icon: PlusCircle, label: 'Tambah Lead', href: '/leads/new' },
];

export function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "notifications"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let unread = 0;
      if (snapshot.empty) {
        const initial = [
          { type: 'lead_baru', title: 'Lead Baru Masuk!', body: 'Kopi Kenangan Senja - Kafe & Kedai Kopi', createdAt: new Date(Date.now() - 7200000), read: false, color: 'text-blue-500 bg-blue-500/10' },
          { type: 'follow_up', title: 'Follow Up Diperlukan!', body: 'Sweet Bakery belum dihubungi lebih dari 24 jam', createdAt: new Date(Date.now() - 86400000), read: false, color: 'text-amber-500 bg-amber-500/10' },
          { type: 'keputusan', title: 'Keputusan Diperlukan!', body: 'Grand Aston Hotel menunggu keputusan Won atau Lost', createdAt: new Date(Date.now() - 172800000), read: true, color: 'text-red-500 bg-red-500/10' },
        ];
        initial.forEach(n => addDoc(collection(db, "notifications"), n).catch(() => {}));
        unread = 2;
      } else {
        snapshot.forEach((doc) => {
          if (!doc.data().read) {
            unread++;
          }
        });
      }
      setUnreadCount(unread);
    }, (err) => {
      console.warn("Failed to listen to notifications in layout:", err);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <Sidebar className="border-r border-border/50 shadow-xl" collapsible="icon">
          <SidebarHeader className="p-4 flex items-center gap-2">
            <img src="/logo.png" alt="VeloCocoa Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden">
              VeloCocoa
            </span>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/50">
             <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Settings">
                    <Link href="/settings" className="flex items-center gap-3">
                      <Settings className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="text-destructive hover:text-destructive" tooltip="Log out">
                    <Link href="/login" className="flex items-center gap-3">
                      <LogOut className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-card/30 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="hidden sm:block text-sm font-medium text-muted-foreground">
                PT VeloCocoa Indonesia • <span className="text-foreground">Jakarta Office</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-accent text-white border-none text-[10px] animate-pulse">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <div className="h-8 w-px bg-border/50 mx-2 hidden md:block"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold">Jihan Amirah</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary border-2 border-primary/20">
                  JA
                </div>
              </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}