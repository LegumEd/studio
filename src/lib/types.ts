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
  lastUpdated: string;
}

export const courses = [
  "PCSj", "APO", "CLAT", "BALLB 1", "BALLB 2", "BALLB 3", "BALLB 4", "BALLB 5", 
  "BALLB 6", "BALLB 7", "BALLB 8", "BALLB 9", "BALLB 10", "LLB 1", "LLB 2", "LLB 3", 
  "LLB 4", "LLB 5", "LLB 6", "LLM 1", "LLM 2", "LLM 3", "LLM 4"
];

export const paymentModes = ["Cash", "UPI", "Bank Transfer"];
