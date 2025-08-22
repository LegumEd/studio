
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Printer, DollarSign } from "lucide-react";
import type { Student, Payment } from "@/lib/types";
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
import { format } from "date-fns";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface StudentTableProps {
  students: Student[];
  courses: string[];
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

const handlePrintForm = (student: Student, paymentHistory: Payment[]) => {
     const printContents = `
      <html>
        <head>
          <title>Student Profile - ${student.fullName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f8f9fa;
              -webkit-print-color-adjust: exact;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              margin: 10mm auto;
              background: white;
              box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
              display: flex;
              flex-direction: column;
              position: relative;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #23395d;
              padding-bottom: 10px;
            }
            .header h1 {
              font-size: 24px;
              color: #23395d;
              margin: 0;
            }
            .header p {
              font-size: 16px;
              color: #555;
              margin: 5px 0 0;
            }
            .profile-container {
              display: flex;
              gap: 20px;
              align-items: flex-start;
            }
            .profile-pic-container {
              width: 150px;
              flex-shrink: 0;
            }
            .profile-pic {
              width: 150px;
              height: 180px;
              object-fit: cover;
              border: 4px solid #fff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border-radius: 8px;
            }
            .details-container {
              flex-grow: 1;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .detail-item {
              background-color: #f0f2f5;
              padding: 10px;
              border-radius: 5px;
              font-size: 14px;
            }
            .detail-item strong {
              display: block;
              color: #23395d;
              margin-bottom: 4px;
              font-weight: 500;
            }
            .detail-item.full-width {
              grid-column: 1 / -1;
            }
            .section {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
            }
            .section h3 {
                font-size: 16px;
                color: #23395d;
                margin-bottom: 10px;
            }
            .section table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            .section th, .section td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            .section th {
                background-color: #f2f2f2;
            }
            .section ol {
                padding-left: 20px;
                font-size: 12px;
                color: #333;
                -moz-column-count: 1;
                -webkit-column-count: 1;
                column-count: 1;
            }
             .section li {
                margin-bottom: 8px;
            }
            .signature-section {
                display: flex;
                justify-content: space-between;
                margin-top: auto; /* Pushes to the bottom */
                padding-top: 40px;
            }
            .signature-box {
                width: 45%;
                text-align: center;
                font-size: 14px;
            }
            .signature-line {
                border-top: 1px solid #333;
                margin-top: 40px;
                padding-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #888;
            }
            @media print {
              body, .page {
                margin: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div>
              <div class="header">
                <h1>Lex Legum Academy</h1>
                <p>Student Profile</p>
              </div>
              <div class="profile-container">
                <div class="profile-pic-container">
                  <img src="${student.photo || 'https://placehold.co/150x180.png'}" class="profile-pic" alt="student photo" />
                </div>
                <div class="details-container">
                  <div class="details-grid">
                    <div class="detail-item"><strong>Full Name</strong>${student.fullName}</div>
                    <div class="detail-item"><strong>Father's Name</strong>${student.fathersName}</div>
                    <div class="detail-item"><strong>Mobile</strong>${student.mobile}</div>
                    <div class="detail-item"><strong>Date of Birth</strong>${student.dob ? format(new Date(student.dob), "PPP") : ''}</div>
                    <div class="detail-item"><strong>Roll No.</strong>${student.roll}</div>
                    <div class="detail-item"><strong>Course</strong>${student.course}</div>
                    <div class="detail-item"><strong>Total Fee</strong>₹${student.totalFee.toLocaleString()}</div>
                    <div class="detail-item"><strong>Amount Paid</strong>₹${student.amountPaid.toLocaleString()}</div>
                    <div class="detail-item full-width"><strong>Address</strong>${student.address}</div>
                  </div>
                </div>
              </div>
              
              ${paymentHistory.length > 0 ? `
              <div class="section">
                <h3>Payment History</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${paymentHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => `
                      <tr>
                        <td>${format(new Date(p.date), 'PPP')}</td>
                        <td>₹${p.amount.toLocaleString()}</td>
                        <td>${p.mode}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}

              <div class="section">
                <h3>Rules and Procedures</h3>
                <ol>
                    <li>Fee once paid is not refundable or adjustable under any circumstances.</li>
                    <li>Students must maintain at least 75% attendance to be eligible for the final examination.</li>
                    <li>The academy reserves the right to modify the course structure and schedule without prior notice.</li>
                    <li>Any damage to academy property will be charged to the responsible student(s).</li>
                    <li>Students must carry their ID card at all times within the academy premises.</li>
                    <li>Misconduct, indiscipline, or violation of rules may result in suspension or expulsion.</li>
                    <li>Use of mobile phones is strictly prohibited in classrooms and the library.</li>
                    <li>The course is time-bound. The academy is not responsible for students who fail to attend classes and complete the course on time.</li>
                    <li>All legal disputes are subject to the jurisdiction of the Ghaziabad court only.</li>
                    <li>The academy may use student photographs and testimonials for promotional purposes.</li>
                </ol>
              </div>
            </div>

            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line">Student's Signature</div>
                    <div>Name (in Hindi): ..........................</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">Authorised Signatory</div>
                    <div>Mohd Suhail</div>
                </div>
            </div>

          </div>
        </body>
      </html>
    `;
    const win = window.open("", "Print Form");
    win?.document.write(printContents);
    win?.document.close();
    win?.print();
}

const StudentCard = ({student, onViewEdit, onDepositFee, onDeleteClick}: {
    student: Student, 
    onViewEdit: (s: Student) => void,
    onDepositFee: (s: Student) => void,
    onDeleteClick: (id: string) => void
}) => {
    const due = student.totalFee - student.amountPaid;
    const status = due <= 0 ? "Paid" : "Pending";
    const fallbackInitials = student.fullName.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <Card className="rounded-2xl shadow-soft dark:shadow-soft-dark overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={student.photo || ""} alt={student.fullName} />
                    <AvatarFallback>{fallbackInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-50">{student.fullName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.roll}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.course}</p>
                </div>
                <div className="text-right">
                     <Badge variant={status === "Paid" ? "default" : "destructive"} className={status === "Paid" ? "bg-green-600 dark:bg-green-700" : "bg-red-600 dark:bg-red-700"}>
                        {status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">Due: ₹{due.toLocaleString()}</p>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => onViewEdit(student)}>View/Edit Profile</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onDepositFee(student)}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Deposit Fee
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handlePrintForm(student, student.paymentHistory || [])}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Form
                      </DropdownMenuItem>
                       <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => onDeleteClick(student.id)} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
            </CardContent>
        </Card>
    );
}

export default function StudentTable({ students, courses, onUpdateStudent, onDeleteStudent }: StudentTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [defaultTab, setDefaultTab] = useState("profile");

  const handleViewEdit = (student: Student) => {
    setSelectedStudent(student);
    setDefaultTab("profile");
    setIsModalOpen(true);
  };
  
  const handleDepositFee = (student: Student) => {
    setSelectedStudent(student);
    setDefaultTab("payments");
    setIsModalOpen(true);
  }

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {students.length > 0 ? (
          students.map((student) => (
            <StudentCard
                key={student.id}
                student={student}
                onViewEdit={handleViewEdit}
                onDepositFee={handleDepositFee}
                onDeleteClick={handleDeleteClick}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            No students found.
          </div>
        )}
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
            onPrintForm={handlePrintForm}
            defaultTab={defaultTab as "profile" | "payments" | "documents"}
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

    