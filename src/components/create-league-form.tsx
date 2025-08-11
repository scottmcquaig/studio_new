"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  PlusCircle,
  Trash2,
  Loader2,
  Wand2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { BB_RULES, SURVIVOR_RULES } from "@/lib/constants";
import { getLeagueDescription } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ruleSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.coerce.number(),
});

const formSchema = z.object({
  leagueName: z.string().min(3, "League name must be at least 3 characters."),
  gameType: z.enum(["big_brother", "survivor", "custom"]),
  season: z.string().min(1, "Season is required."),
  visibility: z.enum(["private", "link"]),
  startDate: z.date({ required_error: "A start date is required." }),
  endDate: z.date({ required_error: "An end date is required." }),
  rosterSize: z.coerce.number().min(1, "Roster size must be at least 1."),
  draftType: z.enum(["snake", "fixed"]),
  description: z.string().optional(),
  rules: z.array(ruleSchema),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateLeagueForm() {
  const [isGenerating, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leagueName: "",
      gameType: "big_brother",
      season: "26",
      visibility: "private",
      rosterSize: 5,
      draftType: "snake",
      description: "",
      rules: BB_RULES,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rules",
  });

  const gameType = form.watch("gameType");

  const handleGameTypeChange = (value: "big_brother" | "survivor" | "custom") => {
    form.setValue("gameType", value);
    if (value === "big_brother") {
      form.setValue("rules", BB_RULES);
    } else if (value === "survivor") {
      form.setValue("rules", SURVIVOR_RULES);
    } else {
      form.setValue("rules", []);
    }
  };
  
  const handleGenerateDescription = async () => {
    const values = form.getValues();
    if (!values.leagueName || !values.season) {
      toast({
        title: "Missing Information",
        description: "Please enter a League Name and Season to generate a description.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const desc = await getLeagueDescription({
          leagueName: values.leagueName,
          season: values.season,
          gameType: values.gameType,
          rosterSize: values.rosterSize,
          draftType: values.draftType,
          visibility: values.visibility,
        });
        form.setValue("description", desc);
         toast({
          title: "Description Generated!",
          description: "Your league description has been created by AI.",
        });
      } catch (error) {
        toast({
          title: "Generation Failed",
          description: "Could not generate a description at this time.",
          variant: "destructive",
        });
      }
    });
  };

  function onSubmit(values: FormValues) {
    console.log(values);
    toast({
      title: "League Created!",
      description: "Your new fantasy league is ready to go.",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <Tabs defaultValue="details">
            <div className="border-b">
              <CardHeader>
                <CardTitle>Create New League</CardTitle>
                <CardDescription>
                  Fill out the details below to get your new league up and running.
                </CardDescription>
              </CardHeader>
              <div className="px-6">
                <TabsList>
                  <TabsTrigger value="details">League Details</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="rules">Scoring Rules</TabsTrigger>
                </TabsList>
              </div>
            </div>
            <TabsContent value="details" className="p-0">
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="leagueName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>League Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., The Jury House" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="gameType"
                    render={() => (
                      <FormItem>
                        <FormLabel>Game</FormLabel>
                        <Select
                          onValueChange={(val: "big_brother" | "survivor" | "custom") => handleGameTypeChange(val)}
                          defaultValue={gameType}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a game" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="big_brother">Big Brother</SelectItem>
                            <SelectItem value="survivor">Survivor</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="season"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Season</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 47 or All-Stars" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="private">Private (Invite Only)</SelectItem>
                            <SelectItem value="link">Public (With Link)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex items-center justify-between">
                        <FormLabel>League Description (Optional)</FormLabel>
                        <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                          {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="mr-2 h-4 w-4" />
                          )}
                          Generate with AI
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="A fun, engaging description for your league."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>This will be shown on the league's public page.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </TabsContent>
            <TabsContent value="settings" className="p-0">
               <CardContent className="space-y-6 p-6">
                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="rosterSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roster Size</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5" {...field} />
                          </FormControl>
                          <FormDescription>The number of players per team.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="draftType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Draft Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select draft type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="snake">Snake</SelectItem>
                              <SelectItem value="fixed">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>The order of player selection.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
               </CardContent>
            </TabsContent>
            <TabsContent value="rules" className="p-0">
               <CardContent className="space-y-4 p-6">
                <div>
                  <h3 className="text-lg font-medium">Scoring Rules</h3>
                  <p className="text-sm text-muted-foreground">
                    Define how points are awarded. Start with a preset or create your own from scratch for custom games.
                  </p>
                </div>
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2">Event</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">
                            {field.name}
                          </TableCell>
                          <TableCell>
                            <FormField
                                control={form.control}
                                name={`rules.${index}.points`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    </FormItem>
                                )}
                                />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ id: `custom_${fields.length}`, name: 'New Custom Rule', points: 0})}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Custom Rule
                  </Button>
               </CardContent>
            </TabsContent>
          </Tabs>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Create League</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
