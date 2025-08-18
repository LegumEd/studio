
"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

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
    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })) as Course[];
      setCourses(coursesData.sort((a, b) => a.name.localeCompare(b.name)));
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

  const handleUpdateCourse = async (id: string, newName: string) => {
    if (newName.trim() === "") {
      toast({ title: "Error", description: "Course name cannot be empty.", variant: "destructive" });
      return;
    }
    try {
      const courseRef = doc(db, "courses", id);
      await updateDoc(courseRef, { name: newName.trim() });
      setCourses(prev => prev.map(c => c.id === id ? { ...c, name: newName.trim() } : c).sort((a, b) => a.name.localeCompare(b.name)));
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
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Settings</CardTitle>
          <CardDescription>Manage application settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Manage Courses</h3>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter new course name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
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
              defaultValue={editingCourse?.name}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editingCourse) {
                  handleUpdateCourse(editingCourse.id, e.currentTarget.value);
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingCourse(null)}>Cancel</Button>
            <Button onClick={() => editingCourse && handleUpdateCourse(editingCourse.id, (document.querySelector('input') as HTMLInputElement).value)}>Save Changes</Button>
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
