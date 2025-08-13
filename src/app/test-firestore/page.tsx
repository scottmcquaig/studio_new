
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { testFirestoreWrite } from '@/app/actions';
import { Flame } from 'lucide-react';

export default function TestFirestorePage() {
  const { toast } = useToast();

  const handleTestWrite = async () => {
    try {
      await testFirestoreWrite();
      toast({
        title: 'Success!',
        description: 'Successfully wrote a document to the `test_logs` collection in Firestore. Please check your Firebase console.',
        variant: 'default',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to write to Firestore. Check the server console logs for details.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Flame /> Firestore Connection Test</CardTitle>
          <CardDescription>
            Click the button below to perform a simple write operation to your Firestore database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This will attempt to create a new document in a collection called <strong>test_logs</strong>.
            You can verify the result in your Firebase Console.
          </p>
          <Button onClick={handleTestWrite} className="w-full">
            Run Firestore Write Test
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
