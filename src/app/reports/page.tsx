
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PageHeader } from '@/components/page-header';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Student, Sale, Transaction } from '@/lib/types';
import { ReportCard } from '@/components/report-card';
import { Download } from 'lucide-react';


type ChartData = {
  date: string;
  income: number;
  expenses: number;
};

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeRange, setTimeRange] = useState('last_30_days');

  useEffect(() => {
    const studentsUnsub = onSnapshot(collection(db, "students"), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Student));
    });
    const salesUnsub = onSnapshot(collection(db, "sales"), (snapshot) => {
      setSales(snapshot.docs.map(doc => doc.data() as Sale));
    });
    const transactionsUnsub = onSnapshot(query(collection(db, "transactions"), orderBy("date", "desc")), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
    });

    return () => {
      studentsUnsub();
      salesUnsub();
      transactionsUnsub();
    };
  }, []);

  const {
    totalStudents,
    newStudentsThisMonth,
    totalRevenue,
    salesRevenue,
    enrollmentRevenue,
    totalExpenses,
    netBalance
  } = useMemo(() => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);

    const newStudents = students.filter(s => new Date(s.enrollmentDate) >= startOfCurrentMonth).length;
    
    const income = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    const sales = transactions.filter(t => t.category === 'Sales' && t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const enrollments = transactions.filter(t => t.category === 'Fee Collection' && t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);

    return {
      totalStudents: students.length,
      newStudentsThisMonth: newStudents,
      totalRevenue: income,
      salesRevenue: sales,
      enrollmentRevenue: enrollments,
      totalExpenses: expenses,
      netBalance: income - expenses,
    };
  }, [students, sales, transactions]);

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch(timeRange) {
      case 'last_7_days':
        startDate = subDays(now, 6);
        break;
      case 'this_month':
        startDate = startOfMonth(now);
        break;
       case 'this_week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'last_30_days':
      default:
        startDate = subDays(now, 29);
        break;
    }
    
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

    const groupedData = dateInterval.map(date => {
        const dateString = format(date, 'yyyy-MM-dd');
        const dailyTransactions = transactions.filter(t => t.date === dateString);
        
        const income = dailyTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = dailyTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

        return {
            date: format(date, 'MMM d'),
            income,
            expenses
        }
    });

    return groupedData;
  }, [transactions, timeRange]);
  
  const handlePrint = () => {
    window.print();
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="Reports" />
      <main className="flex-1 p-4 md:p-6 grid gap-4 md:gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ReportCard title="Total Students" value={totalStudents.toString()} description={`${newStudentsThisMonth} new this month`} />
            <ReportCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} description="All income sources" />
            <ReportCard title="Total Expenses" value={`₹${totalExpenses.toLocaleString()}`} isNegative />
            <ReportCard title="Net Balance" value={`₹${netBalance.toLocaleString()}`} isNegative={netBalance < 0} />
        </div>
       
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <div>
                 <CardTitle>Financial Overview</CardTitle>
                 <CardDescription>Income vs. Expenses</CardDescription>
               </div>
                <div className="flex items-center gap-2">
                     <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                            <SelectItem value="this_week">This Week</SelectItem>
                            <SelectItem value="this_month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={handlePrint} className="no-print">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="hsl(var(--chart-2))" activeDot={{ r: 8 }} name="Income" />
                    <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" name="Expenses" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

      </main>
    </div>
  );
}

    