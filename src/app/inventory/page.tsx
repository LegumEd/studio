
"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, increment, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { InventoryItem } from "@/lib/types";
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { PackagePlus } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
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

  const openAddStockModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockToAdd('');
    setIsStockModalOpen(true);
  };

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

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="Inventory Management" subtitle="Track and manage stock of study materials" />
      <main className="flex-1 p-4 md:p-6 grid gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Stock</CardTitle>
            <CardDescription>A real-time view of your study material inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Title</TableHead>
                      <TableHead>Total Stock</TableHead>
                      <TableHead>Available Stock</TableHead>
                      <TableHead className="w-[150px] text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openAddStockModal(item)}>
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
    </div>
  );
}
