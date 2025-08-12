
import { MOCK_LEAGUES } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award } from "lucide-react";

export default function DashboardPage() {
  const activeLeague = MOCK_LEAGUES[0];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold md:text-xl">{activeLeague.name}</h1>
          <p className="text-xs text-muted-foreground">{activeLeague.season}</p>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1st</div>
              <p className="text-xs text-muted-foreground">out of {activeLeague.teams} teams</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
               <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+1,250</div>
              <p className="text-xs text-muted-foreground">+200 from last week</p>
            </CardContent>
          </Card>
        </div>

        <Card>
           <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>Top 3 Teams</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Leaderboard preview coming soon.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
