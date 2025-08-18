
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

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Enquiries</CardTitle>
          <CardDescription>Manage student enquiries.</CardDescription>
           <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8 mt-4">
              <div className="flex gap-4 w-full md:w-auto">
                <Input
                  placeholder="Search by name or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto flex items-center gap-2">
                 <Button size="sm" className="h-8 gap-1" onClick={() => openForm()}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Enquiry
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
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnquiries.length > 0 ? (
                filteredEnquiries.map((enquiry) => (
                  <TableRow key={enquiry.id}>
                    <TableCell>{format(new Date(enquiry.enquiryDate), "PPP")}</TableCell>
                    <TableCell className="font-medium">{enquiry.name}</TableCell>
                    <TableCell>{enquiry.mobile}</TableCell>
                    <TableCell>{enquiry.course}</TableCell>
                    <TableCell>{enquiry.status}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{enquiry.notes}</TableCell>
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
                          <DropdownMenuItem onSelect={() => openForm(enquiry)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDeleteClick(enquiry.id)} className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">No enquiries found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
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

    </main>
  );
}
