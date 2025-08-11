
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Edit, LogOut, ArrowRight, Tv, Users2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_LEAGUES } from "@/lib/data";


export default function DashboardPage() {
  const activeLeagues = MOCK_LEAGUES.filter(l => l.status === 'Live');

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6" />
          <span>YAC Fantasy (Admin)</span>
        </Link>
        <Link href="/">
          <Button variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </Link>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Leagues
              </CardTitle>
               <Tv className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLeagues.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
               <Users2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                admin, scott
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Invites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Waiting for response
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>Active Leagues</CardTitle>
                  <CardDescription>
                    Manage your ongoing fantasy leagues.
                  </CardDescription>
                </div>
                 <Button asChild size="sm" className="ml-auto gap-1">
                  <Link href="/create">
                    Create League
                    <PlusCircle className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>League Name</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">End Date</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLeagues.map((league) => (
                      <TableRow key={league.id}>
                        <TableCell className="font-medium">{league.name}</TableCell>
                        <TableCell>{league.game}</TableCell>
                        <TableCell>
                          <Badge variant={league.status === 'Live' ? 'secondary' : 'outline'}>{league.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{league.endDate}</TableCell>
                        <TableCell>
                          <Link href={`/league/${league.id}`}>
                            <Button size="sm" variant="outline">
                              View
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Manage leagues, users, and scoring rules from here.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                 <Link href="/create">
                   <Card className="flex h-full flex-col justify-center p-4 hover:bg-accent">
                      <div className="flex items-center gap-4">
                        <PlusCircle className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="text-md font-semibold">Create New League</h3>
                          <p className="text-xs text-muted-foreground">Set up a new fantasy league for a new season.</p>
                        </div>
                      </div>
                   </Card>
                  </Link>
                  <Link href="/users">
                    <Card className="flex h-full flex-col justify-center p-4 hover:bg-accent cursor-pointer">
                      <div className="flex items-center gap-4">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="text-md font-semibold">Manage Users</h3>
                          <p className="text-xs text-muted-foreground">Create, edit, and invite users to the platform.</p>
                        </div>
                      </div>
                     </Card>
                  </Link>
                  <Card className="flex h-full flex-col justify-center p-4 hover:bg-accent cursor-pointer">
                      <div className="flex items-center gap-4">
                        <Edit className="h-8 w-8 text-primary" />
                         <div>
                          <h3 className="text-md font-semibold">Edit Scoring Rules</h3>
                          <p className="text-xs text-muted-foreground">Adjust point values for default game modes.</p>
                        </div>
                      </div>
                   </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
