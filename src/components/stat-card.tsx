
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: React.ReactNode;
    value: number | string;
    color?: string;
}

export function StatCard({ icon, value, color = 'bg-blue-500' }: StatCardProps) {
    return (
        <Card className="rounded-2xl shadow-soft dark:shadow-soft-dark overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-full text-white", color)}>
                   {icon}
                </div>
                <div>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}
