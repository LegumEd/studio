
"use client";

import React, { useState, useEffect } from "react";
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
import { paymentModes, type Student, type DocumentFile, type Course } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";


const studentSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  fathersName: z.string().min(2, "Father's name is required"),
  mobile: z.string().regex(/^\d{10}$/, "Invalid mobile number"),
  dob: z.string().min(1, "Date of birth is required"),
  enrollmentDate: z.string(),
  roll: z.string(), // Will be generated automatically
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
  courses: Course[];
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

const generateRollNumber = async (courseName: string): Promise<string> => {
    if (!courseName) return "";
    
    const year = new Date().getFullYear().toString().slice(-2);
    const courseCode = courseName.split(' ').map(word => word[0]).join('').slice(0, 4).toUpperCase();
    
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("course", "==", courseName), where("enrollmentYear", "==", new Date().getFullYear()));
    const querySnapshot = await getDocs(q);
    const nextNumber = 1 + querySnapshot.size;
    const paddedNumber = String(nextNumber).padStart(4, '0');

    return `LLA${courseCode}${year}${paddedNumber}`;
};


export default function StudentRegistrationForm({ courses, onStudentAdd, triggerButton }: StudentRegistrationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        enrollmentDate: format(new Date(), "yyyy-MM-dd"),
        totalFee: 0,
        roll: "",
    }
  });

  const selectedCourseName = watch("course");

  useEffect(() => {
    const setCourseDetails = async () => {
        if(selectedCourseName) {
            const selectedCourse = courses.find(c => c.name === selectedCourseName);
            if (selectedCourse) {
                setValue("totalFee", selectedCourse.fee);
                const roll = await generateRollNumber(selectedCourseName);
                setValue("roll", roll);
            }
        } else {
            setValue("totalFee", 0);
            setValue("roll", "");
        }
    }
    setCourseDetails();
  }, [selectedCourseName, courses, setValue]);

  const processSubmit = async (data: z.infer<typeof studentSchema>) => {
    try {
        let photoData: string | undefined = undefined;
        if (data.photo && data.photo.length > 0) {
            const photoFiles = await readFilesAsDataURL(data.photo);
            photoData = photoFiles[0].data;
        }

        const documentsData: DocumentFile[] = (data.documents && data.documents.length > 0)
            ? await readFilesAsDataURL(data.documents)
            : [];
        
        const newStudent: Omit<Student, 'id' | 'lastUpdated'> = {
            ...data,
            enrollmentYear: new Date(data.enrollmentDate).getFullYear(),
            photo: photoData,
            documents: documentsData,
            paymentHistory: data.amountPaid > 0 ? [{
                amount: data.amountPaid,
                mode: data.paymentMode,
                date: data.paymentDate,
                timestamp: new Date().toISOString()
            }] : []
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
        console.error("Error adding student:", error);
        toast({
            title: "Error",
            description: "Failed to add student. Check console for details.",
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
              <Input id="dob" {...register("dob")} type="date" />
              {errors.dob && <p className="text-destructive text-sm mt-1">{errors.dob.message}</p>}
            </div>
            <div>
              <Label htmlFor="enrollmentDate">Date of Enrollment</Label>
              <Input id="enrollmentDate" {...register("enrollmentDate")} type="date" />
              {errors.enrollmentDate && <p className="text-destructive text-sm mt-1">{errors.enrollmentDate.message}</p>}
            </div>
             <div>
              <Label htmlFor="course">Course Enrolled</Label>
              <Controller
                name="course"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.course && <p className="text-destructive text-sm mt-1">{errors.course.message}</p>}
            </div>
            <div>
              <Label htmlFor="roll">Roll Number</Label>
              <Input id="roll" {...register("roll")} readOnly className="bg-muted" />
              {errors.roll && <p className="text-destructive text-sm mt-1">{errors.roll.message}</p>}
            </div>
            <div>
              <Label htmlFor="totalFee">Total Fee</Label>
              <Input id="totalFee" {...register("totalFee")} type="number" readOnly className="bg-muted" />
              {errors.totalFee && <p className="text-destructive text-sm mt-1">{errors.totalFee.message}</p>}
            </div>
            <div>
              <Label htmlFor="amountPaid">Amount Paid</Label>
              <Input id="amountPaid" {...register("amountPaid")} type="number" defaultValue={0} />
              {errors.amountPaid && <p className="text-destructive text-sm mt-1">{errors.amountPaid.message}</p>}
            </div>
            <div>
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Controller
                name="paymentMode"
                control={control}
                defaultValue="Cash"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
              <Input id="paymentDate" {...register("paymentDate")} type="date" />
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
