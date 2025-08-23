
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
import { MoreHorizontal, PlusCircle, Printer, User, Book, Phone, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';

const enquirySchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().regex(/^\d{10}$/, "Invalid mobile number"),
  course: z.string().min(1, "Course is required"),
  notes: z.string().optional(),
  status: z.enum(["Pending", "Followed-up", "Enrolled"]),
});

type Enquiry = z.infer<typeof enquirySchema> & {
  id: string;
  enquiryDate: string;
};

const statuses = ["Pending", "Followed-up", "Enrolled"];

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof enquirySchema>>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { status: "Pending" }
  });

  useEffect(() => {
    const q = query(collection(db, "enquiries"), orderBy("enquiryDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const enquiriesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              ...data,
              id: doc.id,
              enquiryDate: data.enquiryDate?.toDate ? format(data.enquiryDate.toDate(), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          } as Enquiry;
      });
      setEnquiries(enquiriesData);
    });

    const coursesUnsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      setCourses(snapshot.docs.map(doc => doc.data().name).sort());
    });

    return () => {
      unsubscribe();
      coursesUnsubscribe();
    };
  }, []);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enquiry) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        enquiry.name.toLowerCase().includes(searchLower) ||
        enquiry.mobile.includes(searchLower);
      const matchesStatus =
        statusFilter === "all" || enquiry.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enquiries, searchQuery, statusFilter]);

  const openForm = (enquiry: Enquiry | null = null) => {
    setEditingEnquiry(enquiry);
    if (enquiry) {
      setValue("name", enquiry.name);
      setValue("mobile", enquiry.mobile);
      setValue("course", enquiry.course);
      setValue("notes", enquiry.notes);
      setValue("status", enquiry.status);
    } else {
      reset({ name: "", mobile: "", course: "", notes: "", status: "Pending" });
    }
    setIsFormOpen(true);
  };

  const processSubmit = async (data: z.infer<typeof enquirySchema>) => {
    try {
      if (editingEnquiry) {
        const enquiryRef = doc(db, "enquiries", editingEnquiry.id);
        await updateDoc(enquiryRef, { ...data });
        toast({ title: "Success", description: "Enquiry updated successfully." });
      } else {
        await addDoc(collection(db, "enquiries"), {
          ...data,
          enquiryDate: serverTimestamp(),
        });
        toast({ title: "Success", description: "Enquiry added successfully." });
      }
      setIsFormOpen(false);
      setEditingEnquiry(null);
    } catch (error) {
      console.error("Error submitting enquiry:", error);
      toast({ title: "Error", description: "Failed to save enquiry.", variant: "destructive" });
    }
  };
  
  const handleDeleteClick = (id: string) => {
      setEnquiryToDelete(id);
      setIsAlertOpen(true);
  }

  const confirmDelete = async () => {
    if (enquiryToDelete) {
        try {
            await deleteDoc(doc(db, "enquiries", enquiryToDelete));
            toast({ title: "Success", description: "Enquiry deleted successfully." });
        } catch (error) {
            console.error("Error deleting enquiry:", error);
            toast({ title: "Error", description: "Failed to delete enquiry.", variant: "destructive" });
        }
    }
    setIsAlertOpen(false);
    setEnquiryToDelete(null);
  };
  
  const handlePrint = () => {
    const printContents = `
      <html>
        <head>
          <title>Enquiries Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; margin: 20px; }
            h1 { text-align: center; color: #23395d; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .no-print { display: none; }
          </style>
        </head>
        <body>
          <h1>Enquiries Report</h1>
          <p><strong>Date:</strong> ${format(new Date(), "PPP")}</p>
          <p><strong>Status Filter:</strong> ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</p>
          <p><strong>Total Enquiries:</strong> ${filteredEnquiries.length}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Course</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEnquiries.map(e => `
                <tr>
                  <td>${format(new Date(e.enquiryDate), "dd/MM/yyyy")}</td>
                  <td>${e.name}</td>
                  <td>${e.mobile}</td>
                  <td>${e.course}</td>
                  <td>${e.status}</td>
                  <td>${e.notes || ''}</td>
                </tr>
              `).join('')}
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
      <PageHeader title="Enquiries" subtitle="Manage and track all student enquiries">
         <Button size="sm" className="h-8 gap-1" onClick={() => openForm()}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Enquiry
            </span>
        </Button>
      </PageHeader>
      <main className="flex-1 p-4 md:p-6 grid gap-4 md:gap-6">
        <Card>
            <CardHeader>
               <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <CardTitle>Manage Enquiries</CardTitle>
                    <CardDescription>A list of all student enquiries in your academy.</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 gap-1 no-print" onClick={handlePrint}>
                        <Printer className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Print Report
                        </span>
                  </Button>
                </div>
               <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-2 mt-4">
                  <div className="flex-1 w-full md:w-auto">
                    <Input
                      placeholder="Search by name or mobile..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                  {filteredEnquiries.length > 0 ? (
                    filteredEnquiries.map((enquiry) => (
                      <Card key={enquiry.id} className="rounded-2xl shadow-soft dark:shadow-soft-dark">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1 grid gap-2">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2"><User className="h-4 w-4 text-gray-500"/>{enquiry.name}</p>
                                    <Badge 
                                        className={
                                            enquiry.status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                                            enquiry.status === 'Followed-up' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }
                                    >
                                        {enquiry.status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><Book className="h-4 w-4"/>{enquiry.course}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><Phone className="h-4 w-4"/>{enquiry.mobile}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2"><CalendarIcon className="h-4 w-4"/>Enquired on: {format(new Date(enquiry.enquiryDate), "PPP")}</p>
                                {enquiry.notes && <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded-md mt-2">{enquiry.notes}</p>}
                            </div>
                            <div className="flex sm:flex-col justify-end gap-2 no-print">
                               <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onSelect={() => openForm(enquiry)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleDeleteClick(enquiry.id)} className="text-destructive">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p>No enquiries found.</p>
                    </div>
                  )}
              </div>
            </CardContent>
        </Card>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEnquiry ? "Edit Enquiry" : "Add New Enquiry"}</DialogTitle>
            <DialogDescription>
              {editingEnquiry ? "Update the details of the enquiry." : "Fill in the details for the new enquiry."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" {...register("mobile")} type="tel" />
                {errors.mobile && <p className="text-destructive text-sm mt-1">{errors.mobile.message}</p>}
              </div>
              <div>
                <Label htmlFor="course">Course Interested</Label>
                <Controller
                  name="course"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                      <SelectContent>
                        {courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.course && <p className="text-destructive text-sm mt-1">{errors.course.message}</p>}
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                 {errors.status && <p className="text-destructive text-sm mt-1">{errors.status.message}</p>}
              </div>
              <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" {...register("notes")} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit">Save Enquiry</Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the enquiry record.
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
