
"use client"

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookUser, HandCoins, Settings, Target, Scale, LayoutDashboard } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Header from './header';
import { useToast } from "@/hooks/use-toast";

const AppShell = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const { toast } = useToast();

    useEffect(() => {
        toast({
            title: "Welcome to Lex Legum Academy!",
            description: "Your student management hub.",
        });
    }, [toast]);

    const menuItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/enrollments', label: 'Enrollments', icon: BookUser },
        { href: '/enquiries', label: 'Enquiries', icon: Target },
        { href: '/expenses', label: 'Expenses & Income', icon: HandCoins },
        { href: '/settings', label: 'Settings', icon: Settings },
    ];
    
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                     <div className="flex items-center gap-2 p-2">
                        <Scale className="h-8 w-8 text-sidebar-primary" />
                        <h1 className="text-xl font-headline font-semibold text-sidebar-primary group-data-[collapsible=icon]:hidden">
                            Management
                        </h1>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        {menuItems.map((item) => (
                             <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                    tooltip={item.label}
                                >
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    {/* Footer content if any */}
                </SidebarFooter>
            </Sidebar>
            <div className="flex flex-col h-full w-full">
                <Header />
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </SidebarProvider>
    )
}

export default AppShell;
