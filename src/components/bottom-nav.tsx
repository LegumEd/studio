
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquareQuestion, ShoppingCart, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/enrollments', label: 'Students', icon: Users },
  { href: '/enquiries', label: 'Enquiries', icon: MessageSquareQuestion },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background shadow-lg md:hidden no-print">
      <div className="mx-auto grid h-16 max-w-md grid-cols-6 items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 text-center">
                <item.icon
                    className={cn(
                        "h-6 w-6 transition-colors",
                        isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"
                    )}
                />
                <span className={cn(
                    "text-xs font-medium transition-colors",
                    isActive ? "text-primary" : "text-gray-600 dark:text-gray-300"
                )}>
                    {item.label}
                </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

    