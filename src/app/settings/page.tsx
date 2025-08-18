
"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Course = {
  id: string;
  name: string;
};

export default function SettingsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseName, setNewCourseName] = useState("");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })) as Course[];
      setCourses(coursesData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddCourse = async () => {
    if (newCourseName.trim() === "") {
      toast({ title: "Error", description: "Course name cannot be empty.", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, "courses"), { name: newCourseName.trim() });
      toast({ title: "Success", description: "Course added successfully." });
      setNewCourseName("");
    } catch (error) {
      console.error("Error adding course:", error);
      toast({ title: "Error", description: "Failed to add course.", variant: "destructive" });
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse || editingCourse.name.trim() === "") {
      toast({ title: "Error", description: "Course name cannot be empty.", variant: "destructive" });
      return;
    }
    try {
      const courseRef = doc(db, "courses", editingCourse.id);
      await updateDoc(courseRef, { name: editingCourse.name.trim() });
      toast({ title: "Success", description: "Course updated successfully." });
    } catch (error) {
        console.error("Error updating course:", error);
        toast({ title: "Error", description: "Failed to update course.", variant: "destructive" });
    }
    setEditingCourse(null);
  };

  const handleDeleteClick = (id: string) => {
    setCourseToDelete(id);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (courseToDelete) {
      try {
        await deleteDoc(doc(db, "courses", courseToDelete));
        toast({ title: "Success", description: "Course deleted successfully." });
      } catch (error) {
        console.error("Error deleting course:", error);
        toast({ title: "Error", description: "Failed to delete course.", variant: "destructive" });
      }
    }
    setIsAlertOpen(false);
    setCourseToDelete(null);
  };

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Settings</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Courses</CardTitle>
          <CardDescription>Add, edit, or delete courses offered by the academy.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter new course name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
                />
                <Button onClick={handleAddCourse}>Add Course</Button>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead className="w-[100px] text-right"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.name}</TableCell>
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
                              <DropdownMenuItem onSelect={() => setEditingCourse(course)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDeleteClick(course.id)} className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {courses.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">No courses found. Add one to get started.</TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            {/* Other settings sections can be added here */}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingCourse} onOpenChange={(isOpen) => !isOpen && setEditingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={editingCourse?.name || ''}
              onChange={(e) => editingCourse && setEditingCourse({...editingCourse, name: e.target.value})}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateCourse();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingCourse(null)}>Cancel</Button>
            <Button onClick={handleUpdateCourse}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course.
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
