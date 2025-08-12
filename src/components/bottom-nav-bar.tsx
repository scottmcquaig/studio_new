"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Users, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/standings", icon: BarChart2, label: "Standings" },
  { href: "/teams", icon: Users, label: "Teams" },
  { href: "/scoring", icon: ClipboardList, label: "Scoring" },
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
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center justify-around">
        {navItems.map((item) => {
          // On the client, we can check the path. On the server, we can't, so we default to false.
          const isActive = isClient ? pathname === item.href : false;
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
