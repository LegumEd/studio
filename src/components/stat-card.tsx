
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: React.ReactNode;
    color?: string;
}

export function StatCard({ icon, color = 'bg-blue-500' }: StatCardProps) {
    return (
        <Card className="rounded-2xl shadow-soft dark:shadow-soft-dark overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="p-0 flex items-center justify-center">
                <div className={cn("p-4 rounded-full text-white m-4", color)}>
                   {icon}
                </div>
            </CardContent>
        </Card>
    )
}
