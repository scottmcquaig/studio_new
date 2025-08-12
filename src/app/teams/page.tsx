import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function TeamsPage() {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <Users className="h-5 w-5" />
          Teams
        </h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>League Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <p>A list of all teams in the league will be displayed here.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
