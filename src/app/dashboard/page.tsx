import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Edit, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6" />
          <span>YAC Fantasy</span>
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
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
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
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">
                Across all leagues
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
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Waiting for response
              </p>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Manage leagues, users, and scoring rules from here.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               <Link href="/create">
                 <Card className="flex h-full flex-col items-center justify-center p-6 hover:bg-accent">
                    <PlusCircle className="h-12 w-12 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold">Create New League</h3>
                    <p className="mt-1 text-sm text-muted-foreground text-center">Set up a new fantasy league for a new season.</p>
                 </Card>
                </Link>
                <Link href="/users">
                  <Card className="flex h-full flex-col items-center justify-center p-6 hover:bg-accent cursor-pointer">
                      <Users className="h-12 w-12 text-primary" />
                      <h3 className="mt-4 text-lg font-semibold">Manage Users</h3>
                      <p className="mt-1 text-sm text-muted-foreground text-center">Create, edit, and invite users to the platform.</p>
                   </Card>
                </Link>
                <Card className="flex h-full flex-col items-center justify-center p-6 hover:bg-accent cursor-pointer">
                    <Edit className="h-12 w-12 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold">Edit Scoring Rules</h3>
                    <p className="mt-1 text-sm text-muted-foreground text-center">Adjust point values for default game modes.</p>
                 </Card>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}