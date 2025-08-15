"use client";

import { cn } from "@/lib/utils";
import { BottomNavBar } from "./bottom-nav-bar";

interface PageLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
    return (
        <div className={cn("pb-24", className)}>
            {children}
            <BottomNavBar />
        </div>
    );
}
