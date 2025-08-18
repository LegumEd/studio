
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Student, DocumentFile, Payment } from "@/lib/types";
import { paymentModes } from "@/lib/types";
import { format } from "date-fns";
import { Download, Printer, Save, Trash2, Upload } from 'lucide-react';


interface StudentProfileModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  student: Student;
  onUpdateStudent: (student: Student) => void;
  courses: string[];
  onPrintForm: (student: Student) => void;
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


export default function StudentProfileModal({ isOpen, setIsOpen, student, onUpdateStudent, courses, onPrintForm }: StudentProfileModalProps) {
  const [editedStudent, setEditedStudent] = useState<Student>(student);
  const [newPayment, setNewPayment] = useState({ amount: '', mode: 'Cash', date: format(new Date(), 'yyyy-MM-dd') });
  const { toast } = useToast();

  React.useEffect(() => {
    setEditedStudent(student);
  }, [student]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditedStudent(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Student, value: string) => {
    setEditedStudent(prev => ({ ...prev, [id]: value }));
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const dataUrl = (await readFilesAsDataURL(e.target.files))[0].data;
        setEditedStudent(prev => ({ ...prev, photo: dataUrl }));
    }
  };

  const handleSave = () => {
    onUpdateStudent(editedStudent);
    toast({ title: "Success", description: "Student details updated." });
    setIsOpen(false);
  };
  
  const handleAddPayment = () => {
    const amount = parseFloat(newPayment.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
        toast({ title: "Error", description: "Please enter a valid amount.", variant: "destructive" });
        return;
    }

    const payment: Payment = {
        amount,
        mode: newPayment.mode as Payment['mode'],
        date: newPayment.date,
        timestamp: new Date().toISOString()
    };
    
    const updatedStudent: Student = {
        ...editedStudent,
        amountPaid: (editedStudent.amountPaid || 0) + amount,
        paymentHistory: [...(editedStudent.paymentHistory || []), payment]
    };
    
    setEditedStudent(updatedStudent); // Update local state immediately
    onUpdateStudent(updatedStudent); // Propagate change to parent

    toast({ title: "Success", description: "Payment added successfully." });
    setNewPayment({ amount: '', mode: 'Cash', date: format(new Date(), 'yyyy-MM-dd') });
  };
  
  const handlePrintFeeSlip = (payment: Payment) => {
    const dueAmount = editedStudent.totalFee - editedStudent.amountPaid;
    const slipHtml = `
      <html>
        <head>
          <title>Fee Slip</title>
          <style>
            body { font-family: sans-serif; margin: 20px; }
            .container { border: 1px solid #ccc; padding: 20px; width: 300px; }
            h2 { text-align: center; margin-top: 0; }
            p { margin: 5px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Lex Legum Academy</h2>
            <p><span class="label">Student:</span> ${editedStudent.fullName}</p>
            <p><span class="label">Roll No:</span> ${editedStudent.roll}</p>
            <p><span class="label">Course:</span> ${editedStudent.course}</p>
            <hr/>
            <p><span class="label">Date:</span> ${format(new Date(payment.date), "PPP")}</p>
            <p><span class="label">Amount Paid:</span> ₹${payment.amount.toLocaleString()}</p>
            <p><span class="label">Mode:</span> ${payment.mode}</p>
            <hr/>
             <p><span class="label">Total Fee:</span> ₹${editedStudent.totalFee.toLocaleString()}</p>
            <p><span class="label">Total Paid:</span> ₹${editedStudent.amountPaid.toLocaleString()}</p>
            <p><span class="label">Due Amount:</span> ₹${dueAmount.toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
    const win = window.open("", "FeeSlip");
    win?.document.write(slipHtml);
    win?.document.close();
    win?.print();
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-3xl">{student.fullName}</DialogTitle>
          <DialogDescription>Roll No: {student.roll} | Course: {student.course}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 h-full py-4">
            <div className="w-1/4 flex flex-col items-center gap-4">
                <img src={editedStudent.photo || 'https://placehold.co/150x200.png'} alt="student" className="rounded-lg object-cover w-[150px] h-[200px]" data-ai-hint="student portrait" />
                <Input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <Label htmlFor="photo-upload" className="w-full">
                    <Button asChild variant="outline" className="w-full">
                        <span><Upload className="mr-2 h-4 w-4" /> Upload Photo</span>
                    </Button>
                </Label>
                <div className="w-full text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Fee</p>
                    <p className="text-2xl font-bold">₹{editedStudent.totalFee.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-2">Amount Paid</p>
                    <p className="text-xl font-semibold text-green-600">₹{editedStudent.amountPaid.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-2">Due</p>
                    <p className="text-xl font-semibold text-red-600">₹{(editedStudent.totalFee - editedStudent.amountPaid).toLocaleString()}</p>
                </div>
                 <Button onClick={handleSave} className="w-full"><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                 <Button onClick={() => onPrintForm(editedStudent)} variant="secondary" className="w-full"><Printer className="mr-2 h-4 w-4" /> Print Form</Button>
            </div>
            <div className="w-3/4">
                <Tabs defaultValue="profile" className="w-full h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">Profile Details</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>
                    <ScrollArea className="flex-grow mt-4 pr-4">
                    <TabsContent value="profile">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="fullName">Full Name</Label><Input id="fullName" value={editedStudent.fullName} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="fathersName">Father's Name</Label><Input id="fathersName" value={editedStudent.fathersName} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="mobile">Mobile</Label><Input id="mobile" value={editedStudent.mobile} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="dob">Date of Birth</Label><Input id="dob" type="date" value={editedStudent.dob} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="enrollmentDate">Date of Enrollment</Label><Input id="enrollmentDate" type="date" value={editedStudent.enrollmentDate} onChange={handleInputChange} /></div>
                            <div><Label htmlFor="roll">Roll No.</Label><Input id="roll" value={editedStudent.roll} onChange={handleInputChange} readOnly className="bg-muted" /></div>
                            <div>
                                <Label htmlFor="course">Course</Label>
                                <Select value={editedStudent.course} onValueChange={(v) => handleSelectChange('course', v)} disabled>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>{courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div><Label htmlFor="totalFee">Total Fee</Label><Input id="totalFee" type="number" value={editedStudent.totalFee} onChange={e => setEditedStudent(prev => ({...prev, totalFee: parseFloat(e.target.value) || 0 }))} readOnly className="bg-muted" /></div>
                            <div className="col-span-2"><Label htmlFor="address">Address</Label><Textarea id="address" value={editedStudent.address} onChange={handleInputChange} /></div>
                        </div>
                    </TabsContent>
                    <TabsContent value="payments">
                        <div className="grid grid-cols-3 gap-4 mb-4 p-4 border rounded-lg">
                           <div><Label>Amount</Label><Input type="number" value={newPayment.amount} onChange={e => setNewPayment(p => ({...p, amount: e.target.value}))} /></div>
                            <div>
                                <Label>Mode</Label>
                                <Select value={newPayment.mode} onValueChange={v => setNewPayment(p => ({...p, mode: v}))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{paymentModes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div><Label>Date</Label><Input type="date" value={newPayment.date} onChange={e => setNewPayment(p => ({...p, date: e.target.value}))} /></div>
                            <div className="col-span-3"><Button onClick={handleAddPayment} className="w-full">Add Payment</Button></div>
                        </div>
                        <div className="rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {editedStudent.paymentHistory?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{format(new Date(p.date), "PPP")}</TableCell>
                                        <TableCell>₹{p.amount.toLocaleString()}</TableCell>
                                        <TableCell>{p.mode}</TableCell>
                                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handlePrintFeeSlip(p)}><Printer className="h-4 w-4" /></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    </TabsContent>
                    <TabsContent value="documents">
                        {/* Document management UI here */}
                        <p className="text-muted-foreground">Document upload and management coming soon.</p>
                    </TabsContent>
                    </ScrollArea>
                </Tabs>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
