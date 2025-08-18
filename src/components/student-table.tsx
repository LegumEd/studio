
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
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

interface StudentTableProps {
  students: Student[];
  courses: string[];
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
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
                          <DropdownMenuItem onSelect={() => handleDeleteClick(student.id)} className="text-destructive">Delete</DropdownMenuItem>
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
