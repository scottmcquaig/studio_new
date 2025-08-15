
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
import { ChevronDown, Settings, LogOut, User as UserIcon, LogIn, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot, Unsubscribe, collection, query } from 'firebase/firestore';
import { app, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import type { User as UserType, League, Season } from '@/lib/data';
import { MOCK_SEASONS } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const LEAGUE_ID = 'bb27';

export function AppHeader() {
  const db = getFirestore(app);
  const { appUser: currentUser, loading } = useAuth();
  const router = useRouter();

  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  
  // This is a placeholder for a real season fetching mechanism
  const activeSeason = MOCK_SEASONS[0];

  useEffect(() => {
    const unsubscribes: Unsubscribe[] = [];
    
    // Fetch all leagues for the dropdown
    unsubscribes.push(onSnapshot(query(collection(db, "leagues")), (snap) => {
        const leaguesData = snap.docs.map(d => ({...d.data(), id: d.id} as League));
        setAllLeagues(leaguesData);
        // Set the active league (e.g., the first one, or from user preferences)
        if (leaguesData.length > 0) {
            setActiveLeague(leaguesData.find(l => l.id === LEAGUE_ID) || leaguesData[0]);
        }
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [db]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const canShowAdminView = currentUser?.role === 'site_admin' || currentUser?.role === 'league_admin';

  if (loading || !activeLeague || !activeSeason) {
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

      <div className="ml-auto flex items-center gap-2">
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

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <UserIcon className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {currentUser ? (
                    <>
                        <DropdownMenuLabel>{currentUser.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={() => router.push('/settings')}>
                            <Settings className="mr-2"/> Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2"/> Logout
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuItem onClick={() => router.push('/login')}>
                            <LogIn className="mr-2"/> Login
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => router.push('/signup')}>
                            <UserPlus className="mr-2"/> Sign Up
                        </DropdownMenuItem>
                    </>
                )}

            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
