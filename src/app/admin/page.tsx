
"use client";

import { useState, useEffect, createElement, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users, Pencil, CalendarClock, Crown, Shield, UserX, UserCheck, Save, PlusCircle, Trash2, ShieldCheck, UserCog, Upload, Mail, KeyRound, User, Lock, Building, MessageSquareQuote, ListChecks, RotateCcw, ArrowLeft, MoreHorizontal, Send, MailQuestion, UserPlus2, SortAsc, ShieldQuestion, ChevronsUpDown, Plus, BookCopy, Palette, Smile, Trophy, Star, TrendingUp, TrendingDown, Swords, Handshake, Angry, GripVertical, Home, Ban, Gem, Gift, HeartPulse, Medal, DollarSign, Rocket, Cctv, Skull, CloudSun, XCircle, ShieldPlus, Calendar as CalendarIcon, Package, Globe, UserSquare, Database, Search, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, ShieldAlert, Tv, AlertTriangle, Loader2, DatabaseZap, Link as LinkIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { User as UserType, Team, UserRole, Contestant, Competition, League, ScoringRule, UserStatus, Season, ScoringRuleSet, LeagueScoringBreakdownCategory, Pick, SeasonWeeklyStatusDisplay } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn, getContestantDisplayName, getCroppedImg } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { app } from '@/lib/firebase';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, query, getDoc, writeBatch, where, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import Cropper, { Area } from 'react-easy-crop';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { BB_RULES_DEFAULT } from '@/lib/constants';


const iconSelection = [
    'Crown', 'Ban', 'Gem', 'Gift', 'HeartPulse', 'KeyRound', 'ShieldPlus', 'Trophy',
    'Medal', 'DollarSign', 'Rocket', 'Cctv', 'Skull', 'CloudSun', 'XCircle', 'BrickWall',
    'Swords', 'Handshake', 'Angry', 'Smile', 'Star', 'TrendingUp', 'TrendingDown', 'ShieldAlert',
] as const;

const colorSelection = [
    'bg-gray-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500',
    'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500'
];

const USERS_PER_PAGE = 5;
const ITEMS_PER_PAGE = 5;

// Define a type for editable status display items with a unique key
type EditableSeasonWeeklyStatusDisplay = SeasonWeeklyStatusDisplay & { _id: string; followUp?: EditableSeasonWeeklyStatusDisplay };

const EventEditorCard = ({
    card,
    onUpdate,
    onRemove,
    scoringRules,
    contestantList,
    weeklyEventData,
    handleEventChange,
    handleLogEvent,
    isSubCard = false,
}: {
    card: EditableSeasonWeeklyStatusDisplay,
    onUpdate: (cardId: string, field: keyof SeasonWeeklyStatusDisplay, value: any) => void,
    onRemove: (cardId: string) => void,
    scoringRules: ScoringRule[],
    contestantList: Contestant[],
    weeklyEventData: { [key: string]: Partial<Competition> },
    handleEventChange: (type: string, field: keyof Competition, value: any) => void,
    handleLogEvent: (ruleCode: string) => void,
    isSubCard?: boolean,
}) => {
    const [localCard, setLocalCard] = useState(card);

    useEffect(() => {
        setLocalCard(card);
    }, [card]);

    const handleLocalChange = (field: keyof SeasonWeeklyStatusDisplay, value: any) => {
        setLocalCard(prev => ({ ...prev, [field]: value }));
    };

    const handleBlur = (field: keyof SeasonWeeklyStatusDisplay) => {
        if (localCard[field] !== card[field]) {
            onUpdate(card._id, field, localCard[field]);
        }
    };
    
    const isMultiPick = localCard.isMultiPick;
    const isEviction = localCard.ruleCode.includes('EVICT');
    const eventKey = localCard.ruleCode;

    return (
        <div className="relative">
            {isSubCard && (
                <>
                    <div className="absolute left-6 -top-2 h-4 w-px bg-border"></div>
                    <div className="absolute left-6 top-2 h-px w-6 bg-border"></div>
                    <Plus className="absolute left-[18px] top-2.5 h-4 w-4 text-muted-foreground bg-background rounded-full" />
                </>
            )}
            <div className={cn("p-3 border rounded-lg bg-muted/50", isSubCard && "ml-12 mt-2")}>
                <div className='flex items-start gap-4 flex-col md:flex-row'>
                    <div className="flex flex-col gap-2 w-full md:w-48">
                        <div className='flex items-center justify-between'>
                            <Select value={localCard.ruleCode} onValueChange={val => onUpdate(card._id, 'ruleCode', val)}>
                                <SelectTrigger className="h-7 font-mono text-xs w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {scoringRules.map(r => <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 pl-2">
                                <div className="flex items-center gap-1.5">
                                    <Switch id={`multipick-${card._id}`} checked={!!localCard.isMultiPick} onCheckedChange={val => onUpdate(card._id, 'isMultiPick', val)} />
                                    <Label htmlFor={`multipick-${card._id}`} className='text-xs'>Multi?</Label>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(card._id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                                            {createElement((LucideIcons as any)[localCard.icon] || Trophy, { className: cn("h-4 w-4", localCard.color) })}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2">
                                        <div className="grid grid-cols-5 gap-1">
                                            {iconSelection.map(icon => (
                                                <Button key={icon} variant="ghost" size="icon" className="h-8 w-8" onClick={() => onUpdate(card._id, 'icon', icon)}>
                                                    {createElement((LucideIcons as any)[icon], { className: "h-4 w-4" })}
                                                </Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <div className={cn("h-6 w-6 shrink-0 rounded-full cursor-pointer border", (localCard.color || '').replace('text-', 'bg-'))} />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2">
                                        <div className="grid grid-cols-6 gap-1">
                                            {colorSelection.map(color => (
                                                <div key={color} className={cn("h-6 w-6 rounded-full cursor-pointer", color)} onClick={() => onUpdate(card._id, 'color', color.replace('bg-', 'text-'))} />
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    value={localCard.title}
                                    onChange={(e) => handleLocalChange('title', e.target.value)}
                                    onBlur={() => handleBlur('title')}
                                    className="h-8 text-sm font-medium flex-grow min-w-0"
                                    placeholder='Dashboard Title'
                                />
                            </div>
                        </div>
                    </div>
                    <Separator orientation="vertical" className="h-auto hidden md:block" />
                    <Separator orientation="horizontal" className="w-full md:hidden" />
                    <div className="flex-1 space-y-3 w-full">
                        <div className="p-2 border rounded-md bg-background min-h-[76px]">
                            {isMultiPick ? (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-1">
                                        {(weeklyEventData[eventKey]?.nominees || []).map((nomId: string) => {
                                            const nominee = contestantList.find(c => c.id === nomId);
                                            return (
                                                <Badge key={nomId} variant="secondary" className="gap-1.5">
                                                    <span>{nominee ? getContestantDisplayName(nominee, 'short') : '...'}</span>
                                                    <button onClick={() => {
                                                        const newNoms = (weeklyEventData[eventKey]?.nominees || []).filter((id: string) => id !== nomId);
                                                        handleEventChange(eventKey, 'nominees', newNoms);
                                                    }}>
                                                        <XCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    <Select
                                        value=""
                                        onValueChange={val => {
                                            if (val) {
                                                const currentNoms = weeklyEventData[eventKey]?.nominees || [];
                                                if (!currentNoms.includes(val)) {
                                                    handleEventChange(eventKey, 'nominees', [...currentNoms, val]);
                                                }
                                            }
                                        }}>
                                        <SelectTrigger className="h-8"><SelectValue placeholder="Add nominee..." /></SelectTrigger>
                                        <SelectContent>
                                            {contestantList
                                                .filter(c => !(weeklyEventData[eventKey]?.nominees || []).includes(c.id))
                                                .map(c => <SelectItem key={c.id} value={c.id}>{getContestantDisplayName(c, 'full')}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <Select
                                    value={weeklyEventData[eventKey]?.[isEviction ? 'evictedId' : 'winnerId'] || ''}
                                    onValueChange={val => handleEventChange(eventKey, isEviction ? 'evictedId' : 'winnerId', val)}>
                                    <SelectTrigger className="h-8"><SelectValue placeholder={`Select...`} /></SelectTrigger>
                                    <SelectContent>{contestantList.map(c => <SelectItem key={c.id} value={c.id}>{getContestantDisplayName(c, 'full')}</SelectItem>)}</SelectContent>
                                </Select>
                            )}
                            <Button size="sm" onClick={() => handleLogEvent(eventKey)} className="w-full mt-2">Log Event</Button>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
                            <Switch id={`followup-${card._id}`} checked={!!localCard.hasFollowUp} onCheckedChange={val => onUpdate(card._id, 'hasFollowUp', val)} />
                            <Label htmlFor={`followup-${card._id}`}>Follow-up Event?</Label>
                        </div>
                    </div>
                </div>
            </div>
            {localCard.hasFollowUp && localCard.followUp && (
                <EventEditorCard
                    card={localCard.followUp}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    scoringRules={scoringRules}
                    contestantList={contestantList}
                    weeklyEventData={weeklyEventData}
                    handleEventChange={handleEventChange}
                    handleLogEvent={handleLogEvent}
                    isSubCard={true}
                />
            )}
        </div>
    );
};


// Component to manage a single rule row, preventing input focus loss
const RuleRow = ({ rule, index, onUpdate, onRemove }: { rule: ScoringRule, index: number, onUpdate: (index: number, field: keyof ScoringRule, value: string | number) => void, onRemove: (code: string) => void }) => {
    const [localRule, setLocalRule] = useState(rule);

    useEffect(() => {
        setLocalRule(rule);
    }, [rule]);

    const handleChange = (field: keyof ScoringRule, value: string | number) => {
        const newRule = { ...localRule, [field]: value };
        setLocalRule(newRule);
    };

    const handleBlur = (field: keyof ScoringRule) => {
        // Only update if the value has actually changed
        if (localRule[field] !== rule[field]) {
            onUpdate(index, field, localRule[field]);
        }
    };

    return (
        <TableRow>
            <TableCell>
                <Input 
                    value={localRule.code} 
                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())} 
                    onBlur={() => handleBlur('code')}
                    className="h-8" 
                />
            </TableCell>
            <TableCell>
                <Input 
                    value={localRule.label} 
                    onChange={(e) => handleChange('label', e.target.value)} 
                    onBlur={() => handleBlur('label')}
                    className="h-8" 
                />
            </TableCell>
            <TableCell className="text-right">
                <Input 
                    type="number" 
                    value={localRule.points} 
                    onChange={(e) => handleChange('points', Number(e.target.value))} 
                    onBlur={() => handleBlur('points')}
                    className="h-8 w-20 text-right" 
                />
            </TableCell>
            <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemove(rule.code)}>
                    <Trash2 className="h-4 w-4 text-red-500"/>
                </Button>
            </TableCell>
        </TableRow>
    );
};

// Dialog for adding a new scoring rule
const AddRuleDialog = ({ open, onOpenChange, onAddRule }: { open: boolean, onOpenChange: (open: boolean) => void, onAddRule: (rule: ScoringRule) => void }) => {
    const [newRuleData, setNewRuleData] = useState<ScoringRule>({ code: '', label: '', points: 0 });
    const { toast } = useToast();

    const handleAdd = () => {
        if (!newRuleData.code || !newRuleData.label) {
             toast({ title: "Rule code and label are required.", variant: 'destructive' });
             return;
        }
        onAddRule(newRuleData);
        setNewRuleData({ code: '', label: '', points: 0 }); // Reset state after adding
        onOpenChange(false);
    };

    const handleCancel = () => {
        setNewRuleData({ code: '', label: '', points: 0 }); // Reset state on cancel
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Scoring Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="rule-code">Rule Code (e.g., HOH_WIN)</Label>
                        <Input id="rule-code" value={newRuleData.code} onChange={(e) => setNewRuleData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rule-label">Label (e.g., Head of Household Win)</Label>
                        <Input id="rule-label" value={newRuleData.label} onChange={(e) => setNewRuleData(prev => ({ ...prev, label: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rule-points">Points</Label>
                        <Input id="rule-points" type="number" value={newRuleData.points} onChange={(e) => setNewRuleData(prev => ({ ...prev, points: Number(e.target.value) }))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleAdd}>Add Rule</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


function AdminPage() {
  const { toast } = useToast();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const { appUser: currentUser } = useAuth();
  const searchParams = useSearchParams();
  
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [editingLeagueDetails, setEditingLeagueDetails] = useState<Partial<League> | null>(null);
  const [editingBreakdownCategories, setEditingBreakdownCategories] = useState<LeagueScoringBreakdownCategory[]>([]);

  const manageableLeagues = useMemo(() => {
    if (currentUser?.role === 'site_admin') {
      return allLeagues;
    }
    if (currentUser?.role === 'league_admin') {
      return allLeagues.filter(l => l.adminUserIds?.includes(currentUser.id));
    }
    return [];
  }, [allLeagues, currentUser]);

  const leagueSettings = useMemo(() => manageableLeagues.find(l => l.id === selectedLeagueId), [manageableLeagues, selectedLeagueId]);
  
  useEffect(() => {
      if (leagueSettings) {
          setEditingLeagueDetails({
              name: leagueSettings.name,
              seasonId: leagueSettings.seasonId,
              maxTeams: leagueSettings.maxTeams,
              contestantTerm: leagueSettings.contestantTerm || { singular: 'Contestant', plural: 'Contestants' },
              settings: {
                  ...leagueSettings.settings
              }
          });
          setEditingBreakdownCategories(leagueSettings.settings?.scoringBreakdownCategories || []);
      }
  }, [leagueSettings]);

  const [leagueToDelete, setLeagueToDelete] = useState<League | null>(null);
  const [seasonToDelete, setSeasonToDelete] = useState<Season | null>(null);

  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  
  const [leaguesCurrentPage, setLeaguesCurrentPage] = useState(1);
  const [seasonsCurrentPage, setSeasonsCurrentPage] = useState(1);

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [scoringRuleSet, setScoringRuleSet] = useState<ScoringRuleSet | null>(null);
  
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [contestantToDelete, setContestantToDelete] = useState<Contestant | null>(null);
  const [newContestantData, setNewContestantData] = useState<Partial<Contestant>>({
    firstName: '', lastName: '', nickname: '', age: 25, hometown: '', status: 'active'
  });
  
  // State for weekly events form
  const [viewingWeek, setViewingWeek] = useState(1);
  const [weeklyEventData, setWeeklyEventData] = useState<{ [key: string]: Partial<Competition> }>({});
  const [isDeletingWeekEvents, setIsDeletingWeekEvents] = useState(false);
  const [competitionToDelete, setCompetitionToDelete] = useState<Competition | null>(null);
  const [isSpecialEventDialogOpen, setIsSpecialEventDialogOpen] = useState(false);
  const [newSpecialEventData, setNewSpecialEventData] = useState<{ contestantId: string, ruleCode: string }>({ contestantId: '', ruleCode: '' });


  const weeklyCompetitions = useMemo(() => 
    competitions.filter(c => c.seasonId === activeSeason?.id && c.week === viewingWeek),
    [competitions, activeSeason, viewingWeek]
  );
  
  useEffect(() => {
    const data: { [key: string]: Partial<Competition> } = {};
    weeklyCompetitions.forEach(comp => {
      data[comp.type] = comp;
    });
    setWeeklyEventData(data);
  }, [weeklyCompetitions]);

  const handleEventChange = (type: Competition['type'], field: keyof Competition, value: any) => {
    setWeeklyEventData(prev => ({
        ...prev,
        [type]: {
            ...prev[type],
            [field]: value,
        }
    }));
  };

    const handleLogEvent = async (ruleCode: string) => {
        if (!activeSeason || !leagueSettings || !ruleCode) return;

        let eventToLog = weeklyEventData[ruleCode] || {};

        const isEviction = ruleCode.includes('EVICT');

        const existingEvent = weeklyCompetitions.find(c => c.type === ruleCode);
        
        const dataToSave: Partial<Competition> & { seasonId: string; week: number; type: string; airDate: string } = {
            seasonId: activeSeason.id,
            week: viewingWeek,
            type: ruleCode, // Always save the original ruleCode as the type
            airDate: new Date().toISOString(),
            ...eventToLog,
        };
        
        // Handle eviction-specific side effects
        if (isEviction && dataToSave.evictedId) {
            const contestantRef = doc(db, 'contestants', dataToSave.evictedId);
            await updateDoc(contestantRef, {
                status: 'evicted',
                evictedDay: (viewingWeek * 7) - 1, // Approximate day
            });
        }


        try {
            if (existingEvent) {
                await updateDoc(doc(db, 'competitions', existingEvent.id), dataToSave);
                toast({ title: `Event updated successfully.` });
            } else {
                await addDoc(collection(db, 'competitions'), dataToSave);
                toast({ title: `Event logged successfully.` });
            }
        } catch (error) {
            console.error("Error logging event:", error);
            toast({ title: "Error logging event.", variant: "destructive" });
        }
    };


  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isNewLeagueDialogOpen, setIsNewLeagueDialogOpen] = useState(false);
  const [isManageAdminsDialogOpen, setIsManageAdminsDialogOpen] = useState(false);
  const [isManageOwnersDialogOpen, setIsManageOwnersDialogOpen] = useState(false);
  const [teamToManageOwners, setTeamToManageOwners] = useState<Team | null>(null);
  const [leagueToManageAdmins, setLeagueToManageAdmins] = useState<League | null>(null);
  const [isNewSeasonDialogOpen, setIsNewSeasonDialogOpen] = useState(false);
  const [isNewContestantDialogOpen, setIsNewContestantDialogOpen] = useState(false);

  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [draftingTeam, setDraftingTeam] = useState<Team | null>(null);
  const [draftSelection, setDraftSelection] = useState<string>('');
  const [currentPickNumber, setCurrentPickNumber] = useState(1);


  const [newUserData, setNewUserData] = useState({ displayName: '', email: '' });
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  
  const [newLeagueData, setNewLeagueData] = useState<Partial<League>>({
      name: '',
      seasonId: '',
      maxTeams: 8,
      contestantTerm: { singular: 'Contestant', plural: 'Contestants' },
      settings: { draftRounds: 4 },
      adminUserIds: [],
  });
  const [newSeasonData, setNewSeasonData] = useState<Partial<Season>>({
      franchise: 'Big Brother US',
      status: 'upcoming',
      currentWeek: 1,
      year: new Date().getFullYear(),
  });
  
  const [teamNameEdits, setTeamNameEdits] = useState<{ [key: string]: string }>({});
  const [teamDraftOrderEdits, setTeamDraftOrderEdits] = useState<{ [key: string]: number }>({});
  const [teamOwnerEdits, setTeamOwnerEdits] = useState<{ [key: string]: string[] }>({});

  const initialView = searchParams.get('view');
  const [activeTab, setActiveTab] = useState('events');

  useEffect(() => {
    if (initialView === 'league') {
        setActiveTab('events');
        return;
    }
    if (initialView === 'site') {
        setActiveTab('site');
        return;
    }

    const lastTab = sessionStorage.getItem('adminLastTab');
    const defaultTab = lastTab 
      ? lastTab
      : (currentUser?.role === 'site_admin' ? 'site' : (manageableLeagues.length > 0 ? 'events' : 'site'));
    
    // Fallback if the saved tab is not accessible
    if (defaultTab !== 'site' && manageableLeagues.length === 0) {
        setActiveTab('site');
    } else {
        setActiveTab(defaultTab);
    }
  }, [initialView, currentUser, manageableLeagues]);

  useEffect(() => {
    sessionStorage.setItem('adminLastTab', activeTab);
  }, [activeTab]);
  
  // Image Cropping State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [isFinishSeasonDialogOpen, setIsFinishSeasonDialogOpen] = useState(false);
  const [winnerId, setWinnerId] = useState<string | undefined>();
  const [runnerUpId, setRunnerUpId] = useState<string | undefined>();
  
    // Weekly status display state
    const [weeklyStatusDisplay, setWeeklyStatusDisplay] = useState<EditableSeasonWeeklyStatusDisplay[]>([]);
    const [isAddStatusCardOpen, setIsAddStatusCardOpen] = useState(false);
    const [newStatusCard, setNewStatusCard] = useState<Partial<SeasonWeeklyStatusDisplay>>({ title: '', icon: 'Trophy', ruleCode: '' });


  const scoringRules = useMemo(() => scoringRuleSet?.rules || [], [scoringRuleSet]);
  
  const teamsInLeague = useMemo(() => {
    if (!leagueSettings) return [];
    const existingTeams = allTeams.filter(t => t.leagueId === selectedLeagueId);
    
    const numTeams = leagueSettings.maxTeams || 0;
    let teamArray = Array.from({ length: numTeams }, (_, i) => {
        const existing = existingTeams.find(t => t.draftOrder === i + 1);
        return existing || {
            id: `temp-${i}`,
            name: `Team ${i + 1}`,
            draftOrder: i + 1,
            leagueId: selectedLeagueId!,
            ownerUserIds: [],
            contestantIds: [],
        };
    });

    return teamArray.sort((a, b) => (a.draftOrder || 0) - (b.draftOrder || 0));
  }, [allTeams, selectedLeagueId, leagueSettings]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
        (user.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
         user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()))
    );
  }, [users, userSearchTerm]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (userCurrentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, userCurrentPage]);
  
  const totalUserPages = useMemo(() => Math.ceil(filteredUsers.length / USERS_PER_PAGE), [filteredUsers]);

  const sortedLeagues = useMemo(() => [...manageableLeagues].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  }), [manageableLeagues]);

  const sortedSeasons = useMemo(() => [...seasons].sort((a, b) => b.year - a.year || (b.seasonNumber || 0) - (b.seasonNumber || 0)), [seasons]);

  const paginatedLeagues = useMemo(() => {
    const startIndex = (leaguesCurrentPage - 1) * ITEMS_PER_PAGE;
    return sortedLeagues.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedLeagues, leaguesCurrentPage]);
  const totalLeaguePages = useMemo(() => Math.ceil(sortedLeagues.length / ITEMS_PER_PAGE), [sortedLeagues]);

  const paginatedSeasons = useMemo(() => {
    const startIndex = (seasonsCurrentPage - 1) * ITEMS_PER_PAGE;
    return sortedSeasons.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedSeasons, seasonsCurrentPage]);
  const totalSeasonPages = useMemo(() => Math.ceil(sortedSeasons.length / ITEMS_PER_PAGE), [sortedSeasons]);
  
  const activeContestants = useMemo(() => contestants.filter(c => c.seasonId === activeSeason?.id && c.status === 'active').sort((a,b) => getContestantDisplayName(a, 'full').localeCompare(getContestantDisplayName(b, 'full'))), [contestants, activeSeason]);
  const inactiveContestants = useMemo(() => contestants.filter(c => c.seasonId === activeSeason?.id && c.status !== 'active').sort((a,b) => getContestantDisplayName(a, 'full').localeCompare(getContestantDisplayName(b, 'full'))), [contestants, activeSeason]);

  const allSeasonContestants = useMemo(() => {
    if (!activeSeason) return [];
    return contestants
      .filter(c => c.seasonId === activeSeason.id)
      .sort((a, b) => getContestantDisplayName(a, 'full').localeCompare(getContestantDisplayName(b, 'full')));
  }, [contestants, activeSeason]);

  const activeContestantsInLeague = useMemo(() => {
      if (!activeSeason) return [];
      return contestants.filter(c => c.seasonId === activeSeason.id && c.status === 'active');
  }, [contestants, activeSeason]);

  const draftableContestants = useMemo(() => {
      const pickedIds = picks.filter(p => p.leagueId === selectedLeagueId).map(p => p.contestantId);
      return activeContestantsInLeague.filter(c => !pickedIds.includes(c.id));
  }, [activeContestantsInLeague, picks, selectedLeagueId]);
  
  const draftOrder = useMemo(() => {
    if (!leagueSettings || !teamsInLeague.length) return [];
    
    const rounds = leagueSettings.settings.draftRounds || 4;
    const order: { team: Team, round: number, pick: number, overall: number }[] = [];
    
    for (let round = 1; round <= rounds; round++) {
      const roundOrder = (round % 2 !== 0) ? teamsInLeague : [...teamsInLeague].reverse();
      roundOrder.forEach((team, pick) => {
        order.push({
          team,
          round,
          pick: pick + 1,
          overall: (round - 1) * teamsInLeague.length + (pick + 1)
        });
      });
    }
    return order;
  }, [leagueSettings, teamsInLeague]);

  const nextPick = useMemo(() => {
    const madePicksCount = picks.filter(p => p.leagueId === selectedLeagueId).length;
    return draftOrder[madePicksCount];
  }, [draftOrder, picks, selectedLeagueId]);
  
  const weeklyStatusCards = useMemo(() => {
    if (!weeklyStatusDisplay) return [];
    return weeklyStatusDisplay.sort((a, b) => a.order - b.order);
  }, [weeklyStatusDisplay]);

  const handleUpdateSeason = async () => {
        if (!editingSeason || !editingSeason.id) return;
        try {
            const seasonRef = doc(db, 'seasons', editingSeason.id);
            await updateDoc(seasonRef, editingSeason);
            toast({ title: 'Season updated successfully.' });
            setEditingSeason(null);
        } catch (error) {
            console.error("Error updating season: ", error);
            toast({ title: 'Error updating season.', variant: 'destructive' });
        }
    };
  
  useEffect(() => {
    const unsubLeagues = onSnapshot(collection(db, "leagues"), (snap) => {
      const leaguesData = snap.docs.map(d => ({...d.data(), id: d.id} as League));
      setAllLeagues(leaguesData);
    });
    
    const unsubTeams = onSnapshot(collection(db, "teams"), (snap) => {
        const teamsData = snap.docs.map(d => ({...d.data(), id: d.id } as Team));
        setAllTeams(teamsData);
    });
    
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const usersData = snap.docs.map(d => ({...d.data(), id: d.id } as UserType));
        setUsers(usersData);
    });
    
    const unsubPicks = onSnapshot(collection(db, "picks"), (snap) => {
        const picksData = snap.docs.map(d => ({...d.data(), id: d.id } as Pick));
        setPicks(picksData);
    });
    
    const unsubSeasons = onSnapshot(collection(db, "seasons"), (snap) => {
        const seasonsData = snap.docs.map(d => ({...d.data(), id: d.id } as Season));
        setSeasons(seasonsData);
    });

    const unsubCompetitions = onSnapshot(collection(db, "competitions"), (snap) => {
      setCompetitions(snap.docs.map(d => ({...d.data(), id: d.id } as Competition)));
    });

    const unsubContestants = onSnapshot(collection(db, "contestants"), (snap) => {
      setContestants(snap.docs.map(d => ({...d.data(), id: d.id } as Contestant)));
    });

    return () => {
        unsubLeagues();
        unsubTeams();
        unsubUsers();
        unsubPicks();
        unsubSeasons();
        unsubCompetitions();
        unsubContestants();
    };
  }, [db]);

  useEffect(() => {
    if (manageableLeagues.length > 0 && !selectedLeagueId) {
      setSelectedLeagueId(manageableLeagues[0].id);
    }
  }, [manageableLeagues, selectedLeagueId]);
  
  useEffect(() => {
    if (leagueSettings?.seasonId) {
      const currentSeason = seasons.find(s => s.id === leagueSettings.seasonId);
      setActiveSeason(currentSeason || null);
    } else {
      setActiveSeason(null);
    }
  }, [leagueSettings, seasons]);
  
  useEffect(() => {
      if (activeSeason) {
        setViewingWeek(activeSeason.currentWeek);
        const currentWeekKey = `week${activeSeason.currentWeek}`;
        const defaultDisplay = [
            { ruleCode: 'HOH_WIN', title: 'HOH', icon: 'Crown', order: 1, color: 'text-purple-500' },
            { ruleCode: 'NOMINATED', title: 'Nominations', icon: 'TriangleAlert', order: 2, color: 'text-red-500', isMultiPick: true },
            { ruleCode: 'VETO_WIN', title: 'Power of Veto', icon: 'Ban', order: 3, color: 'text-amber-500', hasFollowUp: true, 
              followUp: { ruleCode: 'VETO_USED', title: 'Saved', icon: 'ShieldCheck', color: 'text-sky-500', 
                followUp: { ruleCode: 'FINAL_NOM', title: 'Renom', icon: 'RotateCcw', color: 'text-orange-500' }
              } 
            },
            { ruleCode: 'EVICT_PRE', title: 'Evicted', icon: 'Skull', order: 4, color: 'text-gray-500' }
        ] as SeasonWeeklyStatusDisplay[];

        let displayData: SeasonWeeklyStatusDisplay[] = [];
        if (activeSeason.weeklyStatusDisplay && activeSeason.weeklyStatusDisplay[currentWeekKey]) {
            displayData = activeSeason.weeklyStatusDisplay[currentWeekKey];
        } else if (activeSeason.currentWeek > 1) {
             const prevWeekKey = `week${activeSeason.currentWeek - 1}`;
             displayData = activeSeason.weeklyStatusDisplay?.[prevWeekKey] || defaultDisplay;
        } else {
            displayData = defaultDisplay;
        }
        // Add unique _id for stable keys in React
        setWeeklyStatusDisplay(displayData.map((d, i) => ({ ...d, _id: `${Date.now()}-${i}` })));
      }
  }, [activeSeason]);
  
  useEffect(() => {
    if (leagueSettings?.settings?.scoringRuleSetId) {
      const unsub = onSnapshot(doc(db, "scoring_rules", leagueSettings.settings.scoringRuleSetId), (snap) => {
        if (snap.exists()) {
          setScoringRuleSet({ ...snap.data(), id: snap.id } as ScoringRuleSet);
        } else {
          setScoringRuleSet(null);
        }
      });
      return () => unsub();
    } else {
        setScoringRuleSet(null);
    }
  }, [db, leagueSettings]);
  
  const handleUpdateLeagueDetails = async () => {
      if (!selectedLeagueId || !editingLeagueDetails) {
          toast({ title: "No league selected.", variant: "destructive" });
          return;
      }
      try {
          const leagueRef = doc(db, 'leagues', selectedLeagueId);
          await updateDoc(leagueRef, editingLeagueDetails);
          toast({ title: "League details updated successfully!" });
      } catch (error) {
          console.error("Error updating league details: ", error);
          toast({ title: "Error updating details", variant: "destructive" });
      }
  };

  const handleUpdateBreakdownCategories = async () => {
      if (!selectedLeagueId) {
          toast({ title: "No league selected.", variant: "destructive" });
          return;
      }
      try {
          const leagueRef = doc(db, 'leagues', selectedLeagueId);
          await updateDoc(leagueRef, { 'settings.scoringBreakdownCategories': editingBreakdownCategories });
          toast({ title: "Scoring breakdown updated successfully!" });
      } catch (error) {
          console.error("Error updating breakdown categories: ", error);
          toast({ title: "Error updating breakdown", variant: "destructive" });
      }
  };
  
  const handleBreakdownChange = (index: number, field: keyof LeagueScoringBreakdownCategory, value: any) => {
        const updated = [...editingBreakdownCategories];
        (updated[index] as any)[field] = value;
        setEditingBreakdownCategories(updated);
  };
  
  const handleAddBreakdownCategory = () => {
        if (editingBreakdownCategories.length < 6) {
            setEditingBreakdownCategories([
                ...editingBreakdownCategories,
                { displayName: '', icon: 'Trophy', color: 'text-gray-500', ruleCodes: [] }
            ]);
        }
  };

  const handleRemoveBreakdownCategory = (index: number) => {
        const updated = [...editingBreakdownCategories];
        updated.splice(index, 1);
        setEditingBreakdownCategories(updated);
  };

  const handleAddRule = (ruleData: ScoringRule) => {
    if (!scoringRuleSet) {
        toast({ title: "No scoring rule set selected.", variant: 'destructive' });
        return;
    }
    const updatedRules = [...scoringRuleSet.rules, ruleData];
    updateDoc(doc(db, "scoring_rules", scoringRuleSet.id), { rules: updatedRules })
        .then(() => {
            toast({ title: "Rule added successfully" });
        })
        .catch(error => {
            console.error("Error adding rule: ", error);
            toast({ title: "Error adding rule", variant: 'destructive' });
        });
  };

  const handleUpdateRule = async (index: number, field: keyof ScoringRule, value: string | number) => {
    if (!scoringRuleSet) return;
    const updatedRules = [...scoringRuleSet.rules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
     try {
      await updateDoc(doc(db, "scoring_rules", scoringRuleSet.id), { rules: updatedRules });
      toast({ title: "Rule updated" });
    } catch (error) {
      console.error("Error updating rule: ", error);
      toast({ title: "Error updating rule", variant: 'destructive' });
    }
  };

  const handleRemoveRule = async (code: string) => {
    if (!scoringRuleSet) return;
    const updatedRules = scoringRuleSet.rules.filter(r => r.code !== code);
     try {
      await updateDoc(doc(db, "scoring_rules", scoringRuleSet.id), { rules: updatedRules });
      toast({ title: "Rule removed" });
    } catch (error) {
      console.error("Error removing rule: ", error);
      toast({ title: "Error removing rule", variant: 'destructive' });
    }
  };
  
    const handleCreateDefaultRuleSet = async () => {
        if (!leagueSettings) {
             toast({ title: "No league selected.", variant: 'destructive' });
            return;
        }
        try {
            const ruleSetRef = await addDoc(collection(db, 'scoring_rules'), {
                name: `${leagueSettings.name} Rules`,
                seasonId: leagueSettings.seasonId,
                rules: BB_RULES_DEFAULT, // Using the constant
                createdAt: new Date().toISOString(),
            });

            await updateDoc(doc(db, 'leagues', leagueSettings.id), {
                'settings.scoringRuleSetId': ruleSetRef.id
            });
            toast({ title: "Default rule set created successfully!" });
        } catch (error) {
            console.error("Error creating default rule set:", error);
            toast({ title: "Failed to create rule set", variant: 'destructive' });
        }
    };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, forContestant: Contestant) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setEditingContestant(forContestant);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropImage = async () => {
    if (croppedAreaPixels && imageSrc && editingContestant) {
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImageBase64) {
        try {
          // 1. Upload new image to storage
          const storageRef = ref(storage, `contestant-photos/${editingContestant.id}-${Date.now()}.jpg`);
          const snapshot = await uploadString(storageRef, croppedImageBase64, 'data_url');
          const downloadURL = await getDownloadURL(snapshot.ref);

          // 2. If there's an old photo, delete it
          if (editingContestant.photoUrl) {
            try {
                const oldPhotoRef = ref(storage, editingContestant.photoUrl);
                await deleteObject(oldPhotoRef);
            } catch (error: any) {
                // Ignore 'object-not-found' error if the old file doesn't exist
                if (error.code !== 'storage/object-not-found') {
                    console.error("Error deleting old photo: ", error);
                }
            }
          }
          
          // 3. Update contestant document with new photo URL
          const contestantRef = doc(db, 'contestants', editingContestant.id);
          await updateDoc(contestantRef, { photoUrl: downloadURL });

          toast({ title: "Photo updated successfully!" });
        } catch (error) {
          console.error("Error updating photo: ", error);
          toast({ title: "Error updating photo", variant: "destructive" });
        } finally {
            // 4. Reset state
            setImageSrc(null);
            setEditingContestant(null);
            setCroppedAreaPixels(null);
        }
      }
    }
  };
  
    const handleCreateLeague = async () => {
        if (!newLeagueData.name || !newLeagueData.seasonId || !currentUser) {
            toast({ title: "League Name and Season are required.", variant: 'destructive' });
            return;
        }
        try {
             // 1. Create the scoring rule set first
            const ruleSetRef = await addDoc(collection(db, 'scoring_rules'), {
                name: `${newLeagueData.name} Rules`,
                seasonId: newLeagueData.seasonId,
                rules: BB_RULES_DEFAULT,
                createdAt: new Date().toISOString(),
            });

            // 2. Then create the league with the new rule set ID
            const leagueData: Omit<League, 'id'> = {
                ...newLeagueData,
                name: newLeagueData.name,
                abbreviatedName: newLeagueData.name.substring(0, 3).toUpperCase(),
                show: 'Big Brother', // Or make dynamic
                seasonId: newLeagueData.seasonId,
                visibility: 'private',
                maxTeams: newLeagueData.maxTeams || 8,
                waivers: 'Standard',
                createdAt: new Date().toISOString(),
                adminUserIds: [currentUser.id],
                 contestantTerm: newLeagueData.contestantTerm || { singular: 'Contestant', plural: 'Contestants' },
                settings: {
                    allowMidSeasonDraft: false,
                    scoringRuleSetId: ruleSetRef.id,
                    transactionLockDuringEpisodes: true,
                    scoringBreakdownCategories: [],
                    draftRounds: newLeagueData.settings?.draftRounds || 4,
                }
            };
            const docRef = await addDoc(collection(db, 'leagues'), leagueData);
            toast({ title: "League created successfully!" });
            setIsNewLeagueDialogOpen(false);
            setNewLeagueData({ name: '', seasonId: '', maxTeams: 8, contestantTerm: { singular: 'Contestant', plural: 'Contestants' } });
        } catch (error) {
            console.error("Error creating league: ", error);
            toast({ title: "Error creating league", variant: 'destructive' });
        }
    };
    
    const handleCreateSeason = async () => {
        if (!newSeasonData.title || !newSeasonData.seasonNumber) {
            toast({ title: "Title and Season Number are required.", variant: 'destructive' });
            return;
        }
        try {
            const docRef = await addDoc(collection(db, 'seasons'), newSeasonData);
            toast({ title: "Season created successfully!" });
            setIsNewSeasonDialogOpen(false);
            setNewSeasonData({ franchise: 'Big Brother US', status: 'upcoming', currentWeek: 1, year: new Date().getFullYear() });
        } catch (error) {
            console.error("Error creating season: ", error);
            toast({ title: "Error creating season", variant: 'destructive' });
        }
    };
    
     const handleCreateContestant = async () => {
        if (!newContestantData.firstName || !newContestantData.lastName || !activeSeason) {
            toast({ title: "First and Last names are required.", variant: "destructive" });
            return;
        }
        try {
            const contestantData: Omit<Contestant, 'id'> = {
                seasonId: activeSeason.id,
                firstName: newContestantData.firstName,
                lastName: newContestantData.lastName,
                nickname: newContestantData.nickname || '',
                age: newContestantData.age || 0,
                hometown: newContestantData.hometown || 'Unknown',
                status: 'active',
                enteredDay: 1
            };
            await addDoc(collection(db, 'contestants'), contestantData);
            toast({ title: "Contestant added successfully!" });
            setIsNewContestantDialogOpen(false);
            setNewContestantData({ firstName: '', lastName: '', nickname: '', age: 25, hometown: '', status: 'active' });
        } catch (error) {
            console.error("Error adding contestant: ", error);
            toast({ title: "Error adding contestant", variant: "destructive" });
        }
    };

    const handleDeleteLeague = async () => {
        if (!leagueToDelete) return;
        try {
            // Note: This is a simple delete. For a real app, you'd want to delete
            // all associated teams, picks, etc. This might be better as a Firebase Function.
            await deleteDoc(doc(db, 'leagues', leagueToDelete.id));
            toast({ title: `League "${leagueToDelete.name}" deleted.` });
            setLeagueToDelete(null);
            if (selectedLeagueId === leagueToDelete.id) {
                setSelectedLeagueId(manageableLeagues.length > 0 ? manageableLeagues[0].id : null);
            }
        } catch (error) {
            console.error("Error deleting league: ", error);
            toast({ title: "Error deleting league", variant: 'destructive' });
        }
    };

    const handleDeleteSeason = async () => {
        if (!seasonToDelete) return;
        try {
            // You might want to add more complex logic here, like checking if any
            // leagues are using this season before deleting.
            await deleteDoc(doc(db, 'seasons', seasonToDelete.id));
            toast({ title: `Season "${seasonToDelete.title}" deleted.` });
            setSeasonToDelete(null);
        } catch (error) {
            console.error("Error deleting season: ", error);
            toast({ title: "Error deleting season", variant: 'destructive' });
        }
    };

    const handleDeleteContestant = async () => {
        if (!contestantToDelete) return;
        try {
            await deleteDoc(doc(db, 'contestants', contestantToDelete.id));
            toast({ title: `${getContestantDisplayName(contestantToDelete, 'full')} deleted.` });
            setContestantToDelete(null);
        } catch (error) {
            console.error("Error deleting contestant: ", error);
            toast({ title: "Error deleting contestant", variant: 'destructive' });
        }
    };
    
    const handleAddAdminToLeague = async (userId: string) => {
        if (!leagueToManageAdmins) return;
        try {
            const leagueRef = doc(db, 'leagues', leagueToManageAdmins.id);
            await updateDoc(leagueRef, {
                adminUserIds: arrayUnion(userId)
            });
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: 'league_admin' // Promote to league admin
            });
            toast({ title: "Admin added." });
        } catch (error) {
             console.error("Error adding admin: ", error);
            toast({ title: "Error adding admin", variant: 'destructive' });
        }
    };

    const handleRemoveAdminFromLeague = async (userId: string) => {
        if (!leagueToManageAdmins) return;
        try {
            const leagueRef = doc(db, 'leagues', leagueToManageAdmins.id);
            await updateDoc(leagueRef, {
                adminUserIds: arrayRemove(userId)
            });
            // Note: You might want to check if they admin other leagues before demoting them.
            // For simplicity, we won't do that here.
            toast({ title: "Admin removed." });
        } catch (error) {
             console.error("Error removing admin: ", error);
            toast({ title: "Error removing admin", variant: 'destructive' });
        }
    };
    
     const handleMakeDraftPick = async () => {
        if (!draftingTeam || !draftSelection || !selectedLeagueId || !nextPick) {
            toast({ title: "Missing required draft information.", variant: "destructive" });
            return;
        }
        try {
            const pickData: Omit<Pick, 'id'> = {
                leagueId: selectedLeagueId,
                teamId: draftingTeam.id,
                contestantId: draftSelection,
                round: nextPick.round,
                pick: nextPick.overall,
                createdAt: new Date().toISOString(),
            };
            await addDoc(collection(db, "picks"), pickData);
            toast({ title: `Pick #${nextPick.overall} successful!` });
            setDraftSelection('');
            setIsDraftDialogOpen(false);
        } catch (error) {
            console.error("Error making pick:", error);
            toast({ title: "Failed to make draft pick", variant: "destructive" });
        }
    };
    
    const handleSendInvite = async () => {
        if (!newUserData.displayName || !newUserData.email) {
            toast({ title: "Display Name and Email are required.", variant: "destructive" });
            return;
        }
        setIsSendingInvite(true);
        try {
            const usersRef = collection(db, 'users');
            await addDoc(usersRef, {
                email: newUserData.email,
                displayName: newUserData.displayName,
                role: 'player', // Default role for new users
                status: 'pending', // User is pending until they sign up
                createdAt: new Date().toISOString(),
            });
            
            toast({ title: "User Added!", description: `${newUserData.displayName} has been added with a pending status. Please send them a link to register.` });
            setIsNewUserDialogOpen(false);
            setNewUserData({ displayName: '', email: '' });
        } catch (error: any) {
            console.error("Error adding user: ", error);
            toast({ title: "Failed to Add User", description: error.message, variant: "destructive" });
        } finally {
            setIsSendingInvite(false);
        }
    };
    
    const handleSaveTeamChanges = async () => {
        if (!selectedLeagueId) return;

        const batch = writeBatch(db);
        let hasChanges = false;

        teamsInLeague.forEach(team => {
            const updates: Partial<Team> = {};
            const newName = teamNameEdits[team.id];
            const newDraftOrder = teamDraftOrderEdits[team.id];
            const newOwners = teamOwnerEdits[team.id];

            if (newName !== undefined && newName !== team.name) {
                updates.name = newName;
                hasChanges = true;
            }
            if (newDraftOrder !== undefined && newDraftOrder !== team.draftOrder) {
                updates.draftOrder = newDraftOrder;
                hasChanges = true;
            }
            if (newOwners !== undefined) {
                updates.ownerUserIds = newOwners;
                hasChanges = true;
            }

            if (Object.keys(updates).length > 0) {
                if (team.id.startsWith('temp-')) {
                    // This is a new team, so we create it
                    const newTeamRef = doc(collection(db, 'teams'));
                    batch.set(newTeamRef, {
                        ...updates,
                        name: newName || team.name,
                        draftOrder: newDraftOrder || team.draftOrder,
                        ownerUserIds: newOwners || [],
                        leagueId: selectedLeagueId,
                        createdAt: new Date().toISOString(),
                    });
                } else {
                    // This is an existing team, so we update it
                    const teamRef = doc(db, 'teams', team.id);
                    batch.update(teamRef, updates);
                }
            }
        });

        if (!hasChanges) {
            toast({ title: "No changes to save." });
            return;
        }

        try {
            await batch.commit();
            toast({ title: "Team changes saved successfully!" });
            setTeamNameEdits({});
            setTeamDraftOrderEdits({});
            setTeamOwnerEdits({});
        } catch (error) {
            console.error("Error saving team changes: ", error);
            toast({ title: "Error saving changes", variant: "destructive" });
        }
    };

    const handleToggleOwner = (team: Team, userId: string) => {
        const currentOwners = teamOwnerEdits[team.id] ?? team.ownerUserIds;
        const newOwners = currentOwners.includes(userId)
            ? currentOwners.filter(id => id !== userId)
            : [...currentOwners, userId];
        setTeamOwnerEdits(prev => ({ ...prev, [team.id]: newOwners }));
    };
    
    const handleSaveWeeklyStatusDisplay = async () => {
        if (!activeSeason) return;
        const seasonRef = doc(db, 'seasons', activeSeason.id);
        const weekKey = `week${viewingWeek}`;
        
        // Helper function to remove temporary _id recursively
        const removeTemporaryIds = (data: any[]): any[] => {
            return data.map(item => {
                const { _id, ...rest } = item;
                if (rest.followUp) {
                    rest.followUp = removeTemporaryIds([rest.followUp])[0];
                }
                return rest;
            });
        };

        const dataToSave = removeTemporaryIds(weeklyStatusDisplay);

        try {
            await updateDoc(seasonRef, {
                [`weeklyStatusDisplay.${weekKey}`]: dataToSave,
            });
            toast({ title: "Weekly display updated successfully!" });
        } catch (error) {
            console.error("Error updating weekly status display: ", error);
            toast({ title: "Failed to update display", variant: "destructive" });
        }
    };
    
    const handleAddStatusCard = () => {
        if (!newStatusCard.title || !newStatusCard.icon || !newStatusCard.ruleCode) {
            toast({ title: "Title, Icon and Rule are required.", variant: "destructive" });
            return;
        }
        const newCard: EditableSeasonWeeklyStatusDisplay = {
            order: weeklyStatusDisplay.length + 1,
            ...newStatusCard,
            _id: `${Date.now()}` // Add unique ID
        } as EditableSeasonWeeklyStatusDisplay;
        
        setWeeklyStatusDisplay([...weeklyStatusDisplay, newCard]);
        setNewStatusCard({ title: '', icon: 'Trophy', ruleCode: '', color: 'text-gray-500' });
        setIsAddStatusCardOpen(false);
    };

    const handleRemoveStatusCard = (_id: string) => {
        
        const removeItem = (items: EditableSeasonWeeklyStatusDisplay[]): EditableSeasonWeeklyStatusDisplay[] => {
            return items.filter(item => {
                if (item._id === _id) {
                    return false;
                }
                if (item.followUp) {
                    item.followUp = removeItem([item.followUp])[0];
                }
                return true;
            });
        };
        setWeeklyStatusDisplay(removeItem(weeklyStatusDisplay));
    };

    const handleStatusCardChange = (_id: string, field: keyof SeasonWeeklyStatusDisplay, value: any) => {
        const updateItem = (items: EditableSeasonWeeklyStatusDisplay[]): EditableSeasonWeeklyStatusDisplay[] => {
            return items.map(item => {
                if (item._id === _id) {
                    const updatedItem = { ...item, [field]: value };
                    
                    if (field === 'hasFollowUp') {
                        if (value && !updatedItem.followUp) {
                            updatedItem.followUp = {
                                _id: `${Date.now()}-followup`,
                                ruleCode: scoringRules[0]?.code || '',
                                title: 'Follow-up',
                                icon: 'ShieldCheck',
                                color: 'text-sky-500',
                                order: 1, // Order within follow-up context
                            };
                        } else if (!value) {
                           delete updatedItem.followUp;
                        }
                    }

                    return updatedItem;
                }
                if (item.followUp) {
                    return { ...item, followUp: updateItem([item.followUp])[0] };
                }
                return item;
            });
        };
        setWeeklyStatusDisplay(updateItem(weeklyStatusDisplay));
    };
    
    const handleStartNewWeek = async () => {
        if (!activeSeason) return;
        const newWeek = activeSeason.currentWeek + 1;
        try {
            await updateDoc(doc(db, 'seasons', activeSeason.id), {
                currentWeek: newWeek
            });
            toast({ title: `Started Week ${newWeek}` });
            setViewingWeek(newWeek);
        } catch(error) {
            console.error("Error starting new week:", error);
            toast({ title: "Error starting new week", variant: "destructive" });
        }
    };
    
    const handleDeleteWeekEvents = async () => {
        if (!activeSeason) return;
        setIsDeletingWeekEvents(true);
        try {
            const batch = writeBatch(db);
            weeklyCompetitions.forEach(comp => {
                batch.delete(doc(db, 'competitions', comp.id));
            });
            await batch.commit();
            toast({ title: `All events for Week ${viewingWeek} have been deleted.` });
        } catch (error) {
            console.error('Error deleting week events:', error);
            toast({ title: 'Error deleting events.', variant: 'destructive' });
        } finally {
            setIsDeletingWeekEvents(false);
        }
    };
    
    const handleDeleteCompetition = async () => {
        if (!competitionToDelete) return;
        try {
            await deleteDoc(doc(db, 'competitions', competitionToDelete.id));
            toast({ title: 'Event deleted successfully.' });
            setCompetitionToDelete(null);
        } catch (error) {
            console.error('Error deleting competition:', error);
            toast({ title: 'Error deleting event.', variant: 'destructive' });
        }
    };
    
    const handleLogSpecialEvent = async () => {
        if (!activeSeason || !newSpecialEventData.contestantId || !newSpecialEventData.ruleCode) {
            toast({ title: "Contestant and Event must be selected.", variant: "destructive" });
            return;
        }

        const dataToSave: Partial<Competition> & { seasonId: string; week: number; type: string; airDate: string; winnerId: string } = {
            seasonId: activeSeason.id,
            week: viewingWeek,
            type: newSpecialEventData.ruleCode,
            winnerId: newSpecialEventData.contestantId,
            airDate: new Date().toISOString(),
        };

        try {
            await addDoc(collection(db, 'competitions'), dataToSave);
            toast({ title: 'Special event logged successfully.' });
            setIsSpecialEventDialogOpen(false);
            setNewSpecialEventData({ contestantId: '', ruleCode: '' });
        } catch (error) {
            console.error("Error logging special event:", error);
            toast({ title: "Error logging special event.", variant: "destructive" });
        }
    };


    if (!currentUser) {
        return <div>Loading...</div>
    }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
           <Link href="/" className="flex items-center gap-2 font-semibold">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to App</span>
           </Link>
           <div className="ml-auto flex items-center gap-2">
             <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden md:inline-block">
                    {currentUser.displayName || currentUser.email}
                </span>
             </div>
             {currentUser.role === 'site_admin' && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                <Link href="/admin/data-model"><DatabaseZap className="h-4 w-4"/></Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Data Model</p>
                        </TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={activeTab === 'site' ? 'secondary' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setActiveTab('site')}>
                                <Shield className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Site Administration</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="sticky top-[57px] z-20 bg-background/95 py-2 backdrop-blur-sm border-b">
                    <div className="flex w-full items-center justify-between px-4 sm:px-6">
                        {manageableLeagues.length > 0 && activeTab !== 'site' && (
                             <TabsList>
                                <TabsTrigger value="events">Weekly Events</TabsTrigger>
                                <TabsTrigger value="teams">Teams &amp; Draft</TabsTrigger>
                                <TabsTrigger value="contestants">{leagueSettings?.contestantTerm?.plural || 'Contestants'}</TabsTrigger>
                                <TabsTrigger value="scoring">Scoring</TabsTrigger>
                                <TabsTrigger value="settings">League Settings</TabsTrigger>
                            </TabsList>
                        )}
                        <div className="flex-grow"></div>
                        {manageableLeagues.length > 1 && activeTab !== 'site' && (
                            <div className="w-64">
                                <Select value={selectedLeagueId || ''} onValueChange={setSelectedLeagueId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a league..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {manageableLeagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </div>

                {currentUser.role === 'site_admin' && (
                  <TabsContent value="site">
                    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                        <div className="flex justify-center gap-4 py-4">
                            <Button onClick={() => setIsNewUserDialogOpen(true)}><UserPlus className="mr-2"/> Add New User</Button>
                            <Button onClick={() => setIsNewSeasonDialogOpen(true)}><PlusCircle className="mr-2"/> Create Season</Button>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <div className="inline-block">
                                        <Button onClick={() => setIsNewLeagueDialogOpen(true)} disabled={seasons.length === 0}>
                                        <PlusCircle className="mr-2"/> New League
                                        </Button>
                                    </div>
                                    </TooltipTrigger>
                                    {seasons.length === 0 && (
                                    <TooltipContent>
                                        <p>You must create a season before creating a league.</p>
                                    </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Seasons</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Season</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Year</TableHead>
                                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedSeasons.map(season => (
                                                <TableRow key={season.id}>
                                                    <TableCell>{season.title}</TableCell>
                                                    <TableCell>{season.seasonNumber}</TableCell>
                                                    <TableCell><Badge variant={season.status === 'in_progress' ? 'default' : 'outline'}>{season.status}</Badge></TableCell>
                                                    <TableCell>{season.year}</TableCell>
                                                    <TableCell>
                                                      <DropdownMenu>
                                                          <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                          </DropdownMenuTrigger>
                                                          <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => setEditingSeason(season)}>Edit</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-500" onClick={() => setSeasonToDelete(season)}>Delete Season</DropdownMenuItem>
                                                          </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                                {totalSeasonPages > 1 && (
                                <CardFooter className="justify-between">
                                    <span className="text-xs text-muted-foreground">Showing {paginatedSeasons.length} of {sortedSeasons.length} seasons</span>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="outline" onClick={() => setSeasonsCurrentPage(p => Math.max(1, p - 1))} disabled={seasonsCurrentPage === 1}><ChevronLeftIcon /> Prev</Button>
                                        <Button size="sm" variant="outline" onClick={() => setSeasonsCurrentPage(p => Math.min(totalSeasonPages, p + 1))} disabled={seasonsCurrentPage === totalSeasonPages}>Next <ChevronRightIcon /></Button>
                                    </div>
                                </CardFooter>
                                )}
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Leagues</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Season</TableHead>
                                                <TableHead>Teams</TableHead>
                                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedLeagues.map(league => {
                                                const season = seasons.find(s => s.id === league.seasonId);
                                                const teamCount = allTeams.filter(t => t.leagueId === league.id).length;
                                                return (
                                                <TableRow key={league.id}>
                                                    <TableCell>{league.name}</TableCell>
                                                    <TableCell>{season?.title || 'N/A'}</TableCell>
                                                    <TableCell>{teamCount} / {league.maxTeams}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                          <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                          </DropdownMenuTrigger>
                                                          <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => { setActiveTab('settings'); setSelectedLeagueId(league.id); }}>Go to Settings</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-500" onClick={() => setLeagueToDelete(league)}>Delete League</DropdownMenuItem>
                                                          </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            )})}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                                {totalLeaguePages > 1 && (
                                <CardFooter className="justify-between">
                                    <span className="text-xs text-muted-foreground">Showing {paginatedLeagues.length} of {sortedLeagues.length} leagues</span>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="outline" onClick={() => setLeaguesCurrentPage(p => Math.max(1, p - 1))} disabled={leaguesCurrentPage === 1}><ChevronLeftIcon /> Prev</Button>
                                        <Button size="sm" variant="outline" onClick={() => setLeaguesCurrentPage(p => Math.min(totalLeaguePages, p + 1))} disabled={leaguesCurrentPage === totalLeaguePages}>Next <ChevronRightIcon /></Button>
                                    </div>
                                </CardFooter>
                                )}
                            </Card>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Global Users</CardTitle>
                                <div className="relative mt-2">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search users..." 
                                        className="pl-8" 
                                        value={userSearchTerm}
                                        onChange={(e) => {
                                            setUserSearchTerm(e.target.value);
                                            setUserCurrentPage(1);
                                        }}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Display Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>{user.displayName}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                                                <TableCell><Badge variant={user.status === 'active' ? 'default' : 'outline'}>{user.status}</Badge></TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent>
                                                        <DropdownMenuItem>Send Password Reset</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setEditingUser(user)}>Edit User</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-500" onClick={() => setUserToDelete(user)}>Delete User</DropdownMenuItem>
                                                      </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <CardFooter className="justify-between">
                                <span className="text-xs text-muted-foreground">Showing {paginatedUsers.length} of {filteredUsers.length} users</span>
                                <div className="flex gap-1">
                                    <Button size="sm" variant="outline" onClick={() => setUserCurrentPage(p => Math.max(1, p - 1))} disabled={userCurrentPage === 1}><ChevronLeftIcon /> Prev</Button>
                                    <Button size="sm" variant="outline" onClick={() => setUserCurrentPage(p => Math.min(totalUserPages, p + 1))} disabled={userCurrentPage === totalUserPages}>Next <ChevronRightIcon /></Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                  </TabsContent>
                )}
                
                <TabsContent value="events">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Log & Customize Weekly Events</CardTitle>
                                <CardDescription>Log events for Week {viewingWeek} and customize how they appear on the dashboard.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {weeklyStatusCards.map((card) => (
                                     <EventEditorCard
                                        key={card._id}
                                        card={card}
                                        onUpdate={handleStatusCardChange}
                                        onRemove={handleRemoveStatusCard}
                                        scoringRules={scoringRules}
                                        contestantList={allSeasonContestants}
                                        weeklyEventData={weeklyEventData}
                                        handleEventChange={handleEventChange}
                                        handleLogEvent={handleLogEvent}
                                    />
                                ))}
                                <div className="flex gap-2 mt-4">
                                    <Button onClick={() => setIsAddStatusCardOpen(true)} size="sm" variant="outline"><PlusCircle className="mr-2"/> Add Event Card</Button>
                                    <Button onClick={handleSaveWeeklyStatusDisplay} size="sm"><Save className="mr-2"/> Save Display Settings</Button>
                                </div>
                            </CardContent>
                             <CardFooter className="flex items-center justify-center gap-4 border-t pt-6">
                                <Button variant="outline" size="icon" onClick={() => setViewingWeek(w => Math.max(1, w - 1))} disabled={viewingWeek === 1}>
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </Button>
                                <span className="font-medium">Week {viewingWeek}</span>
                                <Button variant="outline" size="icon" onClick={() => setViewingWeek(w => Math.min(activeSeason?.currentWeek || 1, w + 1))} disabled={viewingWeek === activeSeason?.currentWeek}>
                                    <ChevronRightIcon className="h-4 w-4" />
                                </Button>
                                {viewingWeek === activeSeason?.currentWeek && (
                                     <Button onClick={handleStartNewWeek}><PlusCircle className="mr-2"/> Start Next Week</Button>
                                )}
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={weeklyCompetitions.length === 0}>
                                            <Trash2 className="mr-2"/> Clear Week {viewingWeek} Events
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete all logged events for Week {viewingWeek}. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteWeekEvents} disabled={isDeletingWeekEvents}>
                                                {isDeletingWeekEvents && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                Delete Events
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                        
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Logged Scoring Events</CardTitle>
                                    <CardDescription>Events logged for Week {viewingWeek}.</CardDescription>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setIsSpecialEventDialogOpen(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Log Special Event
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {weeklyCompetitions.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Event</TableHead>
                                                <TableHead>Player(s)</TableHead>
                                                <TableHead className="text-right">Points</TableHead>
                                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {weeklyCompetitions.map(comp => {
                                                const rule = scoringRules.find(r => r.code === comp.type);
                                                let players: (Contestant | undefined)[] = [];
                                                if (comp.winnerId) players.push(contestants.find(c => c.id === comp.winnerId));
                                                if (comp.evictedId) players.push(contestants.find(c => c.id === comp.evictedId));
                                                if (comp.nominees) players = comp.nominees.map(id => contestants.find(c => c.id === id));

                                                return (
                                                    <TableRow key={comp.id}>
                                                        <TableCell>{rule?.label || comp.type}</TableCell>
                                                        <TableCell>
                                                            {players.map(p => p ? getContestantDisplayName(p, 'short') : '...').join(', ')}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-bold">
                                                            {rule?.points}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCompetitionToDelete(comp)}>
                                                                <Trash2 className="h-4 w-4 text-red-500"/>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No events logged for this week.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                 </TabsContent>

                 <TabsContent value="teams">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Team Settings</CardTitle>
                             <Button size="sm" onClick={handleSaveTeamChanges}><Save className="mr-2"/> Save Changes</Button>
                          </CardHeader>
                          <CardContent>
                              <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Draft #</TableHead>
                                        <TableHead>Team Name</TableHead>
                                        <TableHead>Owners</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamsInLeague.map(team => (
                                        <TableRow key={team.id}>
                                            <TableCell>
                                                <Input 
                                                    type="number"
                                                    value={teamDraftOrderEdits[team.id] ?? team.draftOrder}
                                                    onChange={(e) => setTeamDraftOrderEdits(prev => ({ ...prev, [team.id]: Number(e.target.value) }))}
                                                    className="h-8 w-16 text-center"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    value={teamNameEdits[team.id] ?? team.name}
                                                    onChange={(e) => setTeamNameEdits(prev => ({ ...prev, [team.id]: e.target.value }))}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" onClick={() => { setTeamToManageOwners(team); setIsManageOwnersDialogOpen(true); }}>
                                                    Manage ({teamOwnerEdits[team.id]?.length ?? team.ownerUserIds.length})
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="lg:col-span-2">
                        <Card>
                           <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Draft Board</CardTitle>
                            {nextPick && (
                                <div className="text-right">
                                    <p className="text-sm font-medium">Up Now: <span className="text-primary">{nextPick.team.name}</span></p>
                                    <p className="text-xs text-muted-foreground">Pick {nextPick.overall} (R{nextPick.round}, P{nextPick.pick})</p>
                                </div>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                               {draftOrder.map((pickInfo, index) => {
                                   const pick = picks.find(p => p.leagueId === selectedLeagueId && p.pick === pickInfo.overall);
                                   const contestant = contestants.find(c => c.id === pick?.contestantId);
                                   const isNextPick = !pick && index === picks.filter(p => p.leagueId === selectedLeagueId).length;

                                   return (
                                        <div key={pickInfo.overall} 
                                             className={cn("p-2 rounded-md border text-center",
                                                isNextPick && "bg-primary/10 border-primary animate-pulse"
                                             )}>
                                            <p className="text-xs text-muted-foreground">Pick {pickInfo.overall}</p>
                                            <p className="text-sm font-medium truncate">{pickInfo.team.name}</p>
                                            {contestant ? (
                                                <div className="flex items-center justify-center gap-1 mt-1">
                                                    <Image src={contestant.photoUrl || "https://placehold.co/100x100.png"} alt="" width={16} height={16} className="rounded-full" data-ai-hint="portrait person" />
                                                    <span className="text-xs">{getContestantDisplayName(contestant, 'short')}</span>
                                                </div>
                                            ) : (
                                                 <Button variant={isNextPick ? 'default' : 'outline'} size="sm" className="mt-1 h-6 text-xs" onClick={() => { setDraftingTeam(pickInfo.team); setIsDraftDialogOpen(true)}}>
                                                    Make Pick
                                                 </Button>
                                            )}
                                        </div>
                                   )
                               })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                 </TabsContent>
                 
                 <TabsContent value="contestants">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{activeSeason?.title} {leagueSettings?.contestantTerm?.plural || 'Contestants'}</CardTitle>
                            <Button size="sm" onClick={() => setIsNewContestantDialogOpen(true)}><PlusCircle className="mr-2"/> Add {leagueSettings?.contestantTerm?.singular || 'Contestant'}</Button>
                        </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {activeContestants.map(hg => (
                                <div key={hg.id} className="p-2 border rounded-lg flex items-center gap-3">
                                    <div className="relative">
                                        <Image src={hg.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(hg, 'full')} width={48} height={48} className="rounded-full" data-ai-hint="portrait person" />
                                        <label htmlFor={`photo-upload-${hg.id}`} className="absolute -bottom-1 -right-1 cursor-pointer bg-muted p-1 rounded-full border">
                                          <Upload className="h-3 w-3" />
                                          <input id={`photo-upload-${hg.id}`} type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileChange(e, hg)} />
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{getContestantDisplayName(hg, 'full')}</p>
                                        <p className="text-xs text-muted-foreground">{hg.hometown}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal/></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>Mark Evicted</DropdownMenuItem>
                                            <DropdownMenuItem>Mark Jury</DropdownMenuItem>
                                            <DropdownMenuItem>Mark Winner</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setEditingContestant(hg)}>Edit Details</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-500" onClick={() => setContestantToDelete(hg)}>Delete Contestant</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                        {inactiveContestants.length > 0 && (
                             <>
                                <Separator className="my-6"/>
                                <h3 className="text-lg font-medium mb-4">Inactive/Evicted</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {inactiveContestants.map(hg => (
                                        <div key={hg.id} className="p-2 border rounded-lg flex items-center gap-3 bg-muted/50">
                                            <Image src={hg.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(hg, 'full')} width={48} height={48} className="rounded-full grayscale" data-ai-hint="portrait person" />
                                            <div className="flex-1">
                                                <p className="font-medium">{getContestantDisplayName(hg, 'full')}</p>
                                                <p className="text-xs text-muted-foreground">{hg.hometown}</p>
                                            </div>
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal/></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>Mark Active</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </div>
                             </>
                        )}
                      </CardContent>
                    </Card>
                 </TabsContent>
                 
                 <TabsContent value="scoring">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>{scoringRuleSet?.name || 'Scoring Rules'}</CardTitle>
                                <div className="flex items-center gap-2">
                                   <Button size="sm" onClick={() => setIsAddRuleDialogOpen(true)}><PlusCircle className="mr-2"/> Add Rule</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {scoringRuleSet ? (
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Label</TableHead>
                                            <TableHead className="text-right">Points</TableHead>
                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {scoringRules.map((rule, index) => (
                                           <RuleRow 
                                                key={rule.code} 
                                                rule={rule} 
                                                index={index}
                                                onUpdate={handleUpdateRule}
                                                onRemove={handleRemoveRule}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground mb-4">No scoring rule set is configured for this league.</p>
                                        <Button onClick={handleCreateDefaultRuleSet}>
                                            <PlusCircle className="mr-2" /> Create Default Rule Set
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Scoring Breakdown Categories</CardTitle>
                                <CardDescription>Define categories for the scoring breakdown on the Teams page.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {editingBreakdownCategories.map((category, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                                                    {createElement((LucideIcons as any)[category.icon], { className: cn("h-4 w-4", category.color) })}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-2">
                                                <div className="grid grid-cols-5 gap-1">
                                                    {iconSelection.map(icon => (
                                                        <Button key={icon} variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleBreakdownChange(index, 'icon', icon)}>
                                                            {createElement((LucideIcons as any)[icon], { className: "h-4 w-4" })}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                 <div className={cn("h-6 w-6 shrink-0 rounded-full cursor-pointer border", (category.color || '').replace('text-', 'bg-'))} />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-2">
                                                <div className="grid grid-cols-6 gap-1">
                                                    {colorSelection.map(color => (
                                                        <div key={color} className={cn("h-6 w-6 rounded-full cursor-pointer", color)} onClick={() => handleBreakdownChange(index, 'color', color.replace('bg-', 'text-'))} />
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <Input 
                                            placeholder="Display Name" 
                                            value={category.displayName} 
                                            onChange={(e) => handleBreakdownChange(index, 'displayName', e.target.value)}
                                            className="h-8"
                                        />
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="h-8 text-xs shrink-0">Rules ({category.ruleCodes.length})</Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-2">
                                                <div className="space-y-2">
                                                    {scoringRules.map(rule => (
                                                        <div key={rule.code} className="flex items-center space-x-2">
                                                            <Checkbox 
                                                                id={`${index}-${rule.code}`}
                                                                checked={category.ruleCodes.includes(rule.code)}
                                                                onCheckedChange={(checked) => {
                                                                    const newCodes = checked 
                                                                        ? [...category.ruleCodes, rule.code]
                                                                        : category.ruleCodes.filter(c => c !== rule.code);
                                                                    handleBreakdownChange(index, 'ruleCodes', newCodes);
                                                                }}
                                                            />
                                                            <label htmlFor={`${index}-${rule.code}`} className="text-sm">{rule.label}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleRemoveBreakdownCategory(index)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <Button onClick={handleAddBreakdownCategory} size="sm" variant="outline" disabled={editingBreakdownCategories.length >= 6}>
                                        <PlusCircle className="mr-2" /> Add Category
                                    </Button>
                                     <Button onClick={handleUpdateBreakdownCategories} size="sm"><Save className="mr-2"/> Save Breakdown</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                 </TabsContent>

                 <TabsContent value="settings">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>League Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label>League Name</Label>
                                <Input 
                                    value={editingLeagueDetails?.name || ''} 
                                    onChange={(e) => setEditingLeagueDetails(prev => ({...prev, name: e.target.value}))}
                                />
                            </div>
                             <div className="space-y-1">
                                <Label>Season</Label>
                                <Select 
                                    value={editingLeagueDetails?.seasonId}
                                    onValueChange={(val) => setEditingLeagueDetails(prev => ({...prev, seasonId: val}))}
                                >
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <Label>Number of Teams</Label>
                                    <Input 
                                        type="number" 
                                        value={editingLeagueDetails?.maxTeams || 0}
                                        onChange={(e) => setEditingLeagueDetails(prev => ({...prev, maxTeams: Number(e.target.value)}))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Draft Rounds</Label>
                                    <Input 
                                        type="number" 
                                        value={editingLeagueDetails?.settings?.draftRounds || 0}
                                        onChange={(e) => setEditingLeagueDetails(prev => ({...prev, settings: {...prev?.settings, draftRounds: Number(e.target.value)} }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                    <Label>Jury Start Week</Label>
                                    <Input 
                                        type="number" 
                                        value={editingLeagueDetails?.settings?.juryStartWeek || ''}
                                        onChange={(e) => setEditingLeagueDetails(prev => ({...prev, settings: {...prev?.settings, juryStartWeek: Number(e.target.value)} }))}
                                    />
                                </div>
                                 <div className="space-y-1">
                                    <Label>End Week</Label>
                                    <Input 
                                        type="number" 
                                        value={editingLeagueDetails?.settings?.endWeek || ''}
                                        onChange={(e) => setEditingLeagueDetails(prev => ({...prev, settings: {...prev?.settings, endWeek: Number(e.target.value)} }))}
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Participant Term (Singular)</Label>
                                    <Input 
                                        value={editingLeagueDetails?.contestantTerm?.singular || ''} 
                                        onChange={e => setEditingLeagueDetails(prev => ({ ...prev, contestantTerm: { ...prev?.contestantTerm!, singular: e.target.value } }))}
                                    />
                                </div>
                                 <div className="space-y-1">
                                    <Label>Participant Term (Plural)</Label>
                                    <Input 
                                        value={editingLeagueDetails?.contestantTerm?.plural || ''} 
                                        onChange={e => setEditingLeagueDetails(prev => ({ ...prev, contestantTerm: { ...prev?.contestantTerm!, plural: e.target.value } }))}
                                    />
                                </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                              <Button onClick={handleUpdateLeagueDetails}>Save Changes</Button>
                          </CardFooter>
                        </Card>
                        <Card>
                           <CardHeader className="flex flex-row items-center justify-between">
                             <CardTitle>League Admins</CardTitle>
                             <Button size="sm" variant="outline" onClick={() => { setIsManageAdminsDialogOpen(true); setLeagueToManageAdmins(leagueSettings || null); }}><UserCog className="mr-2"/> Manage</Button>
                           </CardHeader>
                           <CardContent>
                             <div className="space-y-2">
                                {leagueSettings?.adminUserIds?.map(userId => {
                                    const admin = users.find(u => u.id === userId);
                                    return (
                                        <div key={userId} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                            <Avatar>
                                                <AvatarImage src={admin?.photoURL || ''} />
                                                <AvatarFallback>{admin?.displayName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{admin?.displayName}</p>
                                                <p className="text-xs text-muted-foreground">{admin?.email}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                           </CardContent>
                        </Card>
                    </div>
                 </TabsContent>
            </Tabs>
        </main>
      </div>
       
        {/* Dialog for New User Invite */}
        <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        A user record will be created with a 'pending' status. They will need to complete registration via an email invite.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="display-name">Display Name</Label>
                        <Input
                            id="display-name"
                            value={newUserData.displayName}
                            onChange={(e) => setNewUserData({ ...newUserData, displayName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSendInvite} disabled={isSendingInvite}>
                        {isSendingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

       {/* Dialog for New Season */}
        <Dialog open={isNewSeasonDialogOpen} onOpenChange={setIsNewSeasonDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Season</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={newSeasonData.title || ''} onChange={e => setNewSeasonData({ ...newSeasonData, title: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Season Number</Label>
                            <Input type="number" value={newSeasonData.seasonNumber || ''} onChange={e => setNewSeasonData({ ...newSeasonData, seasonNumber: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input type="number" value={newSeasonData.year || ''} onChange={e => setNewSeasonData({ ...newSeasonData, year: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewSeasonDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateSeason}>Create Season</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      
        {/* Dialog for New League */}
        <Dialog open={isNewLeagueDialogOpen} onOpenChange={setIsNewLeagueDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New League</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>League Name</Label>
                        <Input value={newLeagueData.name || ''} onChange={e => setNewLeagueData({ ...newLeagueData, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Season</Label>
                        <Select value={newLeagueData.seasonId} onValueChange={val => setNewLeagueData({...newLeagueData, seasonId: val})}>
                            <SelectTrigger><SelectValue placeholder="Select a season..."/></SelectTrigger>
                            <SelectContent>
                                {seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Participant Term (Singular)</Label>
                            <Input value={newLeagueData.contestantTerm?.singular || ''} onChange={e => setNewLeagueData(prev => ({ ...prev, contestantTerm: { ...prev.contestantTerm!, singular: e.target.value } }))} placeholder="e.g., Houseguest"/>
                        </div>
                         <div className="space-y-2">
                            <Label>Participant Term (Plural)</Label>
                            <Input value={newLeagueData.contestantTerm?.plural || ''} onChange={e => setNewLeagueData(prev => ({ ...prev, contestantTerm: { ...prev.contestantTerm!, plural: e.target.value } }))} placeholder="e.g., Houseguests"/>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewLeagueDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateLeague}>Create League</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Dialog for Edit Season */}
        <Dialog open={!!editingSeason} onOpenChange={(open) => !open && setEditingSeason(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Season: {editingSeason?.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input 
                            value={editingSeason?.title || ''} 
                            onChange={e => setEditingSeason(prev => prev ? { ...prev, title: e.target.value } : null)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Season Number</Label>
                            <Input 
                                type="number" 
                                value={editingSeason?.seasonNumber || ''} 
                                onChange={e => setEditingSeason(prev => prev ? { ...prev, seasonNumber: Number(e.target.value) } : null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input 
                                type="number" 
                                value={editingSeason?.year || ''}
                                onChange={e => setEditingSeason(prev => prev ? { ...prev, year: Number(e.target.value) } : null)}
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                            value={editingSeason?.status} 
                            onValueChange={(val: 'in_progress' | 'completed' | 'upcoming') => setEditingSeason(prev => prev ? { ...prev, status: val } : null)}
                        >
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingSeason(null)}>Cancel</Button>
                    <Button onClick={handleUpdateSeason}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Dialog to add new contestant */}
        <Dialog open={isNewContestantDialogOpen} onOpenChange={setIsNewContestantDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New {leagueSettings?.contestantTerm?.singular || 'Contestant'}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={newContestantData.firstName} onChange={(e) => setNewContestantData(prev => ({...prev, firstName: e.target.value}))} />
                    </div>
                     <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={newContestantData.lastName} onChange={(e) => setNewContestantData(prev => ({...prev, lastName: e.target.value}))} />
                    </div>
                     <div className="col-span-2 space-y-2">
                        <Label>Nickname</Label>
                        <Input value={newContestantData.nickname} onChange={(e) => setNewContestantData(prev => ({...prev, nickname: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Age</Label>
                        <Input type="number" value={newContestantData.age} onChange={(e) => setNewContestantData(prev => ({...prev, age: Number(e.target.value)}))} />
                    </div>
                     <div className="space-y-2">
                        <Label>Hometown</Label>
                        <Input value={newContestantData.hometown} onChange={(e) => setNewContestantData(prev => ({...prev, hometown: e.target.value}))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewContestantDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateContestant}>Add {leagueSettings?.contestantTerm?.singular || 'Contestant'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>


        {/* Dialog to Manage Admins */}
        <Dialog open={isManageAdminsDialogOpen} onOpenChange={setIsManageAdminsDialogOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Admins for {leagueToManageAdmins?.name}</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <Input placeholder="Search users to add..."/>
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                        {users.map(user => {
                            const isAdmin = leagueToManageAdmins?.adminUserIds?.includes(user.id);
                            return (
                                <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.photoURL || ''} />
                                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{user.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    {isAdmin ? (
                                        <Button variant="destructive" size="sm" onClick={() => handleRemoveAdminFromLeague(user.id)}>Remove</Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => handleAddAdminToLeague(user.id)}>Add</Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        
        {/* Dialog to Manage Team Owners */}
        <Dialog open={isManageOwnersDialogOpen} onOpenChange={(open) => { if(!open) setTeamToManageOwners(null); setIsManageOwnersDialogOpen(open); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Owners for {teamToManageOwners?.name}</DialogTitle>
                </DialogHeader>
                 <div className="py-2">
                    <Input placeholder="Search users..."/>
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                        {users.map(user => {
                            if (!teamToManageOwners) return null;
                            const isOwner = (teamOwnerEdits[teamToManageOwners.id] ?? teamToManageOwners.ownerUserIds).includes(user.id);
                            return (
                                <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                     <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.photoURL || ''} />
                                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{user.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <Checkbox
                                        checked={isOwner}
                                        onCheckedChange={() => handleToggleOwner(teamToManageOwners, user.id)}
                                    />
                                </div>
                            )
                        })}
                    </div>
                 </div>
                 <DialogFooter>
                    <Button onClick={() => setIsManageOwnersDialogOpen(false)}>Done</Button>
                 </DialogFooter>
            </DialogContent>
        </Dialog>
        
         {/* Dialog to add new Status Card */}
        <Dialog open={isAddStatusCardOpen} onOpenChange={setIsAddStatusCardOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Status Card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={newStatusCard.title || ''} onChange={e => setNewStatusCard(prev => ({ ...prev, title: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Scoring Rule</Label>
                        <Select value={newStatusCard.ruleCode} onValueChange={(val) => setNewStatusCard(prev => ({...prev, ruleCode: val}))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {scoringRules.map(rule => <SelectItem key={rule.code} value={rule.code}>{rule.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <Select value={newStatusCard.icon} onValueChange={(val: string) => setNewStatusCard(prev => ({...prev, icon: val}))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {iconSelection.map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddStatusCardOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddStatusCard}>Add Card</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Dialog to Log Special Event */}
        <Dialog open={isSpecialEventDialogOpen} onOpenChange={setIsSpecialEventDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Special Event</DialogTitle>
                    <DialogDescription>Log a one-off scoring event for any contestant.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Contestant</Label>
                        <Select value={newSpecialEventData.contestantId} onValueChange={(val) => setNewSpecialEventData(prev => ({...prev, contestantId: val}))}>
                            <SelectTrigger><SelectValue placeholder="Select a contestant..."/></SelectTrigger>
                            <SelectContent>
                                {activeContestants.map(c => <SelectItem key={c.id} value={c.id}>{getContestantDisplayName(c, 'full')}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Scoring Rule</Label>
                        <Select value={newSpecialEventData.ruleCode} onValueChange={(val) => setNewSpecialEventData(prev => ({...prev, ruleCode: val}))}>
                            <SelectTrigger><SelectValue placeholder="Select a rule..."/></SelectTrigger>
                            <SelectContent>
                                {scoringRules.map(rule => <SelectItem key={rule.code} value={rule.code}>{rule.label} ({rule.points})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSpecialEventDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleLogSpecialEvent}>Log Event</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
      {/* Dialog for Add Rule */}
      <AddRuleDialog 
        open={isAddRuleDialogOpen} 
        onOpenChange={setIsAddRuleDialogOpen}
        onAddRule={handleAddRule}
      />
      
      {/* Dialog for Make Draft Pick */}
       <Dialog open={isDraftDialogOpen} onOpenChange={setIsDraftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Pick for {draftingTeam?.name}</DialogTitle>
             {nextPick && <DialogDescription>Pick {nextPick.overall} (Round {nextPick.round}, Pick {nextPick.pick})</DialogDescription>}
          </DialogHeader>
            <Select value={draftSelection} onValueChange={setDraftSelection}>
                <SelectTrigger className="mt-4"><SelectValue placeholder="Select a contestant..." /></SelectTrigger>
                <SelectContent>
                    {draftableContestants.map(c => (
                        <SelectItem key={c.id} value={c.id}>{getContestantDisplayName(c, 'full')}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDraftDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMakeDraftPick} disabled={!draftSelection}>Confirm Pick</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


        {/* Image Cropping Dialog */}
        <Dialog open={!!imageSrc} onOpenChange={(open) => !open && setImageSrc(null)}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Crop Photo for {getContestantDisplayName(editingContestant!, 'full')}</DialogTitle>
                </DialogHeader>
                <div className="relative h-64 w-full bg-muted">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                            cropShape="round"
                        />
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <Label>Zoom</Label>
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(val) => setZoom(val[0])}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setImageSrc(null)}>Cancel</Button>
                    <Button onClick={handleCropImage}>Save Photo</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialogs */}
        <AlertDialog open={!!leagueToDelete} onOpenChange={(open) => !open && setLeagueToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the <strong>{leagueToDelete?.name}</strong> league and all of its associated data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteLeague} className="bg-red-600 hover:bg-red-700">Delete League</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!seasonToDelete} onOpenChange={(open) => !open && setSeasonToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {seasonToDelete?.title}?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete the season. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSeason} className="bg-red-600 hover:bg-red-700">Delete Season</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {userToDelete?.displayName}?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete the user and remove their access.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700">Delete User</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!contestantToDelete} onOpenChange={(open) => !open && setContestantToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {getContestantDisplayName(contestantToDelete, 'full')}?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently remove the contestant from the season.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteContestant} className="bg-red-600 hover:bg-red-700">Delete Contestant</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!competitionToDelete} onOpenChange={(open) => !open && setCompetitionToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete this logged event.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCompetition} className="bg-red-600 hover:bg-red-700">Delete Event</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}

export default withAuth(AdminPage, ['site_admin', 'league_admin']);
