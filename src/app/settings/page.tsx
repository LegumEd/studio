
"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Course, StudyMaterial } from "@/lib/types";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';

export default function SettingsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseFee, setNewCourseFee] = useState<number | '' >('');
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialPrice, setNewMaterialPrice] = useState<number | ''>('');
  const [newMaterialStock, setNewMaterialStock] = useState<number | ''>('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [stockToAdd, setStockToAdd] = useState<number | ''>('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string; type: 'course' | 'material'} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const qCourses = query(collection(db, "courses"), orderBy("name"));
    const unsubscribeCourses = onSnapshot(qCourses, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(coursesData);
    });

    const qMaterials = query(collection(db, "materials"), orderBy("name"));
    const unsubscribeMaterials = onSnapshot(qMaterials, (snapshot) => {
        const materialsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyMaterial));
        setMaterials(materialsData);
    });

    return () => {
        unsubscribeCourses();
        unsubscribeMaterials();
    };
  }, []);

  const handleAddCourse = async () => {
    if (newCourseName.trim() === "" || newCourseFee === '' || newCourseFee <= 0) {
      toast({ title: "Error", description: "Course name and a valid fee are required.", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, "courses"), { name: newCourseName.trim(), fee: newCourseFee });
      toast({ title: "Success", description: "Course added successfully." });
      setNewCourseName("");
      setNewCourseFee('');
    } catch (error) {
      console.error("Error adding course:", error);
      toast({ title: "Error", description: "Failed to add course.", variant: "destructive" });
    }
  };
  
  const handleAddMaterial = async () => {
    if (newMaterialName.trim() === "" || newMaterialPrice === '' || newMaterialPrice <= 0) {
      toast({ title: "Error", description: "Material name and a valid price are required.", variant: "destructive" });
      return;
    }
    const stock = newMaterialStock === '' ? 0 : newMaterialStock;
    if (stock < 0) {
        toast({ title: "Error", description: "Initial stock cannot be negative.", variant: "destructive" });
        return;
    }

    try {
      const batch = writeBatch(db);

      // Add new material to 'materials' collection
      const materialRef = doc(collection(db, "materials"));
      batch.set(materialRef, { name: newMaterialName.trim(), price: newMaterialPrice });

      // Add corresponding inventory item to 'inventory' collection
      const inventoryRef = doc(db, "inventory", materialRef.id);
      batch.set(inventoryRef, { 
        title: newMaterialName.trim(),
        totalStock: stock,
        availableStock: stock 
      });

      await batch.commit();

      toast({ title: "Success", description: "Study material and inventory item added." });
      setNewMaterialName("");
      setNewMaterialPrice('');
      setNewMaterialStock('');
    } catch (error) {
      console.error("Error adding material:", error);
      toast({ title: "Error", description: "Failed to add material.", variant: "destructive" });
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse || editingCourse.name.trim() === "" || !editingCourse.fee || editingCourse.fee <= 0) {
      toast({ title: "Error", description: "Course name and a valid fee are required.", variant: "destructive" });
      return;
    }
    try {
      const courseRef = doc(db, "courses", editingCourse.id);
      await updateDoc(courseRef, { name: editingCourse.name.trim(), fee: editingCourse.fee });
      toast({ title: "Success", description: "Course updated successfully." });
    } catch (error) {
        console.error("Error updating course:", error);
        toast({ title: "Error", description: "Failed to update course.", variant: "destructive" });
    }
    setEditingCourse(null);
  };
  
  const handleUpdateMaterial = async () => {
    if (!editingMaterial || editingMaterial.name.trim() === "" || !editingMaterial.price || editingMaterial.price <= 0) {
      toast({ title: "Error", description: "Material name and a valid price are required.", variant: "destructive" });
      return;
    }
    
    const stockQuantity = (stockToAdd === '' || stockToAdd < 0) ? 0 : stockToAdd;

    try {
        const batch = writeBatch(db);

        const materialRef = doc(db, "materials", editingMaterial.id);
        batch.update(materialRef, { name: editingMaterial.name.trim(), price: editingMaterial.price });
        
        const inventoryRef = doc(db, "inventory", editingMaterial.id);
        const inventoryUpdateData: { title: string; totalStock?: any; availableStock?: any } = { 
            title: editingMaterial.name.trim() 
        };
        if(stockQuantity > 0) {
            inventoryUpdateData.totalStock = increment(stockQuantity);
            inventoryUpdateData.availableStock = increment(stockQuantity);
        }
        batch.update(inventoryRef, inventoryUpdateData);
        
        await batch.commit();

        toast({ title: "Success", description: "Material updated successfully." });
    } catch (error) {
        console.error("Error updating material:", error);
        toast({ title: "Error", description: "Failed to update material.", variant: "destructive" });
    }
    setEditingMaterial(null);
    setStockToAdd('');
  };

  const handleDeleteClick = (id: string, type: 'course' | 'material') => {
    setItemToDelete({id, type});
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
        const {id, type} = itemToDelete;
        const collectionName = type === 'course' ? 'courses' : 'materials';
        try {
            const batch = writeBatch(db);
            
            const itemRef = doc(db, collectionName, id);
            batch.delete(itemRef);

            if (type === 'material') {
                const inventoryRef = doc(db, "inventory", id);
                batch.delete(inventoryRef);
            }

            await batch.commit();
            toast({ title: "Success", description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.` });
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            toast({ title: "Error", description: `Failed to delete ${type}. Note: Associated sales/inventory records might remain.`, variant: "destructive" });
        }
    }
    setIsAlertOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-900">
    <PageHeader title="Settings" />
    <main className="flex-1 p-4 md:p-6 grid gap-4 md:gap-6">
      <Tabs defaultValue="courses">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses">Manage Courses</TabsTrigger>
            <TabsTrigger value="materials">Manage Study Materials</TabsTrigger>
        </TabsList>
        <TabsContent value="courses">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Courses</CardTitle>
                    <CardDescription>Add, edit, or delete courses offered by the academy.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 mb-4">
                        <div className="flex-grow"><Label htmlFor="newCourseName">Course Name</Label><Input id="newCourseName" placeholder="Enter new course name" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} /></div>
                        <div className="sm:w-48"><Label htmlFor="newCourseFee">Fee</Label><Input id="newCourseFee" type="number" placeholder="Enter fee" value={newCourseFee} onChange={(e) => setNewCourseFee(parseFloat(e.target.value) || '')} /></div>
                        <Button onClick={handleAddCourse} className="w-full sm:w-auto">Add Course</Button>
                    </div>
                    <div className="border rounded-md">
                      <div className="w-full overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Course Name</TableHead>
                            <TableHead>Fee</TableHead>
                            <TableHead className="w-[100px] text-right"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.map((course) => (
                            <TableRow key={course.id}>
                                <TableCell className="font-medium">{course.name}</TableCell>
                                <TableCell>₹{(course.fee || 0).toLocaleString()}</TableCell>
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
                                    <DropdownMenuItem onSelect={() => handleDeleteClick(course.id, 'course')} className="text-destructive">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))}
                            {courses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No courses found. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        </Table>
                      </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="materials">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Study Materials</CardTitle>
                    <CardDescription>Add, edit, or delete notes, books, and other study materials.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 mb-4">
                        <div className="flex-grow"><Label htmlFor="newMaterialName">Material Name</Label><Input id="newMaterialName" placeholder="e.g., Criminal Law Notes" value={newMaterialName} onChange={(e) => setNewMaterialName(e.target.value)} /></div>
                        <div className="sm:w-48"><Label htmlFor="newMaterialPrice">Price</Label><Input id="newMaterialPrice" type="number" placeholder="Enter price" value={newMaterialPrice} onChange={(e) => setNewMaterialPrice(parseFloat(e.target.value) || '')} /></div>
                        <div className="sm:w-48"><Label htmlFor="newMaterialStock">Initial Stock</Label><Input id="newMaterialStock" type="number" placeholder="e.g., 50" value={newMaterialStock} onChange={(e) => setNewMaterialStock(parseInt(e.target.value) || '')} /></div>
                        <Button onClick={handleAddMaterial} className="w-full sm:w-auto">Add Material</Button>
                    </div>
                    <div className="border rounded-md">
                      <div className="w-full overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Material Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="w-[100px] text-right"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials.map((material) => (
                            <TableRow key={material.id}>
                                <TableCell className="font-medium">{material.name}</TableCell>
                                <TableCell>₹{(material.price || 0).toLocaleString()}</TableCell>
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
                                    <DropdownMenuItem onSelect={() => setEditingMaterial(material)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDeleteClick(material.id, 'material')} className="text-destructive">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))}
                            {materials.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No materials found. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        </Table>
                      </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>


      <Dialog open={!!editingCourse} onOpenChange={(isOpen) => !isOpen && setEditingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Course Name</Label>
              <Input
                value={editingCourse?.name || ''}
                onChange={(e) => editingCourse && setEditingCourse({...editingCourse, name: e.target.value})}
                autoFocus
              />
            </div>
            <div>
              <Label>Fee</Label>
              <Input
                type="number"
                value={editingCourse?.fee || ''}
                onChange={(e) => editingCourse && setEditingCourse({...editingCourse, fee: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingCourse(null)}>Cancel</Button>
            <Button onClick={handleUpdateCourse}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!editingMaterial} onOpenChange={(isOpen) => { if (!isOpen) { setEditingMaterial(null); setStockToAdd(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Study Material</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Material Name</Label>
              <Input
                value={editingMaterial?.name || ''}
                onChange={(e) => editingMaterial && setEditingMaterial({...editingMaterial, name: e.target.value})}
                autoFocus
              />
            </div>
            <div>
              <Label>Price</Label>
              <Input
                type="number"
                value={editingMaterial?.price || ''}
                onChange={(e) => editingMaterial && setEditingMaterial({...editingMaterial, price: parseFloat(e.target.value) || 0})}
              />
            </div>
             <div>
              <Label>Add to Stock</Label>
              <Input
                type="number"
                placeholder="e.g., 10"
                value={stockToAdd}
                onChange={(e) => setStockToAdd(parseInt(e.target.value) || '')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setEditingMaterial(null); setStockToAdd(''); }}>Cancel</Button>
            <Button onClick={handleUpdateMaterial}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.type} and its associated inventory record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
    </div>
  );
}
