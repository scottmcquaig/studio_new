
'use client';

import BottomNav from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { tracks as allTracks } from "@/lib/tracks.json";
import { Edit, Archive, PlusCircle, FolderPlus, DollarSign, Heart, Target, Brain, KeyRound, Check, Loader2, Copy, Send, Settings, History, Repeat } from "lucide-react";
import { useMemo, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { generateUnlockCode } from "@/ai/flows/generate-unlock-code";
import { Toaster } from "@/components/ui/toaster";
import type { GenerateUnlockCodeInput } from "@/lib/types";
import Link from "next/link";
import { BookCopy } from "lucide-react";


// Helper to get the correct icon component
const iconMap: { [key: string]: React.ComponentType<any> } = {
  "dollar-sign": DollarSign,
  "heart": Heart,
  "target": Target,
  "brain": Brain,
};

type Track = typeof allTracks[0];

export default function BackstagePage() {
    const { toast } = useToast();
    const [tracks, setTracks] = useState<Track[]>(allTracks);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    // State for Generate Code Dialog
    const [isGenerateCodeOpen, setIsGenerateCodeOpen] = useState(false);
    const [accessType, setAccessType] = useState<GenerateUnlockCodeInput['accessType']>("userOne");
    const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
    const [isMultiUse, setIsMultiUse] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);


    const tracksByCategory = useMemo(() => {
        return tracks.reduce((acc, track) => {
            const category = track.category || "Uncategorized";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(track);
            return acc;
        }, {} as Record<string, typeof allTracks>);
    }, [tracks]);
    
    const handleSettingsClick = (track: Track) => {
        setSelectedTrack(track);
        setIsSheetOpen(true);
    };

    const handleUpdateTrack = async () => {
        if (!selectedTrack) return;
        
        const updatedTracks = tracks.map(t => t.id === selectedTrack.id ? selectedTrack : t);

        try {
            const response = await fetch('/api/tracks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tracks: updatedTracks }),
            });

            if (!response.ok) {
                throw new Error('Failed to update tracks');
            }

            setTracks(updatedTracks);
            setIsSheetOpen(false);
            setSelectedTrack(null);
            
            // Reload the page to reflect changes and avoid HMR issues
            window.location.reload();
            
        } catch (error) {
            console.error("Error updating track:", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem updating the track.",
            });
        }
    };

    const handleFieldChange = (field: keyof Track, value: string | number) => {
        if (selectedTrack) {
            setSelectedTrack({ ...selectedTrack, [field]: value });
        }
    };

     const handleGenerateCode = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsGenerating(true);
        setGeneratedCode(null);
        
        let paths: string[] | 'all' = 'all';
        if (accessType === 'adminOne' || accessType === 'adminMulti') {
            paths = selectedPaths;
        }

        try {
            const result = await generateUnlockCode({ accessType, paths, isMultiUse });
            setGeneratedCode(result.code);
        } catch (error) {
            console.error("Error generating code:", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem generating the code. Please try again.",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePathSelection = (trackId: string) => {
        if (accessType === 'adminOne') {
            setSelectedPaths([trackId]);
        } else if (accessType === 'adminMulti') {
            setSelectedPaths(prev => 
                prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
            );
        }
    };

    const handleCopyToClipboard = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const resetGenerateCodeDialog = () => {
        setAccessType('userOne');
        setSelectedPaths([]);
        setGeneratedCode(null);
        setIsGenerating(false);
        setIsMultiUse(false);
    }

    const accessOptions = [
        { id: 'userOne', label: 'Single Path: User Selects'},
        { id: 'adminOne', label: 'Single Path: Admin Selects'},
        { id: 'adminMulti', label: 'Multiple Paths: Admin Selects'},
        { id: 'allCurrent', label: 'All Current Paths'},
        { id: 'allEvergreen', label: 'All Paths (Evergreen)'},
    ];


    return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="py-4 bg-card border-b">
        <div className="container mx-auto px-4 max-w-5xl flex justify-between items-center">
          <h1 className="text-xl font-bold font-headline text-primary">Backstage Admin</h1>
          <div className="flex gap-2">
            <Dialog open={isGenerateCodeOpen} onOpenChange={(isOpen) => { setIsGenerateCodeOpen(isOpen); if (!isOpen) { resetGenerateCodeDialog() }}}>
              <DialogTrigger asChild>
                <Button variant="outline">
                    <KeyRound className="mr-2" />
                    Generate Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                  <DialogTitle>{generatedCode ? "Code Generated" : "Generate Unlock Code"}</DialogTitle>
                   <DialogDescription>
                    {generatedCode ? "Share this code with the user." : "Create a one-time code for a user to unlock challenge paths."}
                  </DialogDescription>
                </DialogHeader>

                {generatedCode ? (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                            <Input value={generatedCode} readOnly className="font-mono text-lg flex-grow"/>
                             <Button onClick={handleCopyToClipboard} variant="outline" size="icon">
                                {isCopied ? <Check className="text-green-500" /> : <Copy />}
                            </Button>
                        </div>
                        <div className="text-center text-sm text-green-500 h-4">
                            {isCopied && "Copied to clipboard!"}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="send-email">Send code to user (placeholder)</Label>
                             <div className="flex items-center space-x-2">
                                <Input id="send-email" type="email" placeholder="user@example.com" />
                                <Button variant="secondary">
                                    <Send className="mr-2"/>
                                    Send
                                </Button>
                            </div>
                        </div>

                         <DialogFooter className="pt-4">
                            <Button type="button" onClick={resetGenerateCodeDialog}>Generate Another Code</Button>
                        </DialogFooter>
                    </div>

                ) : (
                    <form onSubmit={handleGenerateCode}>
                        <div className="grid gap-4 py-4">
                            <RadioGroup value={accessType} onValueChange={(value) => {setAccessType(value as GenerateUnlockCodeInput['accessType']); setSelectedPaths([])}} className="grid grid-cols-1 gap-2 p-2 border rounded-md">
                                <Label className="font-semibold mb-2">Access Level</Label>
                                {accessOptions.map(opt => (
                                    <div key={opt.id} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt.id} id={opt.id} />
                                        <Label htmlFor={opt.id}>{opt.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            
                            {(accessType === 'adminOne' || accessType === 'adminMulti') && (
                                <div className="grid grid-cols-1 gap-2 p-2 border rounded-md max-h-48 overflow-y-auto">
                                    <Label className="font-semibold mb-2">Select Paths</Label>
                                    {allTracks.map(track => (
                                        <div key={track.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={track.id}
                                                checked={selectedPaths.includes(track.id)}
                                                onCheckedChange={() => handlePathSelection(track.id)}
                                            />
                                            <Label htmlFor={track.id}>{track.full_name}</Label>
                                        </div>
                                    ))}
                                </div>
                            )}

                             <div className="flex items-center space-x-2 p-2 border rounded-md">
                                <Checkbox id="multi-use" checked={isMultiUse} onCheckedChange={(checked) => setIsMultiUse(Boolean(checked))} />
                                <Label htmlFor="multi-use">Allow multiple uses</Label>
                            </div>

                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsGenerateCodeOpen(false)} disabled={isGenerating}>Cancel</Button>
                            <Button type="submit" disabled={isGenerating}>
                                {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Check className="mr-2" />}
                                {isGenerating ? 'Generating...' : 'Generate Code'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
              </DialogContent>
            </Dialog>
            <Button variant="outline">
                <FolderPlus className="mr-2" />
                Add Category
            </Button>
            <Button>
                <PlusCircle className="mr-2" />
                Add Track
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-8">
            {Object.entries(tracksByCategory).map(([category, categoryTracks]) => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl text-primary">{category}</CardTitle>
                        <CardDescription>Manage tracks within this category.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {categoryTracks.map(track => {
                            const Icon = iconMap[track.icon];
                            return (
                                <div key={track.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                                    <div className="flex items-center gap-4">
                                        {Icon && <Icon style={{ color: track.color }} className="h-8 w-8" />}
                                        <div>
                                            <h3 className="font-semibold text-primary">{track.full_name}</h3>
                                            <p className="text-sm text-muted-foreground">{track.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/backstage/tracks/${track.slug}`}>
                                                <BookCopy className="h-5 w-5" />
                                                <span className="sr-only">Edit Days</span>
                                            </Link>
                                        </Button>
                                         <Button variant="ghost" size="icon" onClick={() => handleSettingsClick(track)}>
                                            <Settings className="h-5 w-5" />
                                            <span className="sr-only">Track Settings</span>
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            <Archive className="h-5 w-5" />
                                            <span className="sr-only">Archive Track</span>
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            ))}
            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <History className="h-6 w-6 text-accent"/>
                            <CardTitle>Transaction History</CardTitle>
                        </div>
                        <CardDescription>A log of all access code redemptions and purchases.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Transaction history will be displayed here.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Repeat className="h-6 w-6 text-accent"/>
                            <CardTitle>Multi-use Codes</CardTitle>
                        </div>
                        <CardDescription>Codes that can be redeemed multiple times.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Active multi-use codes will be listed here.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
                <SheetTitle>Edit Track Settings</SheetTitle>
                <SheetDescription>
                    Make changes to the track metadata here. Click save when you're done.
                </SheetDescription>
            </SheetHeader>
            {selectedTrack && (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="full_name" className="text-right">Full Name</Label>
                        <Input id="full_name" value={selectedTrack.full_name} onChange={(e) => handleFieldChange('full_name', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Textarea id="description" value={selectedTrack.description} onChange={(e) => handleFieldChange('description', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="display_name" className="text-right">Display Name</Label>
                        <Input id="display_name" value={selectedTrack.display_name} onChange={(e) => handleFieldChange('display_name', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Category</Label>
                        <Input id="category" value={selectedTrack.category} onChange={(e) => handleFieldChange('category', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="slug" className="text-right">Slug</Label>
                        <Input id="slug" value={selectedTrack.slug} onChange={(e) => handleFieldChange('slug', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="color" className="text-right">Color</Label>
                        <Input id="color" value={selectedTrack.color} onChange={(e) => handleFieldChange('color', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="icon" className="text-right">Icon</Label>
                        <Input id="icon" value={selectedTrack.icon} onChange={(e) => handleFieldChange('icon', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="numberOfDays" className="text-right">Days</Label>
                        <Input id="numberOfDays" type="number" value={selectedTrack.numberOfDays} onChange={(e) => handleFieldChange('numberOfDays', parseInt(e.target.value, 10))} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="order" className="text-right">Order</Label>
                        <Input id="order" type="number" value={selectedTrack.order} onChange={(e) => handleFieldChange('order', parseInt(e.target.value, 10))} className="col-span-3" />
                    </div>
                </div>
            )}
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </SheetClose>
                <Button type="submit" onClick={handleUpdateTrack}>Update Track</Button>
            </SheetFooter>
        </SheetContent>
      </Sheet>

      <BottomNav activeTab="User" />
      <Toaster />
    </div>
  );
}
