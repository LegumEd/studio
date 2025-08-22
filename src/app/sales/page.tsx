
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, Printer, ShoppingCart, User, IndianRupee } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import type { Sale, StudyMaterial } from "@/lib/types";
import { PageHeader } from '@/components/page-header';

const saleSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  materialId: z.string().min(1, "Please select a material"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  medium: z.enum(["English", "Hindi"]),
  collegeUniversity: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: { medium: "English", quantity: 1 }
  });
  
  const selectedMaterialId = watch("materialId");
  const quantity = watch("quantity");
  const selectedMaterial = useMemo(() => materials.find(m => m.id === selectedMaterialId), [materials, selectedMaterialId]);
  const totalPrice = useMemo(() => (selectedMaterial?.price || 0) * (quantity || 1), [selectedMaterial, quantity]);


  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("saleDate", "desc"));
    const unsubscribeSales = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              ...data,
              id: doc.id,
              saleDate: data.saleDate,
          } as Sale;
      });
      setSales(salesData);
    });

    const materialsUnsubscribe = onSnapshot(collection(db, "materials"), (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyMaterial)).sort((a,b) => a.name.localeCompare(b.name)));
    });

    return () => {
      unsubscribeSales();
      materialsUnsubscribe();
    };
  }, []);
  
  const totalRevenue = useMemo(() => {
      return sales.reduce((total, sale) => total + (sale.totalPrice || 0), 0);
  }, [sales])

  const openForm = (sale: Sale | null = null) => {
    setEditingSale(sale);
    if (sale) {
      setValue("customerName", sale.customerName);
      setValue("materialId", sale.materialId);
      setValue("quantity", sale.quantity);
      setValue("medium", sale.medium);
      setValue("collegeUniversity", sale.collegeUniversity);
    } else {
      reset({ customerName: "", materialId: "", quantity: 1, medium: "English", collegeUniversity: "" });
    }
    setIsFormOpen(true);
  };

  const processSubmit = async (data: SaleFormValues) => {
    if (!selectedMaterial) {
        toast({ title: "Error", description: "Invalid material selected.", variant: "destructive"});
        return;
    }

    try {
      const saleDate = format(new Date(), "yyyy-MM-dd");
      const saleData = {
          ...data,
          materialName: selectedMaterial.name,
          unitPrice: selectedMaterial.price,
          totalPrice: totalPrice,
      };

      if (editingSale) {
        // Note: Editing a sale does not create a new transaction to avoid duplicates.
        // To adjust income, the original transaction should be modified manually.
        const saleRef = doc(db, "sales", editingSale.id);
        await updateDoc(saleRef, saleData);
        toast({ title: "Success", description: "Sale record updated successfully." });
      } else {
        // Add sale document
        const saleDocRef = await addDoc(collection(db, "sales"), {
          ...saleData,
          saleDate: saleDate,
        });

        // Add corresponding income transaction
        await addDoc(collection(db, "transactions"), {
            description: `Sale of ${saleData.quantity} x ${saleData.materialName} to ${saleData.customerName}`,
            amount: saleData.totalPrice,
            type: "Income",
            category: "Sales",
            date: saleDate,
            saleId: saleDocRef.id
        });
        
        toast({ title: "Success", description: "Sale recorded successfully." });
      }
      setIsFormOpen(false);
      setEditingSale(null);
    } catch (error) {
      console.error("Error submitting sale:", error);
      toast({ title: "Error", description: "Failed to save sale.", variant: "destructive" });
    }
  };
  
  const handleDeleteClick = (id: string) => {
      setSaleToDelete(id);
      setIsAlertOpen(true);
  }

  const confirmDelete = async () => {
    if (saleToDelete) {
        try {
            // Note: Deleting a sale does not automatically delete the corresponding transaction.
            // This needs to be handled manually from the Expenses & Income page if required.
            await deleteDoc(doc(db, "sales", saleToDelete));
            toast({ title: "Success", description: "Sale record deleted successfully." });
        } catch (error) {
            console.error("Error deleting sale:", error);
            toast({ title: "Error", description: "Failed to delete sale.", variant: "destructive" });
        }
    }
    setIsAlertOpen(false);
    setSaleToDelete(null);
  };
  
  const handlePrint = () => {
    const printContents = `
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; margin: 20px; }
            h1 { text-align: center; color: #23395d; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .total { font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Sales Report</h1>
          <p><strong>Date:</strong> ${format(new Date(), "PPP")}</p>
          <p><strong>Total Revenue:</strong> ₹${totalRevenue.toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Material</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Price</th>
                <th>Medium</th>
                <th>College/University</th>
              </tr>
            </thead>
            <tbody>
              ${sales.map(s => `
                <tr>
                  <td>${format(new Date(s.saleDate), "dd/MM/yyyy")}</td>
                  <td>${s.customerName}</td>
                  <td>${s.materialName}</td>
                  <td>${s.quantity}</td>
                  <td>₹${(s.unitPrice || 0).toLocaleString()}</td>
                  <td>₹${(s.totalPrice || 0).toLocaleString()}</td>
                  <td>${s.medium}</td>
                  <td>${s.collegeUniversity || 'N/A'}</td>
                </tr>
              `).join('')}
               <tr>
                  <td colspan="7" class="total">Total Revenue</td>
                  <td class="total">₹${totalRevenue.toLocaleString()}</td>
                </tr>
            </tbody>
          </table>
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
        <PageHeader title="Notes & Books Sales" subtitle="Track all sales of study materials">
            <Button size="sm" className="h-8 gap-1" onClick={() => openForm()}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Sale
                </span>
            </Button>
        </PageHeader>
        <main className="flex-1 p-4 md:p-6 grid gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-start">
            <div className="flex-1">
              <CardTitle>Manage Sales</CardTitle>
              <CardDescription>A list of all sales of study materials.</CardDescription>
            </div>
            <div className="mt-4 md:mt-0 md:text-right">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
           <div className="flex items-center justify-end gap-2 mt-4">
                 <Button size="sm" variant="outline" className="h-8 gap-1 no-print" onClick={handlePrint}>
                    <Printer className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Print Report
                    </span>
                 </Button>
            </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <Card key={sale.id} className="rounded-2xl shadow-soft dark:shadow-soft-dark">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                           <ShoppingCart className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                {sale.customerName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{sale.materialName} (x{sale.quantity})</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{format(new Date(sale.saleDate), "PPP")}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-1">
                             <IndianRupee className="h-4 w-4" />
                             {(sale.totalPrice || 0).toLocaleString()}
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
                          <DropdownMenuItem onSelect={() => openForm(sale)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDeleteClick(sale.id)} className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))
              ) : (
                 <div className="text-center py-12 text-gray-500">
                    <p>No sales found.</p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSale ? "Edit Sale" : "Add New Sale"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Controller name="customerName" control={control} render={({field}) => <Input id="customerName" {...field} />} />
                {errors.customerName && <p className="text-destructive text-sm mt-1">{errors.customerName.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="materialId">Material</Label>
                  <Controller
                    name="materialId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select a material" /></SelectTrigger>
                        <SelectContent>
                          {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name} (₹{m.price})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.materialId && <p className="text-destructive text-sm mt-1">{errors.materialId.message}</p>}
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Controller name="quantity" control={control} render={({field}) => <Input id="quantity" type="number" {...field} />} />
                   {errors.quantity && <p className="text-destructive text-sm mt-1">{errors.quantity.message}</p>}
                </div>
              </div>
              <div>
                <Label>Total Price</Label>
                <Input value={`₹${totalPrice.toLocaleString()}`} readOnly className="bg-muted font-bold" />
              </div>
              <div>
                <Label htmlFor="medium">Medium</Label>
                <Controller
                  name="medium"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="collegeUniversity">College / University (Optional)</Label>
                <Controller name="collegeUniversity" control={control} render={({field}) => <Input id="collegeUniversity" {...field} />} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit">Save Sale</Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the sale record.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </main>
    </div>
  );
}

    