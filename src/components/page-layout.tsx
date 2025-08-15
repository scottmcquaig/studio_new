"use client";

import { cn } from "@/lib/utils";

interface PageLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
    return (
        <div className={cn("pb-24", className)}>
            {children}
        </div>
    );
}
