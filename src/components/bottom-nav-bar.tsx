"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, BarChart2, Calendar, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/team", icon: Shield, label: "My Team" },
  { href: "/standings", icon: BarChart2, label: "Standings" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/more", icon: MoreHorizontal, label: "More" },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
