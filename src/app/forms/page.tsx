
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send } from "lucide-react";

export default function FormsPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [favNumber, setFavNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !favNumber) {
      toast({
        title: "Submission Failed",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Form Submitted!",
      description: `Name: ${name}, Favorite Number: ${favNumber}`,
    });

    // Reset form
    setName('');
    setFavNumber('');
  };

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Forms
        </h1>
      </header>
      <main className="flex flex-1 flex-col items-center gap-6 p-4 md:gap-8 md:p-8">
        <Card className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Simple Form</CardTitle>
              <CardDescription>Enter your name and favorite number.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Jane Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favNumber">Favorite Number</Label>
                <Input 
                  id="favNumber" 
                  type="number" 
                  placeholder="e.g., 42" 
                  value={favNumber}
                  onChange={(e) => setFavNumber(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Submit
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
