
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database } from 'lucide-react';

export default function DatabaseTestPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleReadTest = async () => {
        setLoading(true);
        setMessage('Simulating read from Firestore...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        setMessage(`Successfully simulated read! League Name: "YAC Fantasy League (Simulated)"`);
        setLoading(false);
    };

    const handleWriteTest = async () => {
        setLoading(true);
        const testLeagueName = `DB Write Test - ${new Date().toLocaleTimeString()}`;
        setMessage(`Simulating write to Firestore with name: "${testLeagueName}"`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        setMessage('Successfully simulated write to Firestore! Check the value by running the read test again.');
        setLoading(false);
    };

    return (
        <div className="flex flex-col">
             <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
                <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Test
                </h1>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Firestore Connectivity Test</CardTitle>
                        <CardDescription>
                            Use these buttons to verify that the application can successfully connect to and interact with your Firestore database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex space-x-4">
                            <Button onClick={handleReadTest} disabled={loading}>
                                {loading ? 'Testing...' : 'Test Read'}
                            </Button>
                            <Button onClick={handleWriteTest} disabled={loading}>
                                {loading ? 'Testing...' : 'Test Write'}
                            </Button>
                        </div>
                        {message && (
                            <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                                <p className="font-mono whitespace-pre-wrap">{message}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
