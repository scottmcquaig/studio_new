
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut, ArrowRight, PlusCircle, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { MOCK_LEAGUES } from "@/lib/data";

export default function LeaguesPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <Link href="/leagues" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6" />
          <span>YAC Fantasy</span>
        </Link>
        <div className="flex items-center gap-4">
           <span className="text-sm text-muted-foreground hidden sm:inline-block">Welcome, Scott!</span>
           <Link href="/">
            <Button variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
            <h1 className="text-2xl font-semibold">Your Leagues</h1>
             <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/create">
                    Join League
                    <PlusCircle className="h-4 w-4" />
                </Link>
            </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_LEAGUES.map((league) => (
            <Card key={league.id}>
              <CardHeader>
                <CardTitle>{league.name}</CardTitle>
                <CardDescription>{league.game} - {league.season}</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center text-sm text-muted-foreground">
                   <Users className="mr-2 h-4 w-4" />
                   <span>{league.teams} Teams</span>
                 </div>
              </CardContent>
              <CardFooter>
                 <Link href={`/league/${league.id}`} className="w-full">
                    <Button className="w-full">
                        View League
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
