
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EnquiriesPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Enquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Enquiries management coming soon.</p>
        </CardContent>
      </Card>
    </main>
  );
}
