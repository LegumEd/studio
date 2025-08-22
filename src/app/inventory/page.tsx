
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, increment, query, orderBy, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { InventoryItem, StudyMaterial } from "@/lib/types";
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { PackagePlus, Edit, Package } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [stockToAdd, setStockToAdd] = useState<number | ''>('');
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("title"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InventoryItem));
      setInventory(inventoryData);
    });

    return () => unsubscribe();
  }, []);
  
  const overallAvailableStock = useMemo(() => {
      return inventory.reduce((total, item) => total + item.availableStock, 0);
  }, [inventory]);

  const openAddStockModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockToAdd('');
    setIsStockModalOpen(true);
  };
  
  const openEditModal = (item: InventoryItem) => {
    setEditingMaterial({ id: item.id, name: item.title, price: 0 });
    setIsEditModalOpen(true);
  }

  const handleAddStock = async () => {
    if (!selectedItem || stockToAdd === '' || +stockToAdd <= 0) {
      toast({ title: "Error", description: "Please enter a valid stock quantity.", variant: "destructive" });
      return;
    }
    try {
      const inventoryRef = doc(db, "inventory", selectedItem.id);
      await updateDoc(inventoryRef, {
        totalStock: increment(+stockToAdd),
        availableStock: increment(+stockToAdd),
      });
      toast({ title: "Success", description: `Added ${stockToAdd} units to ${selectedItem.title}.` });
    } catch (error) {
      console.error("Error adding stock:", error);
      toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" });
    }
    setIsStockModalOpen(false);
    setSelectedItem(null);
  };
  
  const handleUpdateMaterial = async () => {
    if (!editingMaterial || editingMaterial.name.trim() === "") {
      toast({ title: "Error", description: "Material name cannot be empty.", variant: "destructive" });
      return;
    }
    try {
        const batch = writeBatch(db);

        const materialRef = doc(db, "materials", editingMaterial.id);
        batch.update(materialRef, { name: editingMaterial.name.trim() });
        
        const inventoryRef = doc(db, "inventory", editingMaterial.id);
        batch.update(inventoryRef, { title: editingMaterial.name.trim() });
        
        await batch.commit();

        toast({ title: "Success", description: "Material updated successfully." });
    } catch (error) {
        console.error("Error updating material:", error);
        toast({ title: "Error", description: "Failed to update material.", variant: "destructive" });
    }
    setIsEditModalOpen(false);
    setEditingMaterial(null);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="Inventory Management" subtitle="Track and manage stock of study materials" />
      <main className="flex-1 p-4 md:p-6 grid gap-4 md:gap-6">
        <Card className="w-full md:w-1/3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Available Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{overallAvailableStock}</div>
                <p className="text-xs text-muted-foreground">Total units available across all materials</p>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Stock</CardTitle>
            <CardDescription>A real-time view of your study material inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="border rounded-md hidden md:block">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Title</TableHead>
                      <TableHead>Total Stock</TableHead>
                      <TableHead>Available Stock</TableHead>
                      <TableHead className="w-[250px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.totalStock}</TableCell>
                        <TableCell>
                           <Badge variant={item.availableStock < 10 ? "destructive" : "default"}>
                             {item.availableStock}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openEditModal(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button size="sm" variant="default" onClick={() => openAddStockModal(item)}>
                            <PackagePlus className="mr-2 h-4 w-4" />
                            Add Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {inventory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No inventory found. Add materials in Settings.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {inventory.map((item) => (
                <Card key={item.id} className="rounded-2xl shadow-soft dark:shadow-soft-dark">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <p className="font-semibold text-gray-900 dark:text-gray-50 flex-1 pr-2">{item.title}</p>
                        <Badge variant={item.availableStock < 10 ? "destructive" : "default"}>
                            {item.availableStock} available
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Stock: {item.totalStock}</p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditModal(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" variant="default" className="flex-1" onClick={() => openAddStockModal(item)}>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Add Stock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {inventory.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>No inventory found. Add materials in Settings.</p>
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      </main>

      <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock for {selectedItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="stockToAdd">Quantity to Add</Label>
              <Input
                id="stockToAdd"
                type="number"
                value={stockToAdd}
                onChange={(e) => setStockToAdd(parseFloat(e.target.value) || '')}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddStock}>Add Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Material: {editingMaterial?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="materialName">Material Name</Label>
              <Input
                id="materialName"
                value={editingMaterial?.name || ''}
                onChange={(e) => editingMaterial && setEditingMaterial({...editingMaterial, name: e.target.value})}
                autoFocus
              />
            </div>
             {/* Note: Editing price requires fetching and is omitted for simplicity as requested */}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateMaterial}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
