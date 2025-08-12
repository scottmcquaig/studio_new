'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/logo';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/dashboard');
    }, 2000); // 2-second delay for splash screen

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-24 w-24 text-primary" />
        <div className="text-center">
            <h1 className="text-2xl font-headline font-bold">YAC FANTASY LEAGUE</h1>
            <p className="text-sm text-muted-foreground">The Last Fantasy League You'll Ever Need</p>
        </div>
      </div>
    </div>
  );
}
