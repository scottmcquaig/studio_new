
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send, History } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { app } from '@/lib/firebase';
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  favNumber: z.coerce.number().optional(),
});

type Submission = {
  id: string;
  name: string;
  favNumber?: number | null;
  submittedAt: Timestamp;
};

export default function FormsPage() {
  const { toast } = useToast();
  const db = getFirestore(app);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      favNumber: "" as any,
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    const submissionsCol = collection(db, "submissions");
    const q = query(submissionsCol, orderBy("submittedAt", "desc"), limit(5));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const subs: Submission[] = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() } as Submission);
      });
      setSubmissions(subs);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [db]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const submissionData = {
        ...values,
        favNumber: values.favNumber ? Number(values.favNumber) : null,
        submittedAt: new Date(),
      };

      await addDoc(collection(db, "submissions"), submissionData);

      toast({
        title: "Form Submitted!",
        description: `Your submission has been saved.`,
      });
      form.reset();
    } catch (error) {
       console.error('Failed to save form submission:', error);
       toast({
        title: "Submission Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Simple Form</CardTitle>
                <CardDescription>Enter your name and favorite number. This will be saved to Firestore.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="favNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Favorite Number</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 42" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Submissions
                </CardTitle>
                <CardDescription>Showing the last 5 entries.</CardDescription>
            </CardHeader>
            <CardContent>
                {submissions.length > 0 ? (
                    <ul className="space-y-4">
                        {submissions.map((sub, index) => (
                           <React.Fragment key={sub.id}>
                             <li className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{sub.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {sub.submittedAt.toDate().toLocaleString()}
                                    </p>
                                </div>
                                <p className="font-mono text-lg">{sub.favNumber ?? 'N/A'}</p>
                            </li>
                            {index < submissions.length - 1 && <Separator />}
                           </React.Fragment>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground text-center">No submissions yet.</p>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
