
import { Timestamp } from "firebase/firestore";
import * as z from "zod";

export interface DocumentFile {
  name: string;
  data: string; // Base64 data URL
  type: string;
}

export interface Payment {
  amount: number;
  mode: "Cash" | "UPI" | "Bank Transfer";
  date: string;
  timestamp: string;
  collectedBy?: string;
}

export interface Student {
  id: string;
  fullName: string;
  fathersName: string;
  mobile: string;
  dob: string;
  roll: string;
  course: string;
  enrollmentYear: number;
  enrollmentDate: string;
  totalFee: number;
  amountPaid: number;
  paymentMode: "Cash" | "UPI" | "Bank Transfer";
  paymentDate: string;
  address: string;
  photo?: string; // Base64 data URL
  documents?: DocumentFile[];
  paymentHistory?: Payment[];
  lastUpdated: Timestamp | Date | string;
}

export interface Course {
  id: string;
  name: string;
  fee: number;
}

export interface StudyMaterial {
    id: string;
    name: string;
    price: number;
}

export interface InventoryItem {
    id: string; // Corresponds to StudyMaterial ID
    title: string;
    totalStock: number;
    availableStock: number;
}


export interface Sale {
    id: string;
    customerName: string;
    materialId: string;
    materialName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    medium: 'English' | 'Hindi';
    collegeUniversity?: string;
    saleDate: string;
}

export const transactionSchema = z.object({
  description: z.string().min(2, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  type: z.enum(["Income", "Expense"]),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
});

export type Transaction = z.infer<typeof transactionSchema> & {
  id: string;
};


// This is managed in Firestore and fetched dynamically.
// Kept here only for reference for paymentModes.
export const paymentModes = ["Cash", "UPI", "Bank Transfer"];
