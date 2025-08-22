
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color?: string;
}

export function StatCard({ title, value, icon, color = 'bg-blue-500' }: StatCardProps) {
    return (
        <Card className="rounded-2xl shadow-soft dark:shadow-soft-dark overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</CardTitle>
                <div className={cn("p-1.5 rounded-full text-white", color)}>
                   {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">{value}</div>
            </CardContent>
        </Card>
    )
}

    