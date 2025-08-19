
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
import { db } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';


interface StudentProfileModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  student: Student;
  onUpdateStudent: (student: Student) => void;
  courses: string[];
  onPrintForm: (student: Student, paymentHistory: Payment[]) => void;
  defaultTab?: "profile" | "payments" | "documents";
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

const toWords = (num: number): string => {
    const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
    const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
    
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (parseInt(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (parseInt(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (parseInt(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (parseInt(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (parseInt(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    
    return str.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Only';
}


export default function StudentProfileModal({ isOpen, setIsOpen, student, onUpdateStudent, courses, onPrintForm, defaultTab = "profile" }: StudentProfileModalProps) {
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
    // Don't toast here, as the payment function will toast. This avoids double toasts.
    // toast({ title: "Success", description: "Student details updated." });
    setIsOpen(false);
  };
  
  const handleAddPayment = async () => {
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

    try {
        await addDoc(collection(db, "transactions"), {
            description: `Fee from ${updatedStudent.fullName} (Roll: ${updatedStudent.roll})`,
            amount: amount,
            type: "Income",
            category: "Fee Collection",
            date: newPayment.date,
            studentId: updatedStudent.id,
            paymentTimestamp: payment.timestamp,
        });
        toast({ title: "Success", description: "Payment added and income recorded." });
    } catch (error) {
        console.error("Error creating transaction:", error);
        toast({ title: "Warning", description: "Payment was saved to student, but failed to record as income.", variant: "destructive" });
    }

    setNewPayment({ amount: '', mode: 'Cash', date: format(new Date(), 'yyyy-MM-dd') });
  };
  
 const handlePrintFeeSlip = (payment: Payment) => {
    const slipId = new Date(payment.timestamp).getTime().toString().slice(-6);
    const paymentDate = new Date(payment.date);
    const paymentTime = new Date(payment.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    const slipHtml = `
      <html>
        <head>
          <title>Fee Demand Slip - ${editedStudent.roll}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
            body { 
              font-family: 'Courier Prime', monospace;
              margin: 20px;
              font-size: 14px;
            }
            .container {
              border: 1px solid #000;
              padding: 32px;
              width: 700px;
              margin: auto;
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
            }
            h2 {
              font-size: 18px;
              font-weight: 700;
              margin: 0;
            }
             h3 {
              font-size: 16px;
              font-weight: 700;
              margin: 0;
            }
            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 16px;
            }
            .details-table td {
                padding: 4px 0;
            }
            .separator {
                border-bottom: 1px dashed #000;
                margin: 16px 0;
                height: 1px;
            }
            .fee-table {
                width: 100%;
                margin: 16px 0;
            }
            .fee-table td {
                padding: 4px 0;
            }
            .text-right {
                text-align: right;
            }
            .text-center {
                text-align: center;
            }
            .font-bold {
                font-weight: 700;
            }
            .footer-section {
                margin-top: 24px;
            }
            @media print {
              body {
                margin: 0;
              }
              .container {
                box-shadow: none;
                border: none;
                width: 100%;
                height: 100%;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>LEX LEGUM ACADEMY</h2>
              <h3>FEE DEMAND SLIP</h3>
            </div>
            
            <table class="details-table">
                <tr>
                    <td>Register No</td>
                    <td>: ${editedStudent.roll}</td>
                    <td class="text-right">Date</td>
                    <td class="text-right">: ${format(paymentDate, "dd/MM/yyyy")}</td>
                </tr>
                 <tr>
                    <td>Class Name</td>
                    <td>: ${editedStudent.course}</td>
                    <td class="text-right">Time</td>
                    <td class="text-right">: ${paymentTime}</td>
                </tr>
                <tr>
                    <td>Name</td>
                    <td>: ${editedStudent.fullName}</td>
                     <td class="text-right">Slip No</td>
                    <td class="text-right">: ${slipId}</td>
                </tr>
                 <tr>
                    <td>Academic Year</td>
                    <td>: ${editedStudent.enrollmentYear}</td>
                    <td></td>
                    <td></td>
                </tr>
            </table>

            <div class="separator"></div>

            <table class="fee-table">
                <tr>
                    <td>Fee Payment</td>
                    <td class="text-right">${payment.amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
                 <tr>
                    <td>(${payment.mode})</td>
                    <td></td>
                </tr>
            </table>
            
            <div class="separator"></div>
            
            <table class="fee-table">
                <tr>
                    <td class="font-bold">Net Amount : (INR)</td>
                    <td class="text-right font-bold">${payment.amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
                 <tr>
                    <td colspan="2">${toWords(payment.amount)}</td>
                </tr>
            </table>

            <div class="separator"></div>
            
            <div class="footer-section">
                <div>Instructions:</div>
                <div>- Fee once paid is non-refundable.</div>
                <br />
                <br />
                <div>Prepared By: Admin</div>
            </div>

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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-3xl">{student.fullName}</DialogTitle>
          <DialogDescription>Roll No: {student.roll} | Course: {student.course}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex gap-4 py-4 overflow-hidden">
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
                 <Button onClick={() => onPrintForm(editedStudent, editedStudent.paymentHistory || [])} variant="secondary" className="w-full"><Printer className="mr-2 h-4 w-4" /> Print Form</Button>
            </div>
            <div className="w-3/4 flex-1 flex flex-col overflow-hidden">
                <Tabs defaultValue={defaultTab} className="w-full flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">Profile Details</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>
                   
                        <TabsContent value="profile" className="h-full flex-1 overflow-y-auto">
                             <ScrollArea className="h-full pr-4">
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
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="payments" className="h-full flex-1 flex flex-col overflow-hidden">
                            <div className="flex flex-col h-full">
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
                                    <div className="col-span-3"><Button onClick={handleAddPayment} className="w-full">Add Payment & Record Income</Button></div>
                                </div>
                                <div className="flex-1 rounded-md border overflow-hidden">
                                    <ScrollArea className="h-full">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background"><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {editedStudent.paymentHistory?.length ? (
                                                    editedStudent.paymentHistory?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((p, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{format(new Date(p.date), "PPP")}</TableCell>
                                                            <TableCell>₹{p.amount.toLocaleString()}</TableCell>
                                                            <TableCell>{p.mode}</TableCell>
                                                            <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handlePrintFeeSlip(p)}><Printer className="h-4 w-4" /></Button></TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="h-24 text-center">No payment history.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="documents" className="h-full flex-1 overflow-y-auto">
                             <ScrollArea className="h-full">
                                <p className="text-muted-foreground">Document upload and management coming soon.</p>
                            </ScrollArea>
                        </TabsContent>
                   
                </Tabs>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    

    

    