
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, UserSquare, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { League } from "@/lib/data";

const LEAGUE_ID = 'bb27';

export function BottomNavBar() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    setIsClient(true);
    const unsub = onSnapshot(doc(db, "leagues", LEAGUE_ID), (doc) => {
      if (doc.exists()) {
        setActiveLeague(doc.data() as League);
      }
    });
    return () => unsub();
  }, [db]);

  const contestantTerm = activeLeague?.contestantTerm || { plural: 'Contestants' };

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/teams", icon: Users, label: "Teams" },
    { href: "/contestants", icon: UserSquare, label: contestantTerm.plural },
    { href: "/scoring", icon: ClipboardList, label: "Scoring" },
  ];

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
