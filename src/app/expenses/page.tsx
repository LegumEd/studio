
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExpensesPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Academic Expenses & Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Expense and income tracking coming soon.</p>
        </CardContent>
      </Card>
    </main>
  );
}
