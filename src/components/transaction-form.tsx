
"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transactionSchema, Transaction } from "@/lib/types";
import { format } from "date-fns";

const incomeCategories = ["Fee Collection", "Sales", "Miscellaneous"];
const expenseCategories = ["Rent", "Utilities", "Salaries", "Marketing", "Supplies", "Miscellaneous"];

type FormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSubmit: (data: Omit<Transaction, 'id'>) => void;
    transaction?: Transaction | null;
    triggerButton?: React.ReactNode;
    initialType?: "Income" | "Expense";
}

export default function TransactionForm({ isOpen, setIsOpen, onSubmit, transaction, triggerButton, initialType = "Income"}: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "Income", date: format(new Date(), "yyyy-MM-dd") }
  });

  const transactionType = watch("type");

  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        reset({
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            date: transaction.date,
        });
      } else {
        reset({
            description: "",
            amount: 0,
            type: initialType,
            category: "",
            date: format(new Date(), "yyyy-MM-dd")
        });
      }
    }
  }, [isOpen, transaction, reset, initialType]);
  
  const handleFormSubmit = (data: FormValues) => {
    onSubmit(data);
  }

  const formContent = (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
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
                <Select onValueChange={field.onChange} value={field.value} disabled={!transactionType}>
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
  );

  return (
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
          <DialogDescription>
            {transaction ? "Update the details of the transaction." : "Fill in the details for the new transaction."}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )

}
