
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, UserSquare, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getFirestore, onSnapshot, collection } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { League, Team } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";


export function BottomNavBar() {
  const pathname = usePathname();
  const db = getFirestore(app);
  const { appUser } = useAuth();
  
  const [isClient, setIsClient] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [contestantTermPlural, setContestantTermPlural] = useState('Contestants');

  useEffect(() => {
    setIsClient(true);
    const unsubLeagues = onSnapshot(collection(db, "leagues"), (snap) => {
      const leaguesData = snap.docs.map(d => ({ ...d.data(), id: d.id } as League));
      setLeagues(leaguesData);
      // Logic could be enhanced with a league switcher, for now we find the first one.
      const currentLeague = leaguesData.length > 0 ? leaguesData[0] : null;
      setContestantTermPlural(currentLeague?.contestantTerm?.plural || 'Contestants');
    });
    
    const unsubTeams = onSnapshot(collection(db, "teams"), (snap) => {
      const teamsData = snap.docs.map(d => ({ ...d.data(), id: d.id } as Team));
      setTeams(teamsData);
    });

    return () => {
      unsubLeagues();
      unsubTeams();
    };
  }, [db]);
  
  useEffect(() => {
    if (!appUser) {
      setIsVisible(false);
      return;
    }

    if (appUser.role === 'site_admin') {
      setIsVisible(leagues.length > 0);
    } else {
      const userIsOnTeam = teams.some(team => team.ownerUserIds.includes(appUser.id));
      setIsVisible(userIsOnTeam);
    }
  }, [appUser, leagues, teams]);


  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/teams", icon: Users, label: "Teams" },
    { href: "/contestants", icon: UserSquare, label: contestantTermPlural },
    { href: "/scoring", icon: ClipboardList, label: "Scoring" },
  ];
  
  if (!isVisible) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4 items-center justify-around">
        {navItems.map((item) => {
          const isActive = isClient ? (item.href === "/" ? pathname === item.href : pathname.startsWith(item.href)) : false;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent/10",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
