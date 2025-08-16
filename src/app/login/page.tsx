"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailQuestion } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { appUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && appUser && appUser.status === 'active') {
      router.push('/');
    }
  }, [appUser, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The useEffect will handle redirection based on user status
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
      );
  }
  
  if (appUser && appUser.status === 'pending') {
      return (
         <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
             <div className="absolute top-4 left-4">
                <Link href="/" className="flex items-center gap-2 text-foreground">
                    <Logo className="h-7 w-7" />
                    <h1 className="font-headline text-lg font-semibold tracking-tight">YAC Fantasy</h1>
                </Link>
            </div>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Check Your Email</CardTitle>
                    <CardDescription>Your account is pending activation.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <MailQuestion className="h-4 w-4" />
                        <AlertTitle>Invitation Sent</AlertTitle>
                        <AlertDescription>
                            You have been invited to join the league! Please check your email for an invitation link to set your password and activate your account.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
      )
  }
  
  if (appUser && appUser.status === 'active') {
     return (
        <div className="flex h-screen items-center justify-center">
          <div>Redirecting...</div>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-2 text-foreground">
            <Logo className="h-7 w-7" />
             <h1 className="font-headline text-lg font-semibold tracking-tight">YAC Fantasy</h1>
        </Link>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
