
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Search } from "lucide-react";
import StudentTable from "@/components/student-table";
import StudentRegistrationForm from "@/components/student-registration-form";
import type { Student, Course } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";

export default function EnrollmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("lastUpdated", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Student[];
      setStudents(studentsData);
    }, (error) => {
      console.error("Error fetching students:", error);
      toast({ title: "Error", description: "Failed to fetch student data.", variant: "destructive" });
    });
    
    const coursesUnsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)).sort((a,b) => a.name.localeCompare(b.name));
      setCourses(coursesData);
    });

    return () => {
      unsubscribe();
      coursesUnsubscribe();
    };
  }, [toast]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        student.fullName.toLowerCase().includes(searchLower) ||
        (student.roll && student.roll.toLowerCase().includes(searchLower));
      const matchesCourse =
        courseFilter === "all" || student.course === courseFilter;
      return matchesSearch && matchesCourse;
    });
  }, [students, searchQuery, courseFilter]);

  const addStudent = async (newStudent: Omit<Student, 'id' | 'lastUpdated'>) => {
    try {
      // Add student document
      const studentDocRef = await addDoc(collection(db, "students"), {
        ...newStudent,
        lastUpdated: serverTimestamp()
      });

      // Add corresponding income transaction if fee was paid
      if (newStudent.amountPaid > 0) {
        await addDoc(collection(db, "transactions"), {
          description: `Fee from new enrollment: ${newStudent.fullName} (Roll: ${newStudent.roll})`,
          amount: newStudent.amountPaid,
          type: "Income",
          category: "Fee Collection",
          date: newStudent.paymentDate || format(new Date(), "yyyy-MM-dd"),
          studentId: studentDocRef.id
        });
      }

      toast({ title: "Success", description: "Student added successfully." });
    } catch (error) {
      console.error("Error adding student:", error);
      toast({ title: "Error", description: "Failed to add student.", variant: "destructive" });
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
     try {
      const studentRef = doc(db, "students", updatedStudent.id);
      await updateDoc(studentRef, {
          ...updatedStudent,
          lastUpdated: serverTimestamp()
      });
      toast({ title: "Success", description: "Student updated successfully." });
    } catch (error) {
      console.error("Error updating student:", error);
      toast({ title: "Error", description: "Failed to update student.", variant: "destructive" });
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
        await deleteDoc(doc(db, "students", studentId));
        toast({ title: "Success", description: "Student deleted successfully." });
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({ title: "Error", description: "Failed to delete student.", variant: "destructive" });
    }
  };


  return (
     <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageHeader title="Students" subtitle="Manage all enrolled students">
           <StudentRegistrationForm 
                courses={courses}
                onStudentAdd={addStudent}
                triggerButton={
                  <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add Student
                    </span>
                  </Button>
                }
              />
        </PageHeader>
        <main className="flex-1 p-4 md:p-6 grid gap-4 md:gap-6">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
                <div className="relative w-full md:w-auto md:flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search by name or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by course" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map((course) => (
                            <SelectItem key={course.id} value={course.name}>
                                {course.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <StudentTable 
                students={filteredStudents} 
                onUpdateStudent={updateStudent}
                onDeleteStudent={deleteStudent}
                courses={courses.map(c => c.name)}
            />
        </main>
    </div>
  );
}

    