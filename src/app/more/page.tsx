
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";

export default function MorePage() {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
         <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <MoreHorizontal className="h-5 w-5" />
          More
        </h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
           <CardHeader>
            <CardTitle>More Options</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Links to Rules, Admin Console, and other resources will be here.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
