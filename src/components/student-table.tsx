
"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Printer } from "lucide-react";
import type { Student } from "@/lib/types";
import StudentProfileModal from "./student-profile-modal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns";

interface StudentTableProps {
  students: Student[];
  courses: string[];
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

const handlePrintForm = (student: Student) => {
     const printContents = `
      <html>
        <head>
          <title>Student Form</title>
           <style>
            body { font-family: sans-serif; margin: 20px; }
            .container { border: 1px solid #ccc; padding: 20px; max-width: 800px; margin: auto; }
            h1 { text-align: center; }
            .profile-pic { float: right; width: 150px; height: 150px; object-fit: cover; border: 1px solid #ccc; border-radius: 8px;}
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Lex Legum Academy - Student Profile</h1>
            <img src="${student.photo || 'https://placehold.co/150x150.png'}" class="profile-pic" alt="student photo" />
            <table>
              <tr><th>Full Name</th><td>${student.fullName}</td></tr>
              <tr><th>Father's Name</th><td>${student.fathersName}</td></tr>
              <tr><th>Mobile</th><td>${student.mobile}</td></tr>
              <tr><th>Date of Birth</th><td>${student.dob ? format(new Date(student.dob), "PPP") : ''}</td></tr>
              <tr><th>Roll No.</th><td>${student.roll}</td></tr>
              <tr><th>Course</th><td>${student.course}</td></tr>
              <tr><th>Total Fee</th><td>₹${student.totalFee.toLocaleString()}</td></tr>
              <tr><th>Amount Paid</th><td>₹${student.amountPaid.toLocaleString()}</td></tr>
               <tr><th>Address</th><td>${student.address}</td></tr>
            </table>
          </div>
        </body>
      </html>
    `;
    const win = window.open("", "Print Form");
    win?.document.write(printContents);
    win?.document.close();
    win?.print();
}

export default function StudentTable({ students, courses, onUpdateStudent, onDeleteStudent }: StudentTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  const handleViewEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };
  
  const handleDeleteClick = (studentId: string) => {
    setStudentToDelete(studentId);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
        onDeleteStudent(studentToDelete);
    }
    setIsAlertOpen(false);
    setStudentToDelete(null);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Roll No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell text-right">Fee Paid</TableHead>
              <TableHead className="hidden md:table-cell text-right">Due</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => {
                const due = student.totalFee - student.amountPaid;
                const status = due <= 0 ? "Paid" : "Pending";
                return (
                  <TableRow key={student.id}>
                    <TableCell className="hidden sm:table-cell">
                      <img
                        alt="Student photo"
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={student.photo || "https://placehold.co/64x64.png"}
                        width="64"
                        data-ai-hint="student portrait"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.roll}</TableCell>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>{student.course}</TableCell>
                    <TableCell>
                      <Badge variant={status === "Paid" ? "default" : "destructive"} className={status === "Paid" ? "bg-green-600" : ""}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      ₹{student.amountPaid.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      ₹{due.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleViewEdit(student)}>View/Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handlePrintForm(student)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Form
                          </DropdownMenuItem>
                           <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleDeleteClick(student.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {selectedStudent && (
        <StudentProfileModal
            isOpen={isModalOpen}
            setIsOpen={setIsModalOpen}
            student={selectedStudent}
            onUpdateStudent={(s) => {
                onUpdateStudent(s);
                setSelectedStudent(s); // Keep modal updated with latest data
            }}
            courses={courses}
            onPrintForm={handlePrintForm}
        />
      )}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the student's
                record from the database.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
