
import { getDashboardStats, getTransactionChartData } from "@/lib/dashboard-data";
import DashboardClient from "@/components/dashboard-client";

export const revalidate = 60; // Revalidate data every 60 seconds

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const { chartData, totalIncome, totalExpenses, netBalance } = await getTransactionChartData();

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardClient
            stats={stats}
            chartData={chartData}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            netBalance={netBalance}
        />
    </div>
  );
}
