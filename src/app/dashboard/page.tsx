
import { getDashboardStats, getTransactionChartData } from "@/lib/dashboard-data";
import DashboardClient from "@/components/dashboard-client";

export const revalidate = 60; // Revalidate data every 60 seconds

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const { chartData, totalIncome, totalExpenses, netBalance } = await getTransactionChartData();

  return (
    <DashboardClient
      stats={stats}
      chartData={chartData}
      totalIncome={totalIncome}
      totalExpenses={totalExpenses}
      netBalance={netBalance}
    />
  );
}
