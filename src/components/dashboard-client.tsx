
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, Target, Scale, TrendingUp, TrendingDown, PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TransactionForm from './transaction-form';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';
import { Button } from './ui/button';

type DashboardClientProps = {
  stats: {
    studentCount: number;
    courseCount: number;
    pendingEnquiries: number;
  };
  chartData: any[];
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
};

export default function DashboardClient({ stats, chartData, totalIncome, totalExpenses, netBalance }: DashboardClientProps) {
  const { studentCount, courseCount, pendingEnquiries } = stats;
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const { toast } = useToast();

  const handleAddExpense = async (data: Omit<Transaction, 'id'>) => {
    try {
        await addDoc(collection(db, "transactions"), data);
        toast({ title: "Success", description: "Expense added successfully." });
        setIsExpenseFormOpen(false);
    } catch (error) {
        console.error("Error adding expense:", error);
        toast({ title: "Error", description: "Failed to add expense.", variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="Dashboard" subtitle="Welcome to Lex Legum Academy" />
      <main className="flex-1 p-4 md:p-6 grid gap-4 md:gap-6">
        <Card className="rounded-2xl shadow-soft dark:shadow-soft-dark">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Last 7 Days Income vs. Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "14px" }} />
                <Line type="monotone" dataKey="Income" stroke="hsl(var(--chart-2))" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Expenses" stroke="hsl(var(--destructive))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-2xl shadow-soft dark:shadow-soft-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">₹{totalIncome.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-soft dark:shadow-soft-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <div className="flex items-center gap-2">
                 <TransactionForm
                    isOpen={isExpenseFormOpen}
                    setIsOpen={setIsExpenseFormOpen}
                    onSubmit={handleAddExpense as any}
                    initialType="Expense"
                    triggerButton={
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <PlusCircle className="h-5 w-5 text-destructive" />
                        </Button>
                    }
                 />
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">₹{totalExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-soft dark:shadow-soft-dark">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Scale className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-500" : "text-red-500"}`}>₹{netBalance.toLocaleString()}</div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<Users className="h-5 w-5" />} value={studentCount} color="bg-blue-500" />
          <StatCard icon={<BookOpen className="h-5 w-5" />} value={courseCount} color="bg-orange-500" />
          <StatCard icon={<Target className="h-5 w-5" />} value={pendingEnquiries} color="bg-yellow-500" />
        </div>
      </main>
    </div>
  );
}
