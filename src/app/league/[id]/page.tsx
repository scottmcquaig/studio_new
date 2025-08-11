
import Link from "next/link";
import { MOCK_LEAGUES, MOCK_HOUSEGUESTS } from "@/lib/data";
import { ArrowLeft, LogOut, Users, Award, ShieldCheck, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

export default function LeagueDetailPage({ params }: { params: { id: string } }) {
  const league = MOCK_LEAGUES.find((l) => l.id === params.id);

  if (!league) {
    return <div>League not found</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
           <Link href="/leagues" className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Leagues</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 font-semibold">
             <Logo className="h-6 w-6" />
             <span>{league.name}</span>
          </div>
        </div>
        <Link href="/">
          <Button variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue="overview">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="houseguests">Houseguests</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="rules">Scoring Rules</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
               <Button>Draft Now</Button>
            </div>
          </div>
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1st</div>
                  <p className="text-xs text-muted-foreground">out of {league.teams} teams</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,250</div>
                   <p className="text-xs text-muted-foreground">+200 from last week</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Draft Status</CardTitle>
                   <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Completed</div>
                  <p className="text-xs text-muted-foreground">Draft was on Aug 1st</p>
                </CardContent>
              </Card>
            </div>
            {/* Leaderboard will go here */}
          </TabsContent>
          <TabsContent value="houseguests">
            <Card className="mt-4">
               <CardHeader>
                <CardTitle>Houseguests</CardTitle>
                <CardDescription>
                  The {MOCK_HOUSEGUESTS.length} individuals competing this season.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {MOCK_HOUSEGUESTS.map((hg) => (
                    <Card key={hg.id} className="overflow-hidden">
                       <Image
                          src={hg.imageUrl}
                          alt={hg.name}
                          width={200}
                          height={200}
                          className="w-full h-auto aspect-square object-cover"
                          data-ai-hint="person portrait"
                        />
                        <CardFooter className="p-2 flex-col items-start">
                           <p className="font-semibold text-sm">{hg.name}</p>
                           <Badge variant={hg.status === 'In House' ? 'secondary' : 'outline'} className="mt-1">{hg.status}</Badge>
                        </CardFooter>
                    </Card>
                  ))}
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="teams">
             <Card className="mt-4">
               <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>
                  Manage the teams in this league.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <p>Team management will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="rules">
             <Card className="mt-4">
               <CardHeader>
                <CardTitle>Scoring Rules</CardTitle>
                <CardDescription>
                  Points awarded for in-game events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Rules display will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
