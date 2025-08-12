
import Link from "next/link";
import { Logo } from "@/components/logo";
import { MOCK_LEAGUES, MOCK_SEASONS } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";


export function AppHeader() {
  const activeLeague = MOCK_LEAGUES[0];
  const activeSeason = MOCK_SEASONS.find(s => s.id === activeLeague.seasonId);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Logo className="h-7 w-7" />
        <div className="flex flex-col -space-y-1.5">
           <h1 className="font-headline text-lg font-semibold tracking-tight">{activeLeague.name}</h1>
           <p className="text-xs text-muted-foreground">{activeSeason?.title}</p>
        </div>
      </Link>
      <div className="ml-auto">
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Leagues
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Active Leagues</DropdownMenuLabel>
            <DropdownMenuItem>YAC Fantasy League - BB27</DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem disabled>Past Leagues</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
