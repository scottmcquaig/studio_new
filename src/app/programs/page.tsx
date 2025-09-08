
'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, DollarSign, Brain, Target, Lock, ArrowRight, Check, Loader2, AlertTriangle, Info, Pause, Trash2, Star, CheckCircle } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import Link from "next/link";
import { tracks as allTracks } from "@/lib/tracks.json";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getUserProfile } from "@/ai/flows/get-user-profile";
import { validateUnlockCode } from "@/ai/flows/validate-unlock-code";
import type { ValidatedCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { unlockAndAddPaths } from "@/ai/flows/unlock-and-add-paths";
import { switchActivePath } from "@/ai/flows/switch-active-path";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Track = typeof allTracks[0];

const iconMap: { [key: string]: React.ComponentType<any> } = {
  "dollar-sign": DollarSign,
  "heart": Heart,
  "target": Target,
  "brain": Brain,
};

interface UserProfile {
    activePath: string | null;
    unlockedPaths: string[] | 'all';
}

export default function ProgramsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    
    const [unlockCode, setUnlockCode] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    
    const [validatedCode, setValidatedCode] = useState<ValidatedCode | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUnlockPromptOpen, setIsUnlockPromptOpen] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

    const activeTrack = userProfile?.activePath ? allTracks.find(t => t.id === userProfile.activePath) : null;
    
    const fetchProfile = async () => {
        if (user) {
            try {
                setLoadingProfile(true);
                const profile = await getUserProfile({ uid: user.uid });
                setUserProfile(profile);
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load your profile. Please try again."
                });
            } finally {
                setLoadingProfile(false);
            }
        }
    };

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

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

    const handleValidateCode = async () => {
        if (unlockCode.replace(/-/g, '').length < 12) return;
        setIsValidating(true);
        try {
            const result = await validateUnlockCode({ code: unlockCode });
            if (!result.isValid) {
                toast({
                    variant: "destructive",
                    title: "Invalid Code",
                    description: result.error,
                });
                setIsValidating(false);
                return;
            }
            
            // Filter out paths the user already has
            let availablePaths: string[] | 'all' = [];
            if (result.paths === 'all') {
                const unlockedIds = userProfile?.unlockedPaths === 'all' ? allTracks.map(t=>t.id) : (userProfile?.unlockedPaths || []);
                availablePaths = allTracks.filter(t => !unlockedIds.includes(t.id)).map(t => t.id);
            } else if (Array.isArray(result.paths) && Array.isArray(userProfile?.unlockedPaths)) {
                 availablePaths = result.paths.filter(p => !userProfile.unlockedPaths.includes(p));
            } else if (result.paths) {
                 availablePaths = result.paths;
            }
            
            if (availablePaths.length === 0) {
                 toast({
                    title: "No New Paths",
                    description: "This code is valid, but it doesn't grant access to any paths you don't already have.",
                });
                setIsValidating(false);
                return;
            }

            const updatedResult = {...result, paths: availablePaths};

            setValidatedCode(updatedResult);

            if (updatedResult.accessType === 'adminOne' && Array.isArray(updatedResult.paths) && updatedResult.paths.length === 1) {
                const trackToSelect = allTracks.find(t => t.id === updatedResult.paths![0]);
                setSelectedTrack(trackToSelect || null);
            }
            
            setIsUnlockPromptOpen(false); // Close the individual unlock prompt
            setIsModalOpen(true); // Open the main selection/confirmation modal

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "An unexpected error occurred. Please try again."
            })
        } finally {
            setIsValidating(false);
        }
    };

    const handleUnlock = async () => {
        if (!user || !validatedCode || (!selectedTrack && validatedCode.accessType === 'userOne')) {
            toast({ variant: "destructive", title: "Missing Information" });
            return;
        }

        setIsUnlocking(true);
        try {
            let pathsToAdd: string[] | 'all' = [];
            if (validatedCode.accessType === 'userOne' && selectedTrack) {
                pathsToAdd = [selectedTrack.id];
            } else if (validatedCode.paths) {
                pathsToAdd = validatedCode.paths;
            }
            
            if (pathsToAdd.length === 0) {
                toast({ variant: "destructive", title: "No paths to unlock" });
                setIsUnlocking(false);
                return;
            }
            
            await unlockAndAddPaths({
                uid: user.uid,
                pathsToAdd,
                unlockCode: unlockCode,
            });

            toast({
                title: "Success!",
                description: "New challenge path(s) have been added to your account.",
            });
            
            // Refresh profile and close modal
            await fetchProfile();
            handleCloseModal();
            setUnlockCode("");

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Unlock Failed",
                description: "There was a problem unlocking the new path."
            })
        } finally {
            setIsUnlocking(false);
        }
    }

    const handleSwitchTrack = async (trackId: string) => {
        if (!user) return;

        try {
            await switchActivePath({ uid: user.uid, newTrackId: trackId });
            await fetchProfile();
            toast({
                title: "Challenge Switched!",
                description: "Your active challenge has been updated."
            });
            window.location.href = '/'; // Redirect to dashboard
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Switch Failed",
                description: "Could not switch your active challenge. Please try again."
            })
        }
    }

    const handleSelectTrack = (track: Track) => {
        if (!validatedCode) return;
        if (validatedCode.accessType === 'adminOne' && validatedCode.paths !== 'all' && !validatedCode.paths.includes(track.id)) {
            return; // Don't allow selection if code is for a specific track
        }
        setSelectedTrack(track);
    }
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setValidatedCode(null);
        setSelectedTrack(null);
    }
    
    const handleUnlockClick = (track: Track | null) => { // Allow null for "Unlock All"
        setSelectedTrack(track);
        setUnlockCode("");
        setIsUnlockPromptOpen(true);
    };


    const handleAbandonChallenge = async () => {
        // This is now a placeholder, the prompt will guide the user to another challenge.
        toast({ title: "Challenge Abandoned (Archived)", description: "Your progress has been archived."});
        // We'd need a flow to set activePath to null, and maybe archive the old path data
        // await abandonChallengeFlow({ uid: user.uid });
        // await fetchProfile();
        setUserProfile(prev => prev ? { ...prev, activePath: null } : null); // Optimistic update
    }

    const handleDeleteChallenge = async () => {
        // Placeholder for future Genkit flow
        toast({ variant: "destructive", title: "Challenge Data Deleted", description: "All data for this challenge has been permanently removed."});
        // await deleteChallengeFlow({ uid: user.uid });
        // await fetchProfile();
    }

    const renderButton = (track: Track) => {
        if (!userProfile) return <Button disabled>Unlock Path</Button>;

        const isUnlocked = userProfile.unlockedPaths === 'all' || (Array.isArray(userProfile.unlockedPaths) && userProfile.unlockedPaths.includes(track.id));
        const isActive = userProfile.activePath === track.id;

        if (isActive) {
            return <Button variant="secondary" className="w-full bg-green-200 text-green-800 hover:bg-green-300" disabled>Challenge In-Progress</Button>
        }
        if (isUnlocked) {
             if (userProfile.activePath) {
                return (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="secondary" className="w-full">Switch to this Challenge</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to switch challenges?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Your progress on the current challenge will be saved. You can always switch back later. A new challenge path will begin for this track.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleSwitchTrack(track.id)}>Switch Challenge</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
             } else {
                return <Button variant="secondary" onClick={() => handleSwitchTrack(track.id)} className="w-full">Start Challenge</Button>
             }
        }
        return (
            <Button variant="default" className="w-full bg-accent hover:bg-accent/90 gap-1" onClick={() => handleUnlockClick(track)}>
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-white/20 font-headline text-sm font-bold">
                    $4
                </div>
                Unlock Path
            </Button>
        );
    }

    if (authLoading || loadingProfile) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    let availableTracksForModal: Track[] = [];
    if (validatedCode) {
        if (validatedCode.paths === 'all') {
            availableTracksForModal = allTracks.filter(t => {
                 if (userProfile?.unlockedPaths === 'all') return false;
                 if (Array.isArray(userProfile?.unlockedPaths)) return !userProfile.unlockedPaths.includes(t.id);
                 return true;
            });
        } else if (validatedCode.paths) {
            availableTracksForModal = allTracks.filter(t => validatedCode.paths!.includes(t.id));
        }
    }
    
    let lockedPathsCount = 0;
    if (userProfile) {
        if (userProfile.unlockedPaths !== 'all') {
            lockedPathsCount = allTracks.length - userProfile.unlockedPaths.length;
        }
    }

    let bundlePrice = 0;
    const retailPrice = 16.00;

    if (lockedPathsCount > 0) {
        switch (lockedPathsCount) {
            case 4: // 0 unlocked
                bundlePrice = 10;
                break;
            case 3: // 1 unlocked
                bundlePrice = 9;
                break;
            case 2: // 2 unlocked
                bundlePrice = 5;
                break;
            case 1: // 3 unlocked
                bundlePrice = 2;
                break;
            default:
                bundlePrice = 0;
        }
    }
    

    const isLockedByCode = validatedCode?.accessType === 'adminOne' && Array.isArray(validatedCode.paths) && validatedCode.paths.length === 1;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="py-4 bg-card border-b">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-xl font-bold font-headline text-primary">Stoic AF Challenges</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-8">
            {activeTrack && (
                 <Card className="border-accent ring-2 ring-accent">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                             <CardTitle className="font-headline text-2xl text-primary">Your Active Challenge</CardTitle>
                             <Badge style={{ backgroundColor: activeTrack.color, color: 'white' }} className="border-none">
                                {activeTrack.display_name}
                            </Badge>
                        </div>
                        <CardDescription>
                            You are currently on the {activeTrack.full_name} path. Focus and continue your journey.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center">
                        <Button asChild className="flex-grow">
                            <Link href="/">View Dashboard <ArrowRight className="ml-2"/></Link>
                        </Button>
                        <div className="flex items-center ml-4">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Pause Challenge">
                                        <Pause className="h-5 w-5 text-accent"/>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure you want to switch challenges?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Your progress on the current challenge will be saved. You can always switch back later. A new challenge path will begin for this track.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleAbandonChallenge} className="bg-accent hover:bg-accent/90">Switch Challenge</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Delete Data">
                                        <Trash2 className="h-5 w-5 text-destructive"/>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete all your entries and progress for the active challenge. Are you sure you want to proceed?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteChallenge} className="bg-destructive hover:bg-destructive/90">Delete Data</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardFooter>
                </Card>
            )}

            <Card className="bg-secondary/30">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary">Unlock a New Path</CardTitle>
                    <CardDescription>
                        Already have a code from a book or purchase? Enter it here to unlock your chosen track.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Input 
                        type="tel"
                        placeholder="XXXX-XXXX-XXXX" 
                        className="flex-grow"
                        value={unlockCode}
                        onChange={handleCodeChange}
                        maxLength={14}
                        disabled={isValidating}
                    />
                    <Button onClick={handleValidateCode} disabled={isValidating || unlockCode.replace(/-/g, '').length < 12}>
                        {isValidating ? <Loader2 className="mr-2 animate-spin" /> : <Lock className="mr-2" />}
                        Unlock
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allTracks.map((track) => {
                    const Icon = iconMap[track.icon];
                    return (
                        <Card key={track.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    {Icon && <Icon className={`h-10 w-10`} style={{ color: track.color }} />}
                                    <CardTitle className="font-headline text-xl text-primary">{track.full_name}</CardTitle>
                                </div>
                                <CardDescription className="pt-2">{track.description}</CardDescription>
                            </CardHeader>
                            <CardFooter className="mt-auto">
                               {renderButton(track)}
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline text-2xl text-primary">Bundle & Save</CardTitle>
                        <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80 gap-1">
                            <Star className="h-3 w-3"/>
                            Best Value
                        </Badge>
                    </div>
                     <CardDescription>
                        Get access to all 30-day Stoic Challenges for a discounted price.
                    </CardDescription>
                </CardHeader>
                 <CardFooter className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-grow text-center sm:text-left">
                       {lockedPathsCount > 0 ? (
                            <p>
                                <span className="font-bold">One-time purchase:</span>{' '}
                                <span className="line-through text-muted-foreground">${retailPrice.toFixed(2)}</span>{' '}
                                <span className="font-bold text-accent">${bundlePrice.toFixed(2)}</span>
                            </p>
                        ) : (
                            <p className="font-semibold text-primary">You have unlocked all paths!</p>
                        )}
                    </div>
                    <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90" onClick={() => handleUnlockClick(null)} disabled={lockedPathsCount === 0}>
                        Unlock All
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </main>

      <Dialog open={isUnlockPromptOpen} onOpenChange={setIsUnlockPromptOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Unlock: {selectedTrack?.full_name || 'Challenge Paths'}</DialogTitle>
                 <DialogDescription>
                    Enter your one-time access code to unlock this challenge path.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="code">Access Code</Label>
                    <Input 
                        id="code" 
                        type="tel"
                        value={unlockCode}
                        onChange={handleCodeChange}
                        placeholder="XXXX-XXXX-XXXX"
                        maxLength={14}
                        disabled={isValidating}
                    />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                    Need an access code?{' '}
                    <button 
                        onClick={() => toast({ title: "Online payment is currently down.", description: "Please email support@stoic-af.com to purchase."})}
                        className="underline font-medium text-accent hover:text-accent/80"
                    >
                        Purchase one here.
                    </button>
                </p>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsUnlockPromptOpen(false)} disabled={isValidating}>Cancel</Button>
                <Button onClick={handleValidateCode} disabled={isValidating || unlockCode.replace(/-/g, '').length < 12}>
                     {isValidating ? <Loader2 className="mr-2 animate-spin" /> : <Lock className="mr-2" />}
                    Submit Code
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if(!isOpen) handleCloseModal() }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Unlock Your Path</DialogTitle>
                <DialogDescription>
                    Your code is valid. Please select the challenge path you wish to unlock.
                </DialogDescription>
            </DialogHeader>
            
            {validatedCode?.accessType === 'userOne' && (
                <div className="space-y-2 py-4">
                    <p className="font-semibold text-sm">Please choose one path to unlock:</p>
                    {availableTracksForModal.map(track => {
                        const isSelected = selectedTrack?.id === track.id;
                        return (
                            <button
                                key={track.id}
                                onClick={() => setSelectedTrack(track)}
                                className={cn(
                                    "w-full text-left p-3 border rounded-lg flex items-center gap-4 transition-all",
                                    isSelected ? "border-accent ring-2 ring-accent bg-accent/10" : "bg-secondary/30 hover:bg-secondary/60"
                                )}
                            >
                                <span className="flex-grow font-medium">{track.full_name}</span>
                                {isSelected && <Check className="text-accent"/>}
                            </button>
                        )
                    })}
                </div>
            )}

            {(validatedCode?.accessType === 'adminOne' || validatedCode?.accessType === 'adminMulti' || validatedCode?.accessType === 'allCurrent' || validatedCode?.accessType === 'allEvergreen') && (
                 <div className="space-y-2 py-4">
                    <div className="p-3 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        <p className="text-sm font-semibold">This code will unlock the following path(s):</p>
                    </div>
                     <ul className="list-disc pl-5 space-y-1 pt-2">
                        {availableTracksForModal.map(track => <li key={track.id}>{track.full_name}</li>)}
                    </ul>
                </div>
            )}

            <DialogFooter>
                <Button variant="outline" onClick={handleCloseModal} disabled={isUnlocking}>Cancel</Button>
                <Button onClick={handleUnlock} disabled={isUnlocking || (validatedCode?.accessType === 'userOne' && !selectedTrack)}>
                    {isUnlocking ? <Loader2 className="mr-2 animate-spin" /> : <Check className="mr-2" />}
                    {isUnlocking ? 'Unlocking...' : 'Unlock Challenge'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <BottomNav activeTab="Challenges" />
    </div>
  );
}

    