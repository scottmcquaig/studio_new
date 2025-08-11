
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Hardcoded admin credentials for now
    if (username === 'admin' && password === 'admin') {
      toast({
        title: "Login Successful",
        description: "Welcome, Admin!",
      });
      // In a real app, you'd set a session/token here
      router.push('/dashboard');
    } else {
      setError('Invalid username or password.');
      toast({
        title: "Login Failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <div className="flex flex-col items-center gap-4 mb-8">
        <Logo className="h-24 w-24" />
        <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">
          YAC Fantasy
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
          The Last Fantasy League You'll Ever Need.
        </p>
      </div>
      <Card className="w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit">Sign in</Button>
          </CardFooter>
        </form>
      </Card>
       <footer className="mt-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} YAC Fantasy League. All rights reserved.
          </p>
      </footer>
    </div>
  );
}
