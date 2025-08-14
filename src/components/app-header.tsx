
"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button";
import { ChevronDown, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot, Unsubscribe, collection, query } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { User as UserType, League, Season } from '@/lib/data';
import { MOCK_SEASONS } from "@/lib/data";


export function AppHeader() {
  const db = getFirestore(app);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  
  // This is a placeholder for a real season fetching mechanism
  const activeSeason = MOCK_SEASONS[0];

  useEffect(() => {
    const unsubscribes: Unsubscribe[] = [];

    // Simulate fetching the logged-in user
    const adminUserId = 'user_admin';
    unsubscribes.push(onSnapshot(doc(db, 'users', adminUserId), (docSnap) => {
        if (docSnap.exists()) {
            setCurrentUser({ ...docSnap.data(), id: docSnap.id } as UserType);
        }
    }));
    
    // Fetch all leagues for the dropdown
    unsubscribes.push(onSnapshot(query(collection(db, "leagues")), (snap) => {
        const leaguesData = snap.docs.map(d => ({...d.data(), id: d.id} as League));
        setAllLeagues(leaguesData);
        // Set the active league (e.g., the first one, or from user preferences)
        if (leaguesData.length > 0) {
            setActiveLeague(leaguesData[0]);
        }
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [db]);

  const canShowAdminView = currentUser?.role === 'site_admin' || currentUser?.role === 'league_admin';

  if (!activeLeague || !activeSeason) {
      return (
           <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
             <div className="flex items-center gap-2">
                <Logo className="h-7 w-7" />
                <div className="flex flex-col -space-y-1.5">
                   <h1 className="font-headline text-lg font-semibold tracking-tight">Loading...</h1>
                </div>
             </div>
           </header>
      )
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-7 w-7" />
        <div className="flex flex-col -space-y-1.5">
           <h1 className="font-headline text-lg font-semibold tracking-tight">{activeLeague.name}</h1>
           <p className="text-xs text-muted-foreground">{activeSeason?.title}</p>
        </div>
      </Link>
      
      {canShowAdminView && (
        <Button asChild variant="ghost" size="icon" className="ml-2">
            <Link href="/admin">
                <Settings className="h-5 w-5"/>
            </Link>
        </Button>
      )}

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
            {allLeagues.map(league => (
                <DropdownMenuItem key={league.id} onSelect={() => setActiveLeague(league)}>
                    {league.name}
                </DropdownMenuItem>
            ))}
             <DropdownMenuSeparator />
             <DropdownMenuItem disabled>Past Leagues</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
