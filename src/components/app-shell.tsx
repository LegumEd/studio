"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookUser, HandCoins, Settings, Target, Scale } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import Header from './header';

const AppShell = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();

    const menuItems = [
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
                            Lex Legum
                        </h1>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        {menuItems.map((item) => (
                             <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname.startsWith(item.href)}
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
            <SidebarInset>
                <div className="flex flex-col h-full">
                    <Header />
                    <div className="flex-1 overflow-y-auto">
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default AppShell;
