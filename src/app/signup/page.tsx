
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getFirestore, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, app } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const db = getFirestore(app);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!querySnapshot.empty) {
        const existingUserDoc = querySnapshot.docs[0];
        const batch = writeBatch(db);
        
        const newUserDocRef = doc(db, "users", user.uid);
        // Copy existing data, but don't touch the role. Update status and ID.
        const { role, ...restOfData } = existingUserDoc.data();
        const updatedData = {
            ...restOfData,
            role: role, // Preserve the existing role
            id: user.uid,
            status: 'active',
            displayName: displayName || existingUserDoc.data().displayName,
        };
        batch.set(newUserDocRef, updatedData);
        
        batch.delete(existingUserDoc.ref);

        await batch.commit();
        toast({ title: "Success", description: "Account claimed successfully!" });

      } else {
        // New user, create a new document in Firestore with a default 'player' role
        // This is safe because it's a new user, not an existing privileged one.
        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            displayName: displayName,
            email: user.email,
            createdAt: new Date().toISOString(),
            role: 'player', // Assign a default, non-privileged role
            status: 'active'
        });
        toast({ title: "Success", description: "Account created successfully!" });
      }

      router.push('/');

    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                placeholder="Max Power"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
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
              Create an account
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
