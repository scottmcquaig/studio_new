
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Plus, PlusCircle, Square, CheckSquare, Palette, Wand2, ArrowRight, Save, Pilcrow, CaseUpper, CaseLower, ChevronsUpDown, AlertTriangle, ArrowLeft, Shield } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { AppHeader } from '@/components/app-header';
import { getFirestore, collection, onSnapshot, query, doc, Unsubscribe, where, writeBatch, runTransaction, getDocs, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { app as clientApp } from '@/lib/firebase';
import { adminApp } from '@/lib/firebase-admin';
import withAuth from '@/components/withAuth';
import { PageLayout } from '@/components/page-layout';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { League, Season, Contestant, ScoringRuleSet, ScoringRule, Competition, SeasonWeeklyStatusDisplay, EventAction, UserRole } from '@/lib/data';
import { cn, getContestantDisplayName } from '@/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';


// =================================================================================
// SERVER ACTIONS
// =================================================================================

const db_server = getFirestore(clientApp);
const adminAuth = getAuth(adminApp);

interface InviteUserInput {
    email: string;
    role: string;
}

export async function inviteUser(input: InviteUserInput) {
    'use server';
    const { email, role } = input;

    // 1. Check if user already exists in Firestore
    const usersRef = collection(db_server, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error('User with this email already exists.');
    }
    
    try {
        // 2. Add user to Firestore with 'pending' status
        const newUserDoc = {
            email,
            role,
            status: 'pending',
            displayName: email.split('@')[0], // a temporary display name
            createdAt: new Date().toISOString(),
        };
        await addDoc(usersRef, newUserDoc);
        
        // 3. Generate a password reset link (which serves as an invite link)
        const link = await adminAuth.generatePasswordResetLink(email);
        
        // 4. (TODO) Send an email with this link.
        console.log(`Generated invite link for ${email}: ${link}`);
        console.log(`This link should be sent to the user's email address.`);

        return { success: true, message: `Invitation process started for ${email}.` };

    } catch (error: any) {
        console.error("Error inviting user:", error);
        throw new Error(`Failed to invite user: ${error.message}`);
    }
}


// =================================================================================
// ADMIN PANEL COMPONENTS
// =================================================================================


const iconSelection = Object.keys(LucideIcons).filter(key => /^[A-Z]/.test(key) && !key.includes('Icon'));

const colorSelection = [
    { name: 'Gray', value: 'text-gray-500' },
    { name: 'Red', value: 'text-red-500' },
    { name: 'Orange', value: 'text-orange-500' },
    { name: 'Amber', value: 'text-amber-500' },
    { name: 'Yellow', value: 'text-yellow-500' },
    { name: 'Lime', value: 'text-lime-500' },
    { name: 'Green', value: 'text-green-500' },
    { name: 'Emerald', value: 'text-emerald-500' },
    { name: 'Teal', value: 'text-teal-500' },
    { name: 'Cyan', value: 'text-cyan-500' },
    { name: 'Sky', value: 'text-sky-500' },
    { name: 'Blue', value: 'text-blue-500' },
    { name: 'Indigo', value: 'text-indigo-500' },
    { name: 'Violet', value: 'text-violet-500' },
    { name: 'Purple', value: 'text-purple-500' },
    { name: 'Fuchsia', value: 'text-fuchsia-500' },
    { name: 'Pink', value: 'text-pink-500' },
    { name: 'Rose', value: 'text-rose-500' },
];

const eventActionOptions: { value: EventAction, label: string }[] = [
    { value: 'setWinner', label: 'Set Winner' },
    { value: 'setEvictee', label: 'Set Evictee' },
    { value: 'setNominees', label: 'Set Nominees' },
    { value: 'setSavedByVeto', label: `Set 'Saved' Player` },
    { value: 'setReplacementNom', label: 'Set Replacement Nom' },
];

interface EventEditorCardProps {
    card: SeasonWeeklyStatusDisplay;
    onUpdate: (card: SeasonWeeklyStatusDisplay) => void;
    onDelete: () => void;
    scoringRules: ScoringRule[];
    isFollowUp?: boolean;
    path: string; // e.g. "0" for root, "0.followUp" for nested
}

function EventEditorCard({ card, onUpdate, onDelete, scoringRules, isFollowUp = false, path }: EventEditorCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: path });
    
    const [localCard, setLocalCard] = useState(card);

    useEffect(() => {
        setLocalCard(card);
    }, [card]);

    const handleFieldChange = (field: keyof SeasonWeeklyStatusDisplay, value: any) => {
        const newCard = { ...localCard, [field]: value };
        setLocalCard(newCard);
    };
    
    const handleBlur = () => {
        onUpdate(localCard);
    };

    const handleFollowUpToggle = (checked: boolean) => {
        const newCard = { ...localCard, hasFollowUp: checked };
        if (checked && !newCard.followUp) {
            newCard.followUp = {
                _id: `followup-${Date.now()}`, ruleCode: '', title: 'Follow-up Event',
                icon: 'Star', order: 1, color: 'text-gray-500', action: 'setWinner',
            };
        } else if (!checked) {
            delete newCard.followUp;
        }
        setLocalCard(newCard);
        onUpdate(newCard);
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const IconComponent = (LucideIcons as any)[localCard.icon] || Square;
    const isMultiPick = localCard.action === 'setNominees';

    return (
        <Card ref={setNodeRef} style={style} className={cn("relative", isFollowUp ? "ml-8 my-2 border-dashed" : "mb-4")}>
            <div className="absolute top-2 right-2 flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
                {!isFollowUp && <div {...listeners} {...attributes} className="cursor-grab"><GripVertical className="h-5 w-5 text-muted-foreground" /></div>}
            </div>
            <CardHeader>
                <div className="flex items-center gap-2">
                     <Select value={localCard.ruleCode} onValueChange={(value) => {
                         const updatedCard = { ...localCard, ruleCode: value };
                         setLocalCard(updatedCard);
                         onUpdate(updatedCard);
                     }}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select scoring event..." />
                        </SelectTrigger>
                        <SelectContent>
                            {scoringRules.map(rule => (
                                <SelectItem key={rule.code} value={rule.code}>{rule.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                    {/* Display settings */}
                    <div className="space-y-2">
                        <Label>Display Title</Label>
                        <Input 
                            value={localCard.title} 
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            onBlur={handleBlur}
                            className="w-48"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>Action</Label>
                        <Select value={localCard.action} onValueChange={(value) => {
                            const updatedCard = { ...localCard, action: value as EventAction };
                            setLocalCard(updatedCard);
                            onUpdate(updatedCard);
                        }}>
                           <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                           <SelectContent>
                               {eventActionOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                           </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <Select value={localCard.icon} onValueChange={(value) => {
                            const updatedCard = { ...localCard, icon: value };
                            setLocalCard(updatedCard);
                            onUpdate(updatedCard);
                        }}>
                            <SelectTrigger className="w-32">
                                <SelectValue><div className="flex items-center gap-2"><IconComponent className="h-4 w-4" /> {localCard.icon}</div></SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                                {iconSelection.map(icon => {
                                    const Ico = (LucideIcons as any)[icon];
                                    return <SelectItem key={icon} value={icon}><div className="flex items-center gap-2"><Ico className="h-4 w-4" /> {icon}</div></SelectItem>
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Color</Label>
                        <Select value={localCard.color} onValueChange={(value) => {
                            const updatedCard = { ...localCard, color: value };
                            setLocalCard(updatedCard);
                            onUpdate(updatedCard);
                        }}>
                            <SelectTrigger className="w-32">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-3 h-3 rounded-full", localCard.color.replace('text-','bg-'))}></div>
                                        {colorSelection.find(c=>c.value===localCard.color)?.name}
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {colorSelection.map(color => (
                                    <SelectItem key={color.value} value={color.value}>
                                         <div className="flex items-center gap-2">
                                            <div className={cn("w-3 h-3 rounded-full", color.value.replace('text-','bg-'))}></div>
                                            {color.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Alternative Outcome Text</Label>
                        <Input
                          value={localCard.alternativeOutcomeText || ''}
                          onChange={(e) => handleFieldChange('alternativeOutcomeText', e.target.value)}
                          onBlur={handleBlur}
                          placeholder="e.g., Not Used"
                          className="w-48"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id={`follow-up-${localCard._id}`}
                        checked={localCard.hasFollowUp}
                        onCheckedChange={handleFollowUpToggle}
                    />
                    <Label htmlFor={`follow-up-${localCard._id}`}>Has Follow-up Event?</Label>
                </div>

                {localCard.hasFollowUp && localCard.followUp && (
                     <div className="pl-6 border-l-2 border-dashed">
                        <EventEditorCard
                            card={localCard.followUp}
                            onUpdate={(updatedFollowUp) => {
                                const newCard = { ...localCard, followUp: updatedFollowUp };
                                setLocalCard(newCard);
                                onUpdate(newCard);
                            }}
                            onDelete={() => handleFollowUpToggle(false)}
                            scoringRules={scoringRules}
                            isFollowUp={true}
                            path={`${path}.followUp`}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AdminPage() {
    const { appUser } = useAuth();
    const db = getFirestore(clientApp);
    const { toast } = useToast();

    const [activeLeague, setActiveLeague] = useState<League | null>(null);
    const [activeSeason, setActiveSeason] = useState<Season | null>(null);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [contestants, setContestants] = useState<Contestant[]>([]);
    const [scoringRuleSets, setScoringRuleSets] = useState<ScoringRuleSet[]>([]);
    const [selectedScoringRuleSetId, setSelectedScoringRuleSetId] = useState<string>('');
    const [activeScoringRules, setActiveScoringRules] = useState<ScoringRule[]>([]);
    const [competitions, setCompetitions] = useState<Competition[]>([]);

    const [weeklyStatusDisplay, setWeeklyStatusDisplay] = useState<SeasonWeeklyStatusDisplay[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<number>(1);
    
    // State for logging events
    const [eventLog, setEventLog] = useState<{[key: string]: any}>({});

    const handleLogValueChange = (key: string, value: any) => {
        setEventLog(prev => ({ ...prev, [key]: value }));
    };

    const handleLogEvent = async (card: SeasonWeeklyStatusDisplay) => {
        if (!activeSeason || !card.ruleCode) return;

        const { action, ruleCode } = card;
        const contestantValue = eventLog[ruleCode];

        try {
            await runTransaction(db, async (transaction) => {
                const seasonRef = doc(db, "seasons", activeSeason.id);
                const compQuery = query(collection(db, "competitions"), where("seasonId", "==", activeSeason.id), where("week", "==", selectedWeek), where("type", "==", ruleCode));
                const compDocs = await getDocs(compQuery);
                const existingCompDoc = compDocs.docs[0];
                
                const data: Partial<Competition> = {
                    seasonId: activeSeason.id,
                    week: selectedWeek,
                    type: ruleCode,
                    airDate: new Date().toISOString(),
                };

                const player = contestantValue; // This can be an ID, or an array of IDs
                
                if (player) {
                    data.used = true; // Mark as used if a player is selected
                    switch (action) {
                        case 'setWinner': data.winnerId = player; break;
                        case 'setEvictee': data.evictedId = player; break;
                        case 'setNominees': data.nominees = Array.isArray(player) ? player : [player]; break;
                        case 'setSavedByVeto': data.usedOnId = player; break;
                        case 'setReplacementNom': data.replacementNomId = player; break;
                    }
                } else {
                     data.outcome = card.alternativeOutcomeText || 'Occurred';
                     data.used = false;
                }

                if (existingCompDoc) {
                    transaction.update(existingCompDoc.ref, data);
                } else {
                    const newCompRef = doc(collection(db, "competitions"));
                    transaction.set(newCompRef, data);
                }
            });
            toast({ title: "Event Logged", description: "The event has been successfully recorded." });
            setEventLog(prev => ({...prev, [ruleCode]: ''})); // Clear input after logging
        } catch (error) {
            console.error("Error logging event:", error);
            toast({ title: "Error", description: "Failed to log event.", variant: "destructive" });
        }
    };


    useEffect(() => {
        const unsubLeagues = onSnapshot(collection(db, "leagues"), (snap) => {
            if (!snap.empty) {
                const leagues = snap.docs.map(d => ({...d.data(), id: d.id} as League));
                setActiveLeague(leagues[0]);
            }
        });
        const unsubSeasons = onSnapshot(collection(db, "seasons"), (snap) => {
            const allSeasons = snap.docs.map(d => ({...d.data(), id: d.id } as Season));
            setSeasons(allSeasons);
        });
        const unsubScoringRules = onSnapshot(collection(db, "scoring_rules"), (snap) => {
            setScoringRuleSets(snap.docs.map(d => ({ ...d.data(), id: d.id } as ScoringRuleSet)));
        });

        return () => { unsubLeagues(); unsubSeasons(); unsubScoringRules(); };
    }, [db]);

    useEffect(() => {
        if (activeLeague && seasons.length > 0) {
            const season = seasons.find(s => s.id === activeLeague.seasonId);
            setActiveSeason(season || null);
            setSelectedWeek(season?.currentWeek || 1);
        }
    }, [activeLeague, seasons]);

    useEffect(() => {
        if (activeLeague && scoringRuleSets.length > 0) {
            const ruleSetId = activeLeague.settings.scoringRuleSetId;
            setSelectedScoringRuleSetId(ruleSetId);
            const rules = scoringRuleSets.find(rs => rs.id === ruleSetId)?.rules || [];
            setActiveScoringRules(rules);
        }
    }, [activeLeague, scoringRuleSets]);

    useEffect(() => {
        if (activeSeason) {
            const weekKey = `week${selectedWeek}`;
            const displayConfig = activeSeason.weeklyStatusDisplay?.[weekKey] || [];
            setWeeklyStatusDisplay(displayConfig.map((c, i) => ({...c, _id: c._id || `${weekKey}-${i}-${Date.now()}` })));
            
            const qContestants = query(collection(db, "contestants"), where("seasonId", "==", activeSeason.id));
            const unsubContestants = onSnapshot(qContestants, (snap) => setContestants(snap.docs.map(d => ({...d.data(), id: d.id } as Contestant))));
            
            const qCompetitions = query(collection(db, "competitions"), where("seasonId", "==", activeSeason.id), where("week", "==", selectedWeek));
            const unsubCompetitions = onSnapshot(qCompetitions, (snap) => setCompetitions(snap.docs.map(d => ({...d.data(), id: d.id } as Competition))));

            return () => { unsubContestants(); unsubCompetitions(); };
        }
    }, [activeSeason, selectedWeek, db]);

    const weekOptions = useMemo(() => {
        if (!activeSeason?.totalWeeks) return [];
        return Array.from({ length: activeSeason.totalWeeks }, (_, i) => i + 1);
    }, [activeSeason]);

    const handleStatusCardChange = useCallback((updatedCard: SeasonWeeklyStatusDisplay) => {
        setWeeklyStatusDisplay(currentCards => {
            const newCards = [...currentCards];
            const findAndReplace = (cards: SeasonWeeklyStatusDisplay[], cardToUpdate: SeasonWeeklyStatusDisplay): boolean => {
                for (let i = 0; i < cards.length; i++) {
                    if (cards[i]._id === cardToUpdate._id) {
                        cards[i] = cardToUpdate;
                        return true;
                    }
                    if (cards[i].followUp) {
                        if (findAndReplace([cards[i].followUp!], cardToUpdate)) {
                           return true;
                        }
                    }
                }
                return false;
            };
            findAndReplace(newCards, updatedCard);
            return newCards;
        });
    }, []);

    const handleDeleteStatusCard = (idToDelete: string) => {
        const filterRecursive = (cards: SeasonWeeklyStatusDisplay[]): SeasonWeeklyStatusDisplay[] => {
            return cards.filter(card => card._id !== idToDelete).map(card => {
                if (card.followUp) {
                    return { ...card, followUp: filterRecursive([card.followUp])[0] };
                }
                return card;
            });
        };
        setWeeklyStatusDisplay(current => filterRecursive(current));
    };

    const handleAddStatusCard = () => {
        const newCard: SeasonWeeklyStatusDisplay = {
            _id: `new-${Date.now()}`,
            ruleCode: '',
            title: 'New Event',
            icon: 'Plus',
            order: weeklyStatusDisplay.length + 1,
            color: 'text-gray-500',
            action: 'setWinner'
        };
        setWeeklyStatusDisplay(current => [...current, newCard]);
    };

    const handleSaveWeeklyDisplay = async () => {
        if (!activeSeason) return;
        try {
            await runTransaction(db, async (transaction) => {
                const seasonRef = doc(db, "seasons", activeSeason.id);
                const seasonDoc = await transaction.get(seasonRef);
                if (!seasonDoc.exists()) throw "Season does not exist!";

                const newWeeklyStatus = { ...seasonDoc.data().weeklyStatusDisplay, [`week${selectedWeek}`]: weeklyStatusDisplay };
                transaction.update(seasonRef, { weeklyStatusDisplay: newWeeklyStatus });
            });
            toast({ title: "Success", description: `Week ${selectedWeek} display saved.` });
        } catch (error) {
            console.error("Error saving weekly display:", error);
            toast({ title: "Error", description: "Could not save weekly display.", variant: "destructive" });
        }
    };
    
    const handleStartNextWeek = async () => {
        if (!activeSeason) return;
        const nextWeek = activeSeason.currentWeek + 1;
        if (activeSeason.totalWeeks && nextWeek > activeSeason.totalWeeks) {
             toast({ title: "Season End", description: "This is the final week of the season." });
             return;
        }
        try {
            const seasonRef = doc(db, "seasons", activeSeason.id);
            const batch = writeBatch(db);
            batch.update(seasonRef, { currentWeek: nextWeek });
            await batch.commit();
            setSelectedWeek(nextWeek);
            toast({ title: "Next Week Started", description: `Now managing Week ${nextWeek}.` });
        } catch (error) {
            console.error("Error starting next week:", error);
            toast({ title: "Error", description: "Could not start the next week.", variant: "destructive" });
        }
    };
    
    const handleGoBackOneWeek = async () => {
        if (!activeSeason || activeSeason.currentWeek <= 1) return;
        const weekToDelete = activeSeason.currentWeek;
        const prevWeek = weekToDelete - 1;
        
        try {
            const batch = writeBatch(db);
            
            // Delete competitions for the current week
            const compQuery = query(collection(db, "competitions"), where("seasonId", "==", activeSeason.id), where("week", "==", weekToDelete));
            const compDocs = await getDocs(compQuery);
            compDocs.forEach(doc => batch.delete(doc.ref));

            // Decrement currentWeek on season
            const seasonRef = doc(db, "seasons", activeSeason.id);
            batch.update(seasonRef, { currentWeek: prevWeek });
            
            await batch.commit();
            setSelectedWeek(prevWeek);
            toast({ title: "Rolled Back", description: `Returned to Week ${prevWeek}. Events from Week ${weekToDelete} have been deleted.` });

        } catch (error) {
            console.error("Error rolling back week:", error);
            toast({ title: "Error", description: "Could not roll back to the previous week.", variant: "destructive" });
        }
    };


    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, }));
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setWeeklyStatusDisplay((items) => {
                const oldIndex = items.findIndex(item => item._id === active.id);
                const newIndex = items.findIndex(item => item._id === over!.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };
    
    if (!appUser) return <div className="flex flex-1 items-center justify-center"><div>Loading...</div></div>;

    const loggedEventsForWeek = useMemo(() => {
        return competitions.map(comp => {
            const rule = activeScoringRules.find(r => r.code === comp.type);
            let players: Contestant[] = [];
            if (comp.winnerId) players = contestants.filter(c => c.id === comp.winnerId);
            if (comp.evictedId) players = contestants.filter(c => c.id === comp.evictedId);
            if (comp.nominees) players = contestants.filter(c => comp.nominees?.includes(c.id));
            if (comp.usedOnId) players.push(...contestants.filter(c=>c.id === comp.usedOnId));
            if (comp.replacementNomId) players.push(...contestants.filter(c=>c.id === comp.replacementNomId));
            
            return {
                ...comp,
                label: rule?.label || comp.type,
                players,
            }
        });
    }, [competitions, activeScoringRules, contestants]);
    
    return (
        <PageLayout>
            <AppHeader pageTitle="Admin Panel" pageIcon={Shield} />
            <main className="flex-1 p-4 md:p-8">
                <Tabs defaultValue="events">
                    <TabsList>
                        <TabsTrigger value="events">Weekly Events</TabsTrigger>
                        <TabsTrigger value="data">Data Model</TabsTrigger>
                         <TabsTrigger value="site">Site Admin</TabsTrigger>
                    </TabsList>
                    <TabsContent value="events">
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Events & Logging</CardTitle>
                                <CardDescription>Manage weekly status display and log competition results for the selected week.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <Label>Select Week:</Label>
                                    <Select value={String(selectedWeek)} onValueChange={val => setSelectedWeek(Number(val))}>
                                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {weekOptions.map(week => <SelectItem key={week} value={String(week)}>Week {week}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Log & Customize: Week {selectedWeek} Display</CardTitle>
                                            <CardDescription>Drag to reorder cards. Changes here affect the main dashboard's weekly status display.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                                <SortableContext items={weeklyStatusDisplay.map(c => c._id || '')} strategy={verticalListSortingStrategy}>
                                                    {weeklyStatusDisplay.map((card, index) => (
                                                        <EventEditorCard
                                                            key={card._id}
                                                            path={String(index)}
                                                            card={card}
                                                            onUpdate={handleStatusCardChange}
                                                            onDelete={() => handleDeleteStatusCard(card._id || '')}
                                                            scoringRules={activeScoringRules}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                            <Button onClick={handleAddStatusCard} variant="outline" className="mt-4"><PlusCircle className="mr-2" /> Add Event Card</Button>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Logged Scoring Events for Week {selectedWeek}</CardTitle>
                                            <CardDescription>Events that have already been logged for this week are listed here.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                           {loggedEventsForWeek.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {loggedEventsForWeek.map(event => (
                                                        <li key={event.id} className="text-sm p-2 rounded-md bg-muted/50 flex justify-between items-center">
                                                           <div>
                                                                <span className="font-semibold">{event.label}:</span>
                                                                <span className="ml-2 text-muted-foreground">
                                                                    {event.players.length > 0 
                                                                        ? event.players.map(p => getContestantDisplayName(p, 'short')).join(', ')
                                                                        : (event.outcome || "Logged")
                                                                    }
                                                                </span>
                                                           </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                           ) : (
                                               <p className="text-sm text-muted-foreground">No events logged for this week yet.</p>
                                           )}
                                        </CardContent>
                                    </Card>

                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center border-t pt-4 mt-4">
                                <div className="flex gap-2">
                                    {activeSeason && selectedWeek === activeSeason.currentWeek && activeSeason.currentWeek > 1 && (
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" ><ArrowLeft className="mr-2" /> Go Back One Week</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will revert the season to Week {activeSeason.currentWeek - 1} and permanently delete all logged events for Week {activeSeason.currentWeek}. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleGoBackOneWeek}>Yes, Go Back</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                     <Button onClick={handleSaveWeeklyDisplay}><Save className="mr-2" /> Save Display Config</Button>
                                    {activeSeason && selectedWeek === activeSeason.currentWeek && (
                                        <Button onClick={handleStartNextWeek} variant="secondary">Start Next Week <ArrowRight className="ml-2" /></Button>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                    <TabsContent value="data">
                        <p>Data model management coming soon.</p>
                    </TabsContent>
                    <TabsContent value="site">
                        <SiteAdminPanel />
                    </TabsContent>
                </Tabs>
            </main>
        </PageLayout>
    );
}

function SiteAdminPanel() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<string>('player');
    const { toast } = useToast();

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inviteUser({ email, role });
            toast({
                title: 'Invitation Sent',
                description: `${email} has been invited as a ${role}.`,
            });
            setEmail('');
        } catch (error: any) {
            toast({
                title: 'Invitation Failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };
    
    return (
         <Card>
            <CardHeader>
                <CardTitle>Site Administration</CardTitle>
                <CardDescription>Manage users and global site settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleInvite} className="space-y-4">
                    <h3 className="text-lg font-medium">Invite User</h3>
                    <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="new.user@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                             <Label htmlFor="role">Role</Label>
                             <Select value={role} onValueChange={setRole}>
                                 <SelectTrigger className="w-40">
                                     <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="player">Player</SelectItem>
                                     <SelectItem value="league_admin">League Admin</SelectItem>
                                     <SelectItem value="site_admin">Site Admin</SelectItem>
                                 </SelectContent>
                             </Select>
                         </div>
                        <Button type="submit">Send Invitation</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

// Default export can be wrapped with withAuth for use in the app
const AdminPageWithAuth = withAuth(AdminPage, ['site_admin', 'league_admin']);
export default AdminPageWithAuth;
