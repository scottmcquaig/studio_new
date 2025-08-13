
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { app } from '@/lib/firebase';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  favNumber: z.coerce.number().optional(),
});

export default function FormsPage() {
  const { toast } = useToast();
  const db = getFirestore(app);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      favNumber: undefined,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await addDoc(collection(db, "submissions"), {
        ...values,
        submittedAt: new Date(),
      });

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
                        <Input type="number" placeholder="e.g., 42" {...field} />
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
      </main>
    </div>
  );
}
