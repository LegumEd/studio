
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { format, subDays, eachDayOfInterval } from 'date-fns';

type Transaction = {
  type: "Income" | "Expense";
  amount: number;
  category: string;
  date: string;
};

export async function getDashboardStats() {
  const studentsPromise = getDocs(collection(db, "students"));
  const coursesPromise = getDocs(collection(db, "courses"));
  const enquiriesQuery = query(collection(db, "enquiries"), where("status", "==", "Pending"));
  const enquiriesPromise = getDocs(enquiriesQuery);

  const [studentSnapshot, courseSnapshot, enquirySnapshot] = await Promise.all([
    studentsPromise,
    coursesPromise,
    enquiriesPromise,
  ]);

  return {
    studentCount: studentSnapshot.size,
    courseCount: courseSnapshot.size,
    pendingEnquiries: enquirySnapshot.size,
  };
}

export async function getTransactionChartData() {
  const transactionSnapshot = await getDocs(collection(db, "transactions"));
  const transactions = transactionSnapshot.docs.map(doc => doc.data() as Transaction);

  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
  const chartData = last7Days.map(day => {
    const dateString = format(day, 'yyyy-MM-dd');
    const dailyTransactions = transactions.filter(t => t.date === dateString);
    const income = dailyTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = dailyTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(day, 'MMM d'),
      Income: income,
      Expenses: expenses,
    };
  });

  return { chartData, totalIncome, totalExpenses, netBalance };
}
