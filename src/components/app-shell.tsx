
"use client"

import React, { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from './bottom-nav';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquareQuote, ShoppingCart, BarChart2, Settings, Scale, Package } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';


const AppShell = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const { toast } = useToast();

    useEffect(() => {
        const hasWelcomed = sessionStorage.getItem('welcomeToastShown');
        if (!hasWelcomed) {
            toast({
                title: "Welcome to Lex Legum Academy!",
                description: "Your student management hub.",
            });
            sessionStorage.setItem('welcomeToastShown', 'true');
        }
    }, [toast]);
    
    const navItems = [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/enrollments', label: 'Students', icon: Users },
      { href: '/enquiries', label: 'Enquiries', icon: MessageSquareQuote },
      { href: '/sales', label: 'Sales', icon: ShoppingCart },
      { href: '/inventory', label: 'Inventory', icon: Package },
      { href: '/reports', label: 'Reports', icon: BarChart2 },
      { href: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
           <SidebarProvider>
                {/* Desktop Sidebar */}
                <Sidebar className="hidden md:flex">
                    <SidebarHeader>
                        <div className="flex items-center gap-2 p-2">
                            <Scale className="h-8 w-8 text-sidebar-primary" />
                            <h1 className="text-xl font-headline font-semibold text-sidebar-primary group-data-[state=collapsed]:hidden">
                                Lex Legum
                            </h1>
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
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
                     <div className="p-2 mt-auto flex justify-center">
                        <ThemeToggle />
                    </div>
                </Sidebar>

                {/* Main Content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                        {children}
                    </main>
                    {/* Mobile Bottom Navigation */}
                    <BottomNav />
                </div>
            </SidebarProvider>
        </div>
    );
};

export default AppShell;
