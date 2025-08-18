
import { Timestamp } from "firebase/firestore";

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
}

export interface Student {
  id: string;
  fullName: string;
  fathersName: string;
  mobile: string;
  dob: string;
  roll: string;
  course: string;
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

// This is managed in Firestore and fetched dynamically.
// Kept here only for reference for paymentModes.
export const paymentModes = ["Cash", "UPI", "Bank Transfer"];
