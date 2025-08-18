
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "./ui/button";
import { Settings, LogOut, User as UserIcon, LogIn, UserPlus, Shield, ChevronsRight } from "lucide-react";
import { createElement, useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot, Unsubscribe, collection, query } from 'firebase/firestore';
import { app, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import type { User as UserType, League, Season } from '@/lib/data';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";

const LEAGUE_ID = 'bb27';

interface AppHeaderProps {
    pageTitle: string;
    pageIcon: React.ElementType;
}

export function AppHeader({ pageTitle, pageIcon }: AppHeaderProps) {
  const db = getFirestore(app);
  const { appUser: currentUser, loading } = useAuth();
  const router = useRouter();

  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  
  useEffect(() => {
    const unsubscribes: Unsubscribe[] = [];
    
    unsubscribes.push(onSnapshot(query(collection(db, "leagues")), (snap) => {
        const leaguesData = snap.docs.map(d => ({...d.data(), id: d.id} as League));
        setAllLeagues(leaguesData);
        if (leaguesData.length > 0) {
            const currentLeague = leaguesData.find(l => l.id === LEAGUE_ID) || leaguesData[0];
            setActiveLeague(currentLeague);

            if (currentLeague.seasonId) {
                const seasonDocRef = doc(db, "seasons", currentLeague.seasonId);
                const unsubSeason = onSnapshot(seasonDocRef, (seasonSnap) => {
                    if (seasonSnap.exists()) {
                        setActiveSeason({ ...seasonSnap.data(), id: seasonSnap.id } as Season);
                    } else {
                        setActiveSeason(null);
                    }
                });
                unsubscribes.push(unsubSeason);
            } else {
                 setActiveSeason(null);
            }
        } else {
            setActiveLeague(null);
            setActiveSeason(null);
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

  const canManageLeague = currentUser?.role === 'site_admin' || currentUser?.role === 'league_admin';
  const isSiteAdmin = currentUser?.role === 'site_admin';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
             {activeLeague && activeSeason ? (
                <>
                    <div className="flex flex-col -space-y-1.5">
                        <h1 className="font-headline text-lg font-semibold tracking-tight">{activeSeason?.title}</h1>
                        <p className="text-xs text-muted-foreground">{activeLeague.name}</p>
                    </div>
                    <ChevronsRight className="h-4 w-4 text-muted-foreground/50 rotate-90 sm:rotate-0" />
                    <div className="flex items-center gap-2">
                        {createElement(pageIcon, { className: "h-5 w-5"})}
                        <h1 className="text-lg font-semibold md:text-xl hidden sm:inline-block">
                            {pageTitle}
                        </h1>
                    </div>
                </>
             ) : (
                 <h1 className="font-headline text-lg font-semibold tracking-tight">YAC Fantasy</h1>
             )}
        </Link>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <TooltipProvider>
            {canManageLeague && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/admin"><Settings className="h-5 w-5"/></Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>League Admin</p>
                    </TooltipContent>
                </Tooltip>
            )}
            
            {isSiteAdmin && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/admin?view=site"><Shield className="h-5 w-5"/></Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Site Admin</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </TooltipProvider>

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
                        {allLeagues.length > 0 && (
                            <>
                                <DropdownMenuLabel>Active Leagues</DropdownMenuLabel>
                                {allLeagues.map(league => (
                                    <DropdownMenuItem key={league.id} onSelect={() => setActiveLeague(league)}>
                                        {league.name}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                            </>
                        )}
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

    