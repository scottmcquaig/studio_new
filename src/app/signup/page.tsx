
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Brain, Check, DollarSign, Heart, Loader2, Target, Bell, Sparkles, AlertTriangle } from "lucide-react";
import { tracks as allTracks } from "@/lib/tracks.json";
import { cn } from "@/lib/utils";
import { validateUnlockCode } from "@/ai/flows/validate-unlock-code";
import type { ValidatedCode } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { createUserAndClaimCode } from "@/ai/flows/create-user-and-claim-code";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const iconMap: { [key: string]: React.ComponentType<any> } = {
  "dollar-sign": DollarSign,
  "heart": Heart,
  "target": Target,
  "brain": Brain,
};

type Track = typeof allTracks[0];

const timezones = [
    { value: 'America/New_York', label: 'EST (UTC-5)' },
    { value: 'America/Chicago', label: 'CST (UTC-6)' },
    { value: 'America/Denver', label: 'MST (UTC-7)' },
    { value: 'America/Los_Angeles', label: 'PST (UTC-8)' },
    { value: 'Europe/London', label: 'GMT (UTC+0)' },
    { value: 'Europe/Paris', label: 'CET (UTC+1)' },
]

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  // Step 0: Initial signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [unlockCode, setUnlockCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [validatedCode, setValidatedCode] = useState<ValidatedCode | null>(null);

  // Step 1: Track selection
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  // Step 2: Reminders
  const [enablePush, setEnablePush] = useState(false);
  const [enableEmail, setEnableEmail] = useState(false);
  const [morningTime, setMorningTime] = useState('07:00');
  const [eveningTime, setEveningTime] = useState('21:00');
  const [timezone, setTimezone] = useState('America/New_York');

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numbers = input.replace(/\D/g, '');
    let formatted = '';
    if (numbers.length > 0) {
        formatted = numbers.substring(0, 4);
    }
    if (numbers.length > 4) {
        formatted += '-' + numbers.substring(4, 8);
    }
    if (numbers.length > 8) {
        formatted += '-' + numbers.substring(8, 12);
    }
    setUnlockCode(formatted);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. Validate code
    try {
      const validationResult = await validateUnlockCode({ code: unlockCode });
      if (!validationResult.isValid) {
        toast({
          variant: "destructive",
          title: "Unlock Code Invalid",
          description: validationResult.error,
        });
        setIsLoading(false);
        return;
      }
      setValidatedCode(validationResult);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "There was an issue validating your code. Please try again or contact support@stoic-af.com.",
      });
      setIsLoading(false);
      return;
    }


    // 2. Create Firebase user
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setIsLoading(false);
      setStep(1); // Move to next step
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
      setIsLoading(false);
    }
  };
  
  const handleFinalize = async () => {
      if (!user || !selectedTrack || !validatedCode) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Something went wrong. Please try again.'
        })
        return;
      }

      setIsLoading(true);

      let pathsToUnlock: string[] | 'all' = [];
      if (validatedCode.accessType === 'userOne') {
          pathsToUnlock = [selectedTrack.id];
      } else {
          pathsToUnlock = validatedCode.paths || [selectedTrack.id];
      }


      try {
        await createUserAndClaimCode({
            uid: user.uid,
            selectedTrackId: selectedTrack.id,
            unlockedPaths: pathsToUnlock,
            reminders: {
                pushEnabled: enablePush,
                emailEnabled: enableEmail,
                morningTime,
                eveningTime,
                timezone,
            },
            unlockCode: unlockCode || null,
        });

        router.push('/');

      } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Setup Failed",
            description: "There was a problem saving your profile. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }

  }

  const handleSelectTrack = (track: Track) => {
    if (validatedCode?.accessType === 'adminOne' && validatedCode.paths !== 'all' && !validatedCode.paths.includes(track.id)) {
        return; // Don't allow selection if code is for a specific track
    }
    setSelectedTrack(track);
  }

  // Pre-select track if code dictates it
  if (step === 1 && validatedCode?.accessType === 'adminOne' && validatedCode.paths !== 'all' && validatedCode.paths.length === 1 && !selectedTrack) {
    const trackToSelect = allTracks.find(t => t.id === validatedCode.paths[0]);
    if (trackToSelect) {
        setSelectedTrack(trackToSelect);
    }
  }
  
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
            <Card className="w-full max-w-sm">
                <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline text-primary">Begin Your Journey</CardTitle>
                <CardDescription>Create an account to start the 30-day challenge.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="unlock-code">Unlock Code</Label>
                    <Input id="unlock-code" type="tel" placeholder="XXXX-XXXX-XXXX" value={unlockCode} onChange={handleCodeChange} maxLength={14} required />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading || unlockCode.replace(/-/g, '').length < 12}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Create Account & Continue"}
                    </Button>
                </CardFooter>
                </form>
            </Card>
        );
      case 1:
        const trackDescriptions: { [key: string]: string } = {
            "Ego": "Getting defensive, needing to be right, taking things personally",
            "Discipline": "Procrastination, inconsistency, lack of self-control",
            "Relationships": "Communication, boundaries, managing expectations",
            "Money": "Financial stress, career pressure, comparison with others",
        };
        const isLockedByCode = validatedCode?.accessType === 'adminOne' && validatedCode.paths !== 'all' && validatedCode.paths.length > 0;

        let availableTracks = allTracks;
        if (isLockedByCode && validatedCode.paths !== 'all') {
            availableTracks = allTracks.filter(t => validatedCode.paths.includes(t.id));
        }
        if (validatedCode?.accessType === 'userOne') {
            availableTracks = allTracks; // User gets to pick one from all
        }
        

        return (
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mb-2 text-sm font-semibold text-accent">Step 1 of 3</div>
                    <h1 className="text-2xl font-bold font-headline text-primary">What's Your Biggest Struggle?</h1>
                    <p className="text-muted-foreground mt-2">We'll customize your 30-day journey based on what you're dealing with most. Choose the one that hits hardest.</p>
                </div>
                {isLockedByCode && (
                    <div className="mb-4 p-3 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        <p className="text-sm">Your unlock code has pre-selected your track.</p>
                    </div>
                )}
                <div className="space-y-4">
                    {allTracks.map(track => {
                         const Icon = iconMap[track.icon];
                         const isSelectable = availableTracks.some(at => at.id === track.id);
                         const isSelected = selectedTrack?.id === track.id;

                         return (
                            <button
                                key={track.id}
                                onClick={() => isSelectable && handleSelectTrack(track)}
                                disabled={!isSelectable}
                                className={cn(
                                    "w-full text-left p-4 border rounded-lg flex items-center gap-4 transition-all",
                                    isSelected
                                        ? "border-accent ring-2 ring-accent bg-accent/10"
                                        : "bg-secondary/30",
                                    isSelectable ? "cursor-pointer hover:bg-secondary/60" : "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className="p-3 rounded-md" style={{ backgroundColor: isSelected ? track.color : `${track.color}20`}}>
                                    {Icon && <Icon className="h-6 w-6" style={{ color: isSelected ? 'white' : track.color}} />}
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-primary">{track.full_name}</h3>
                                    <p className="text-sm text-muted-foreground">{track.description}</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </button>
                         )
                    })}
                </div>
                <div className="flex justify-end mt-8">
                    <Button onClick={() => setStep(2)} disabled={!selectedTrack}>
                        Continue <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        );
      case 2:
        return (
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mb-2 text-sm font-semibold text-accent">Step 2 of 3</div>
                    <h1 className="text-2xl font-bold font-headline text-primary">Setup Daily Reminders</h1>
                    <p className="text-muted-foreground mt-2">Consistency is key. We'll help you stay on track. You can change this later.</p>
                </div>
                
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                           <div className="flex items-center gap-4">
                                <Bell className="h-6 w-6 text-accent"/>
                                <div>
                                    <Label htmlFor="push-notifications" className="font-semibold">Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Get alerts on your phone. (Coming soon)</p>
                                </div>
                           </div>
                           <Switch id="push-notifications" checked={enablePush} onCheckedChange={setEnablePush} />
                        </div>
                         <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                           <div className="flex items-center gap-4">
                                <Sparkles className="h-6 w-6 text-accent"/>
                                <div>
                                    <Label htmlFor="email-reminders" className="font-semibold">Email Reminders</Label>
                                    <p className="text-sm text-muted-foreground">Daily prompts in your inbox. (Coming soon)</p>
                                </div>
                           </div>
                           <Switch id="email-reminders" checked={enableEmail} onCheckedChange={setEnableEmail} />
                        </div>

                         <div className="space-y-2 pt-2">
                            <Label htmlFor="timezone">Your Timezone</Label>
                             <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select your timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timezones.map(tz => (
                                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-2">
                             <div className="space-y-2">
                                <Label htmlFor="morning-time">Morning Intention Time</Label>
                                <Input id="morning-time" type="time" value={morningTime} onChange={(e) => setMorningTime(e.target.value)} />
                             </div>
                              <div className="space-y-2">
                                <Label htmlFor="evening-time">Evening Reflection Time</Label>
                                <Input id="evening-time" type="time" value={eveningTime} onChange={(e) => setEveningTime(e.target.value)} />
                             </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-between mt-8">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                        <ArrowLeft className="mr-2" /> Back
                    </Button>
                    <Button onClick={() => setStep(3)}>
                        Continue <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        );
      case 3:
        const TrackIcon = selectedTrack ? iconMap[selectedTrack.icon] : null;
        return (
            <div className="w-full max-w-md text-center">
                 <div className="text-center mb-8">
                    <div className="mb-2 text-sm font-semibold text-accent">Step 3 of 3</div>
                    <h1 className="text-2xl font-bold font-headline text-primary">Confirm Your Path</h1>
                    <p className="text-muted-foreground mt-2">Your 30-day journey is ready. Let's begin.</p>
                </div>

                <Card className="text-left">
                    <CardHeader>
                        <CardTitle>Your Chosen Track</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {selectedTrack && TrackIcon && (
                            <div className="p-4 border rounded-lg flex items-center gap-4 bg-secondary/30">
                                <div className="p-3 rounded-md" style={{ backgroundColor: selectedTrack.color }}>
                                    <TrackIcon className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-primary">{selectedTrack.full_name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedTrack.description}</p>
                                </div>
                            </div>
                         )}
                         <div className="mt-4 space-y-1">
                            <h4 className="font-semibold mb-2">Reminder Settings</h4>
                            <p className="text-sm text-muted-foreground">Morning Intention: {morningTime}</p>
                            <p className="text-sm text-muted-foreground">Evening Reflection: {eveningTime}</p>
                             <p className="text-sm text-muted-foreground">Timezone: {timezones.find(tz => tz.value === timezone)?.label}</p>
                            <p className="text-sm text-muted-foreground pt-2">You can change these later in your profile.</p>
                         </div>
                    </CardContent>
                </Card>

                <div className="flex justify-between mt-8">
                    <Button variant="ghost" onClick={() => setStep(2)}>
                        <ArrowLeft className="mr-2" /> Back
                    </Button>
                    <Button size="lg" onClick={handleFinalize} disabled={isLoading}>
                         {isLoading ? <Loader2 className="animate-spin" /> : "Start Challenge"}
                         {!isLoading && <Check className="ml-2" />}
                    </Button>
                </div>
            </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      {renderStep()}
    </div>
  );
}
