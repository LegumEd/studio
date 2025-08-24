
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, ArrowUpRight, ArrowDownLeft, Scale, Printer } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from '@/components/page-header';
import { Transaction, transactionSchema } from '@/lib/types';
import TransactionForm from '@/components/transaction-form';

export default function ExpensesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Transaction);
      setTransactions(transactionsData);
    });

    return () => unsubscribe();
  }, []);
  
  const { totalIncome, totalExpenses, netBalance } = useMemo(() => {
    const income = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);
  

  const openForm = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const processSubmit = async (data: Omit<Transaction, 'id'>) => {
    try {
      if (editingTransaction) {
        const transactionRef = doc(db, "transactions", editingTransaction.id);
        await updateDoc(transactionRef, { ...data });
        toast({ title: "Success", description: "Transaction updated successfully." });
      } else {
        await addDoc(collection(db, "transactions"), { ...data });
        toast({ title: "Success", description: "Transaction added successfully." });
      }
      setIsFormOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error submitting transaction:", error);
      toast({ title: "Error", description: "Failed to save transaction.", variant: "destructive" });
    }
  };
  
  const handleDeleteClick = (id: string) => {
      setTransactionToDelete(id);
      setIsAlertOpen(true);
  }

  const confirmDelete = async () => {
    if (transactionToDelete) {
        try {
            await deleteDoc(doc(db, "transactions", transactionToDelete));
            toast({ title: "Success", description: "Transaction deleted successfully." });
        } catch (error) {
            console.error("Error deleting transaction:", error);
            toast({ title: "Error", description: "Failed to delete transaction.", variant: "destructive" });
        }
    }
    setIsAlertOpen(false);
    setTransactionToDelete(null);
  };
  
  const handlePrint = () => {
    const printContents = `
      <html>
        <head>
          <title>Transactions Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #23395d; padding-bottom: 10px; }
            h1 { color: #23395d; margin: 0; }
            .summary { display: flex; justify-content: space-around; margin: 20px 0; padding: 10px; background-color: #f8f9fa; border-radius: 8px; }
            .summary-item { text-align: center; }
            .summary-item p { margin: 0; font-size: 14px; color: #555; }
            .summary-item h3 { margin: 5px 0 0; font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .income { color: green; }
            .expense { color: red; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lex Legum Academy</h1>
            <p>Transactions Report</p>
          </div>
          <div class="summary">
            <div class="summary-item">
              <p>Total Income</p>
              <h3 class="income">₹${totalIncome.toLocaleString()}</h3>
            </div>
            <div class="summary-item">
              <p>Total Expenses</p>
              <h3 class="expense">₹${totalExpenses.toLocaleString()}</h3>
            </div>
            <div class="summary-item">
              <p>Net Balance</p>
              <h3 style="color: ${netBalance >= 0 ? 'green' : 'red'};">₹${netBalance.toLocaleString()}</h3>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => `
                <tr>
                  <td>${format(new Date(t.date), "PPP")}</td>
                  <td>${t.description}</td>
                  <td>${t.category}</td>
                  <td><span class="${t.type === 'Income' ? 'income' : 'expense'}">${t.type}</span></td>
                  <td style="text-align: right;" class="${t.type === 'Income' ? 'income' : 'expense'}">${t.type === 'Income' ? '+' : '-'}₹${t.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Report generated on ${format(new Date(), "PPP")}</p>
          </div>
        </body>
      </html>
    `;
    const win = window.open("", "Print");
    win?.document.write(printContents);
    win?.document.close();
    win?.print();
  }


  return (
     <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageHeader title="Expenses & Income" subtitle="Track all income and expenses">
            <TransactionForm 
                isOpen={isFormOpen} 
                setIsOpen={setIsFormOpen}
                onSubmit={processSubmit}
                transaction={editingTransaction}
                triggerButton={
                    <Button size="sm" className="h-8 gap-1" onClick={() => openForm()}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Transaction
                        </span>
                    </Button>
                }
            />
        </PageHeader>
        <main className="flex-1 p-4 md:p-6 grid gap-4 md:gap-6">
       <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <ArrowDownLeft className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={`text-3xl font-bold ${netBalance >= 0 ? 'text-foreground' : 'text-red-600'}`}>₹{netBalance.toLocaleString()}</div>
            </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <CardTitle>Transactions</CardTitle>
                <CardDescription>A list of all income and expense records.</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="h-8 gap-1 no-print" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Print Report
                </span>
              </Button>
            </div>
           <div className="flex items-center gap-2 mt-4">
              <div className="flex-1">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
        </CardHeader>
        <CardContent>
           <div className="grid gap-4">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <Card key={t.id} className="rounded-2xl shadow-soft dark:shadow-soft-dark">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={`p-3 rounded-full ${t.type === 'Income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                           {t.type === 'Income' ? <ArrowUpRight className="h-5 w-5 text-green-600" /> : <ArrowDownLeft className="h-5 w-5 text-red-600" />}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-gray-50">{t.description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.category}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{format(new Date(t.date), "PPP")}</p>
                        </div>
                        <div className="text-right">
                           <p className={`text-lg font-bold ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.type === 'Income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                           </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => openForm(t)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDeleteClick(t.id)} className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </CardContent>
                </Card>
              ))
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <p>No transactions found.</p>
                </div>
            )}
            </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete the transaction record.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
     </div>
  );
}
