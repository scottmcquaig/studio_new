
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function EventsPage() {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
         <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Events
        </h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
           <CardHeader>
            <CardTitle>Upcoming & Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p>A list of game events will be available here.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
