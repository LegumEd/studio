
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

const transactionSchema = z.object({
  description: z.string().min(2, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  type: z.enum(["Income", "Expense"]),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
});

type Transaction = z.infer<typeof transactionSchema> & {
  id: string;
};

const incomeCategories = ["Fee Collection", "Miscellaneous"];
const expenseCategories = ["Rent", "Utilities", "Salaries", "Marketing", "Supplies", "Miscellaneous"];

export default function ExpensesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "Income", date: format(new Date(), "yyyy-MM-dd") }
  });

  const transactionType = watch("type");

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              ...data,
              id: doc.id,
              date: data.date,
          } as Transaction;
      });
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
    if (transaction) {
      setValue("description", transaction.description);
      setValue("amount", transaction.amount);
      setValue("type", transaction.type);
      setValue("category", transaction.category);
      setValue("date", transaction.date);
    } else {
      reset({ description: "", amount: 0, type: "Income", category: "", date: format(new Date(), "yyyy-MM-dd") });
    }
    setIsFormOpen(true);
  };

  const processSubmit = async (data: z.infer<typeof transactionSchema>) => {
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

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Total Income</CardDescription>
                <CardTitle className="text-3xl text-green-600">₹{totalIncome.toLocaleString()}</CardTitle>
            </CardHeader>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Total Expenses</CardDescription>
                <CardTitle className="text-3xl text-red-600">₹{totalExpenses.toLocaleString()}</CardTitle>
            </CardHeader>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Net Balance</CardDescription>
                <CardTitle className={`text-3xl ${netBalance >= 0 ? 'text-foreground' : 'text-red-600'}`}>₹{netBalance.toLocaleString()}</CardTitle>
            </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Transactions</CardTitle>
          <CardDescription>Track all income and expenses.</CardDescription>
           <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8 mt-4">
              <div className="flex gap-4 w-full md:w-auto">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto flex items-center gap-2">
                 <Button size="sm" className="h-8 gap-1" onClick={() => openForm()}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Transaction
                    </span>
                </Button>
              </div>
            </div>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.date), "PPP")}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{t.description}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell className={`text-right font-medium ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'Income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">No transactions found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register("description")} />
                {errors.description && <p className="text-destructive text-sm mt-1">{errors.description.message}</p>}
              </div>
               <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" {...register("amount")} />
                {errors.amount && <p className="text-destructive text-sm mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      setValue("category", ""); // Reset category on type change
                    }} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Income">Income</SelectItem>
                        <SelectItem value="Expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                      <SelectContent>
                        {(transactionType === 'Income' ? incomeCategories : expenseCategories).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-destructive text-sm mt-1">{errors.category.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit">Save Transaction</Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

    </main>
  );
}
