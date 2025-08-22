
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReportCardProps {
    title: string;
    value: string;
    description?: string;
    isNegative?: boolean;
}

export function ReportCard({ title, value, description, isNegative = false }: ReportCardProps) {
    return (
        <Card className="rounded-2xl shadow-soft dark:shadow-soft-dark">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={cn(
                    "text-3xl font-bold",
                     isNegative ? "text-red-600" : "text-gray-900 dark:text-gray-50"
                )}>
                    {value}
                </div>
                {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
}

    