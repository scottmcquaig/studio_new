
'use client';

import { Book, Calendar, Layers, BarChart2, User, LogOut, Shield, Settings } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';


interface BottomNavProps {
    activeTab?: 'Dashboard' | 'Daily' | 'Challenges' | 'Progress' | 'User';
    currentDay?: number;
}

export default function BottomNav({ activeTab = 'Dashboard', currentDay = 1 }: BottomNavProps) {
    const router = useRouter();
    const navItems = [
        { icon: Book, label: 'Dashboard', href: '/' },
        { icon: Calendar, label: 'Daily', href: `/day/${currentDay}` },
        { icon: BarChart2, label: 'Progress', href: '/progress' },
        { icon: Layers, label: 'Challenges', href: '/programs' },
    ];

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    }

    return (
        <footer className="sticky bottom-0 left-0 right-0 bg-card border-t z-10">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="flex justify-around items-center h-20 py-4">
                    {navItems.map((item) => (
                        <Button
                            key={item.label}
                            variant="ghost"
                            className={`flex flex-col items-center justify-center h-14 w-16 px-2 py-1 text-[11px] font-normal leading-tight ${activeTab === item.label ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground hover:bg-accent/20'}`}
                            asChild
                        >
                            <Link href={item.href}>
                                <item.icon className="h-5 w-5 mb-1" />
                                <span>{item.label}</span>
                            </Link>
                        </Button>
                    ))}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button
                                variant="ghost"
                                className={`flex flex-col items-center justify-center h-14 w-16 px-2 py-1 text-[11px] font-normal leading-tight ${activeTab === 'User' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-muted-foreground hover:bg-accent/20'}`}
                            >
                                <User className="h-5 w-5 mb-1" />
                                <span>User</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-40 mb-2">
                             <DropdownMenuItem asChild>
                                <Link href="/settings">
                                    <Settings className="mr-2" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem asChild>
                                <Link href="/backstage">
                                    <Shield className="mr-2" />
                                    Admin
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSignOut}>
                                <LogOut className="mr-2" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </footer>
    );
}
