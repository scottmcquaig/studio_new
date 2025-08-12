
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Users, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/standings", icon: BarChart2, label: "Standings" },
  { href: "/houseguests", icon: Users, label: "Houseguests" },
  { href: "/scoring", icon: ClipboardList, label: "Scoring" },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50",
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
