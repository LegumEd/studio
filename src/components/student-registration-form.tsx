
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { paymentModes, type Student, type DocumentFile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


const studentSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  fathersName: z.string().min(2, "Father's name is required"),
  mobile: z.string().regex(/^\d{10}$/, "Invalid mobile number"),
  dob: z.string().min(1, "Date of birth is required"),
  roll: z.string().min(1, "Roll number is required"),
  course: z.string().min(1, "Course is required"),
  totalFee: z.coerce.number().min(0, "Total fee must be a positive number"),
  amountPaid: z.coerce.number().min(0, "Amount paid must be a positive number"),
  paymentMode: z.enum(["Cash", "UPI", "Bank Transfer"]),
  paymentDate: z.string().min(1, "Payment date is required"),
  address: z.string().min(5, "Address is required"),
  photo: z.any().optional(),
  documents: z.any().optional(),
});

interface StudentRegistrationFormProps {
  courses: string[];
  onStudentAdd: (student: Omit<Student, 'id' | 'lastUpdated'>) => void;
  triggerButton: React.ReactNode;
}

const readFilesAsDataURL = async (files: FileList): Promise<DocumentFile[]> => {
    const filePromises = Array.from(files).map(file => {
      return new Promise<DocumentFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          name: file.name,
          data: e.target?.result as string,
          type: file.type
        });
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    });
    return await Promise.all(filePromises);
};

export default function StudentRegistrationForm({ courses, onStudentAdd, triggerButton }: StudentRegistrationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
        paymentDate: format(new Date(), "yyyy-MM-dd"),
    }
  });

  const processSubmit = async (data: z.infer<typeof studentSchema>) => {
    try {
        let photoData: string | undefined = undefined;
        if (data.photo && data.photo.length > 0) {
            const photoFiles = await readFilesAsDataURL(data.photo);
            photoData = photoFiles[0].data;
        }

        let documentsData: DocumentFile[] = [];
        if (data.documents && data.documents.length > 0) {
            documentsData = await readFilesAsDataURL(data.documents);
        }
        
        const newStudent: Omit<Student, 'id' | 'lastUpdated'> = {
            ...data,
            photo: photoData,
            documents: documentsData,
            paymentHistory: [{
                amount: data.amountPaid,
                mode: data.paymentMode,
                date: data.paymentDate,
                timestamp: new Date().toISOString()
            }]
        };

        onStudentAdd(newStudent);

        toast({
            title: "Success",
            description: "Student added successfully.",
            variant: "default",
        });
        reset();
        setIsOpen(false);
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to add student.",
            variant: "destructive",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Register New Student</DialogTitle>
          <DialogDescription>
            Fill in the details below to enroll a new student.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-4">
        <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...register("fullName")} />
              {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <Label htmlFor="fathersName">Father's Name</Label>
              <Input id="fathersName" {...register("fathersName")} />
              {errors.fathersName && <p className="text-destructive text-sm mt-1">{errors.fathersName.message}</p>}
            </div>
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" {...register("mobile")} type="tel" />
              {errors.mobile && <p className="text-destructive text-sm mt-1">{errors.mobile.message}</p>}
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
               <Controller
                  name="dob"
                  control={control}
                  render={({ field }) => (
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button
                              variant={"outline"}
                              className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                           >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                           <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} initialFocus />
                        </PopoverContent>
                     </Popover>
                  )}
               />
              {errors.dob && <p className="text-destructive text-sm mt-1">{errors.dob.message}</p>}
            </div>
            <div>
              <Label htmlFor="roll">Roll Number</Label>
              <Input id="roll" {...register("roll")} />
              {errors.roll && <p className="text-destructive text-sm mt-1">{errors.roll.message}</p>}
            </div>
            <div>
              <Label htmlFor="course">Course Enrolled</Label>
              <Controller
                name="course"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.course && <p className="text-destructive text-sm mt-1">{errors.course.message}</p>}
            </div>
            <div>
              <Label htmlFor="totalFee">Total Fee</Label>
              <Input id="totalFee" {...register("totalFee")} type="number" />
              {errors.totalFee && <p className="text-destructive text-sm mt-1">{errors.totalFee.message}</p>}
            </div>
            <div>
              <Label htmlFor="amountPaid">Amount Paid</Label>
              <Input id="amountPaid" {...register("amountPaid")} type="number" />
              {errors.amountPaid && <p className="text-destructive text-sm mt-1">{errors.amountPaid.message}</p>}
            </div>
            <div>
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Controller
                name="paymentMode"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentMode && <p className="text-destructive text-sm mt-1">{errors.paymentMode.message}</p>}
            </div>
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
                <Controller
                  name="paymentDate"
                  control={control}
                  render={({ field }) => (
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button
                              variant={"outline"}
                              className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                           >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                           <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} initialFocus />
                        </PopoverContent>
                     </Popover>
                  )}
               />
              {errors.paymentDate && <p className="text-destructive text-sm mt-1">{errors.paymentDate.message}</p>}
            </div>
             <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" {...register("address")} />
                {errors.address && <p className="text-destructive text-sm mt-1">{errors.address.message}</p>}
            </div>
            <div>
              <Label htmlFor="photo">Student Photo</Label>
              <Input id="photo" {...register("photo")} type="file" accept="image/*" />
              {errors.photo && <p className="text-destructive text-sm mt-1">{errors.photo.message?.toString()}</p>}
            </div>
            <div>
              <Label htmlFor="documents">Documents (Optional)</Label>
              <Input id="documents" {...register("documents")} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" />
              {errors.documents && <p className="text-destructive text-sm mt-1">{errors.documents.message?.toString()}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add Student</Button>
          </DialogFooter>
        </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
