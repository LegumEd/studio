"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import Header from "@/components/header";
import StudentTable from "@/components/student-table";
import StudentRegistrationForm from "@/components/student-registration-form";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Student } from "@/lib/types";
import { courses } from "@/lib/types";

export default function Dashboard() {
  const [students, setStudents] = useLocalStorage<Student[]>("students", []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          student.fullName.toLowerCase().includes(searchLower) ||
          student.roll.toLowerCase().includes(searchLower);
        const matchesCourse =
          courseFilter === "all" || student.course === courseFilter;
        return matchesSearch && matchesCourse;
      })
      .sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
  }, [students, searchQuery, courseFilter]);

  const addStudent = (newStudent: Omit<Student, 'id' | 'lastUpdated'>) => {
    const studentWithMeta: Student = {
        ...newStudent,
        id: crypto.randomUUID(),
        lastUpdated: new Date().toISOString(),
    };
    setStudents(prev => [...prev, studentWithMeta]);
  };

  const updateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? {...updatedStudent, lastUpdated: new Date().toISOString()} : s));
  };

  const deleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Student Records</CardTitle>
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8 mt-4">
                <div className="flex gap-4 w-full md:w-auto">
                    <Input
                        placeholder="Search by name or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-xs"
                    />
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by course" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {courses.map((course) => (
                                <SelectItem key={course} value={course}>
                                    {course}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <StudentRegistrationForm 
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StudentTable 
                students={filteredStudents} 
                onUpdateStudent={updateStudent}
                onDeleteStudent={deleteStudent}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
