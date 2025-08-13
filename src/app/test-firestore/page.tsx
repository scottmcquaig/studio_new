
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { testFirestoreWrite } from '@/app/actions';
import { Flame } from 'lucide-react';

export default function TestFirestorePage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleTestWrite = async () => {
        setIsLoading(true);
        try {
            const result = await testFirestoreWrite();
            toast({
                title: "Success!",
                description: result,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
                <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
                    <Flame className="h-5 w-5" />
                    Firestore Connection Test
                </h1>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Test Firestore Write</CardTitle>
                        <CardDescription>
                            Click the button below to attempt a simple write operation to your Firestore database.
                            This will create a new document in a collection called `test_logs`.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleTestWrite} disabled={isLoading} className="w-full">
                            {isLoading ? "Testing..." : "Run Write Test"}
                        </Button>
                         <p className="text-sm text-muted-foreground mt-4">
                            After clicking, check your Firebase Console to see if a `test_logs` collection was created with a new document inside. This will confirm that your credentials and permissions are set up correctly.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
