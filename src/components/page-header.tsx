
"use client";

import { cn } from "@/lib/utils"

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
    return (
        <header className={cn("sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6 no-print", className)}>
            <div>
                <h1 className="text-2xl font-bold font-headline text-gray-900 dark:text-gray-50">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
                {children}
            </div>
        </header>
    )
}

    