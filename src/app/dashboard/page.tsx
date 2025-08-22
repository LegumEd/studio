
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, Target, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

type Transaction = {
  type: "Income" | "Expense";
  amount: number;
  category: string;
  date: string;
};

export default function DashboardPage() {
  const [studentCount, setStudentCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [pendingEnquiries, setPendingEnquiries] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const studentsUnsub = onSnapshot(collection(db, "students"), (snapshot) => setStudentCount(snapshot.size));
    const coursesUnsub = onSnapshot(collection(db, "courses"), (snapshot) => setCourseCount(snapshot.size));
    const enquiriesQuery = query(collection(db, "enquiries"), where("status", "==", "Pending"));
    const enquiriesUnsub = onSnapshot(enquiriesQuery, (snapshot) => setPendingEnquiries(snapshot.size));
    const transactionsUnsub = onSnapshot(collection(db, "transactions"), (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => doc.data() as Transaction);
      setTransactions(transactionsData);
    });

    return () => {
      studentsUnsub();
      coursesUnsub();
      enquiriesUnsub();
      transactionsUnsub();
    };
  }, []);

  const { totalIncome, totalExpenses, netBalance } = useMemo(() => {
    const income = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
    };
  }, [transactions]);
  
  const chartData = useMemo(() => {
    const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    return last7Days.map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        const dailyTransactions = transactions.filter(t => t.date === dateString);
        const income = dailyTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = dailyTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
        return {
            date: format(day, 'MMM d'),
            Income: income,
            Expenses: expenses,
        };
    });
  }, [transactions]);


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
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `₹${Number(value)/1000}k`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))"
                                }}
                            />
                            <Legend wrapperStyle={{fontSize: "14px"}}/>
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
                        <TrendingDown className="h-4 w-4 text-red-500" />
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
                <StatCard icon={<Users className="h-5 w-5" />} color="bg-blue-500" />
                <StatCard icon={<BookOpen className="h-5 w-5" />} color="bg-orange-500" />
                <StatCard icon={<Target className="h-5 w-5" />} color="bg-yellow-500" />
            </div>
        </main>
    </div>
  );
}
