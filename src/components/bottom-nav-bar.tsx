
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, UserSquare, ClipboardList, Settings, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { MOCK_LEAGUES } from "@/lib/data";

const league = MOCK_LEAGUES[0];
const contestantTerm = league.contestantTerm;

const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/teams", icon: Users, label: "Teams" },
  { href: "/contestants", icon: UserSquare, label: contestantTerm.plural },
  { href: "/scoring", icon: ClipboardList, label: "Scoring" },
  { href: "/forms", icon: FileText, label: "Forms" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-6 items-center justify-around">
        {navItems.map((item) => {
          // On the client, we can check the path. On the server, we can't, so we default to false.
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
