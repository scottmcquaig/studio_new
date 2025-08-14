
"use client";

import { useState, useEffect, createElement, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users, Pencil, CalendarClock, Crown, Shield, UserX, UserCheck, Save, PlusCircle, Trash2, ShieldCheck, UserCog, Upload, UserSquare, Mail, KeyRound, User, Lock, Building, MessageSquareQuote, ListChecks, RotateCcw, ArrowLeft, MoreHorizontal, Send, MailQuestion, UserPlus2, SortAsc, ShieldQuestion, ChevronsUpDown, Plus, BookCopy, Palette, Smile, Trophy, Star, TrendingUp, TrendingDown, Swords, Handshake, Angry, GripVertical, Home, Ban, Gem, Gift, HeartPulse, Medal, DollarSign, Rocket, Cctv, Skull, CloudSun, XCircle, ShieldPlus } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { MOCK_SEASONS } from "@/lib/data";
import type { User as UserType, Team, UserRole, Contestant, Competition, League, ScoringRule, UserStatus, Season, ScoringRuleSet, LeagueScoringBreakdownCategory } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn, getContestantDisplayName, getCroppedImg } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { app } from '@/lib/firebase';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, query, getDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import Cropper, { Area } from 'react-easy-crop';
import { Slider } from '@/components/ui/slider';


const iconSelection = [
    'Crown', 'Ban', 'Gem', 'Gift', 'HeartPulse', 'KeyRound', 'ShieldPlus', 'Trophy',
    'Medal', 'DollarSign', 'Rocket', 'Cctv', 'Save', 'Skull', 'CloudSun', 'XCircle'
] as const;

const colorSelection = [
    'bg-gray-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500',
    'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500'
];

const specialEventRuleCodes = ['SAVED', 'POWER', 'PUNISH', 'PENALTY_RULE', 'SPECIAL_POWER'];


// Component to manage a single rule row, preventing input focus loss
const RuleRow = ({ rule, index, onUpdate, onRemove }: { rule: ScoringRule, index: number, onUpdate: (index: number, field: keyof ScoringRule, value: string | number) => void, onRemove: (code: string) => void }) => {
    const [localRule, setLocalRule] = useState(rule);

    useEffect(() => {
        setLocalRule(rule);
    }, [rule]);

    const handleChange = (field: keyof ScoringRule, value: string | number) => {
        setLocalRule(prev => ({ ...prev, [field]: value }));
    };

    const handleBlur = (field: keyof ScoringRule) => {
        onUpdate(index, field, localRule[field]);
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


export default function AdminPage() {
  const { toast } = useToast();
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  const [leagueSettings, setLeagueSettings] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  const [activeSeason, setActiveSeason] = useState<Season | null>(MOCK_SEASONS[0]);

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [scoringRuleSet, setScoringRuleSet] = useState<ScoringRuleSet | null>(null);
  
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [contestantToDelete, setContestantToDelete] = useState<Contestant | null>(null);
  
  const [selectedWeek, setSelectedWeek] = useState(activeSeason?.currentWeek || 1);
  const [isSpecialEventDialogOpen, setIsSpecialEventDialogOpen] = useState(false);
  
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isAddUserToLeagueDialogOpen, setIsAddUserToLeagueDialogOpen] = useState(false);

  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [draftingTeam, setDraftingTeam] = useState<Team | null>(null);
  const [draftSelection, setDraftSelection] = useState<string>('');


  const [newUserData, setNewUserData] = useState({ displayName: '', email: ''});
  const [addUserToLeagueData, setAddUserToLeagueData] = useState({ userId: '', teamId: '' });
  const [newRuleData, setNewRuleData] = useState<ScoringRule>({ code: '', label: '', points: 0 });
  const [specialEventData, setSpecialEventData] = useState({ contestantId: '', ruleCode: '', notes: '', eventDate: new Date() });
  
  const [teamNames, setTeamNames] = useState<{[id: string]: string}>({});

  const [teamDraftOrders, setTeamDraftOrders] = useState<{[id: string]: number}>({});

  const [activeTab, setActiveTab] = useState('scoring');

  // State for weekly event management
  const [hohWinnerId, setHohWinnerId] = useState<string | undefined>();
  const [hohDate, setHohDate] = useState(new Date());
  const [nominees, setNominees] = useState<string[]>(['', '']);
  const [nomsDate, setNomsDate] = useState(new Date());
  const [vetoWinnerId, setVetoWinnerId] = useState<string | undefined>();
  const [vetoDate, setVetoDate] = useState(new Date());
  const [vetoUsed, setVetoUsed] = useState(false);
  const [vetoUsedOnId, setVetoUsedOnId] = useState<string | undefined>();
  const [vetoReplacementNomId, setVetoReplacementNomId] = useState<string | undefined>();
  const [blockBusterWinnerId, setBlockBusterWinnerId] = useState<string | undefined>();
  const [blockBusterDate, setBlockBusterDate] = useState(new Date());
  const [evictedId, setEvictedId] = useState<string | undefined>();
  const [evictionDate, setEvictionDate] = useState(new Date());

  // Image Cropping State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [isFinishSeasonDialogOpen, setIsFinishSeasonDialogOpen] = useState(false);
  const [winnerId, setWinnerId] = useState<string | undefined>();
  const [runnerUpId, setRunnerUpId] = useState<string | undefined>();


  const scoringRules = useMemo(() => scoringRuleSet?.rules || [], [scoringRuleSet]);
  const specialEventRules = useMemo(() => scoringRules.filter(r => specialEventRuleCodes.includes(r.code)) || [], [scoringRules]);

  useEffect(() => {
    const lastTab = sessionStorage.getItem('adminActiveTab');
    if (lastTab) {
      setActiveTab(lastTab);
    }
    const lastWeek = sessionStorage.getItem('adminSelectedWeek');
    if (lastWeek && activeSeason && Number(lastWeek) <= activeSeason.currentWeek) {
        setSelectedWeek(Number(lastWeek));
    } else if (activeSeason) {
        setSelectedWeek(activeSeason.currentWeek);
    }
  }, [activeSeason]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    sessionStorage.setItem('adminActiveTab', value);
  };

  const handleWeekChange = (value: string) => {
    const week = Number(value);
    setSelectedWeek(week);
    sessionStorage.setItem('adminSelectedWeek', String(week));
  };
  
  const handleStartNewWeek = () => {
      if (activeSeason) {
          const newWeek = activeSeason.currentWeek + 1;
          // In a real app, you'd save this to the database.
          setActiveSeason({ ...activeSeason, currentWeek: newWeek });
          setSelectedWeek(newWeek);
          sessionStorage.setItem('adminSelectedWeek', String(newWeek));
          toast({ title: "New Week Started", description: `You are now managing Week ${newWeek}.`});
      }
  };
  
  useEffect(() => {
    const compCol = collection(db, "competitions");
    const unsubscribeComps = onSnapshot(compCol, (querySnapshot) => {
      const compData: Competition[] = [];
      querySnapshot.forEach((doc) => {
        compData.push({ ...doc.data(), id: doc.id } as Competition);
      });
      setCompetitions(compData);
    });

    const contestantsCol = collection(db, "contestants");
    const unsubscribeContestants = onSnapshot(contestantsCol, (querySnapshot) => {
        const contestantData: Contestant[] = [];
        querySnapshot.forEach((doc) => {
            contestantData.push({ ...doc.data(), id: doc.id } as Contestant);
        });
        setContestants(contestantData.sort((a,b) => (a.firstName || '').localeCompare(b.firstName || '')));
    });
    
    const teamsCol = collection(db, "teams");
    const qTeams = query(teamsCol);
    const unsubscribeTeams = onSnapshot(qTeams, (querySnapshot) => {
        const teamsData: Team[] = [];
        const teamNamesData: {[id: string]: string} = {};
        const draftOrderData: {[id: string]: number} = {};

        querySnapshot.forEach((doc) => {
            const team = { ...doc.data(), id: doc.id } as Team;
            teamsData.push(team);
            teamNamesData[team.id] = team.name;
            draftOrderData[team.id] = team.draftOrder;
        });

        setTeams(teamsData.sort((a,b) => a.draftOrder - b.draftOrder));
        setTeamNames(teamNamesData);
        setTeamDraftOrders(draftOrderData);
    });

    const leagueDocRef = doc(db, "leagues", "bb27");
    const unsubscribeLeagues = onSnapshot(leagueDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const leagueData = { ...docSnap.data(), id: docSnap.id } as League;
            const currentCategories = leagueData.settings?.scoringBreakdownCategories || [];
            const newCategories = Array.from({ length: 6 }, (_, i) => {
                return currentCategories[i] || { icon: 'HelpCircle', color: 'text-gray-500', displayName: '', ruleCodes: [''] };
            });
            leagueData.settings.scoringBreakdownCategories = newCategories;

            setLeagueSettings(leagueData);

            if (leagueData.settings.scoringRuleSetId) {
                const ruleSetDocRef = doc(db, 'scoring_rules', leagueData.settings.scoringRuleSetId);
                const unsubscribeRules = onSnapshot(ruleSetDocRef, (ruleSnap) => {
                    if (ruleSnap.exists()) {
                        setScoringRuleSet({ id: ruleSnap.id, ...ruleSnap.data() } as ScoringRuleSet);
                    }
                });
            }
        }
    });

    const usersCol = collection(db, "users");
    const qUsers = query(usersCol);
    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
        const usersData: UserType[] = [];
        querySnapshot.forEach((doc) => {
            usersData.push({ ...doc.data(), id: doc.id } as UserType);
        });
        setUsers(usersData);
    });

    return () => {
        unsubscribeComps();
        unsubscribeContestants();
        unsubscribeLeagues();
        unsubscribeTeams();
        unsubscribeUsers();
    };
  }, [db]);


  const activeContestants = useMemo(() => contestants.filter(hg => hg.status === 'active'), [contestants]);
  const weekOptions = useMemo(() => Array.from({ length: activeSeason?.currentWeek || 1 }, (_, i) => i + 1).reverse(), [activeSeason]);
  
  const allAssignedContestantIds = useMemo(() => teams.flatMap(t => t.contestantIds || []), [teams]);
  const undraftedContestants = useMemo(() => contestants.filter(c => !allAssignedContestantIds.includes(c.id)), [contestants, allAssignedContestantIds]);

  const weekEvents = useMemo(() => competitions.filter(c => c.week === selectedWeek), [competitions, selectedWeek]);
  
  useEffect(() => {
    const hoh = weekEvents.find(c => c.type === 'HOH');
    const pov = weekEvents.find(c => c.type === 'VETO');
    const noms = weekEvents.find(c => c.type === 'NOMINATIONS');
    const blockBuster = weekEvents.find(c => c.type === 'BLOCK_BUSTER');
    const eviction = weekEvents.find(c => c.type === 'EVICTION');
    
    setHohWinnerId(hoh?.winnerId);
    setNominees(noms?.nominees || ['', '']);
    setVetoWinnerId(pov?.winnerId);
    setVetoUsed(pov?.used || false);
    setVetoUsedOnId(pov?.usedOnId);
    setVetoReplacementNomId(pov?.replacementNomId);
    setBlockBusterWinnerId(blockBuster?.winnerId);
    setEvictedId(eviction?.evictedId);

  }, [weekEvents, selectedWeek]);


    const handleNomineeChange = (index: number, value: string) => {
        const newNominees = [...nominees];
        newNominees[index] = value;
        setNominees(newNominees);
    };
    
    const addNomineeField = () => {
        setNominees([...nominees, '']);
    };
    
    const removeNomineeField = (index: number) => {
        const newNominees = nominees.filter((_, i) => i !== index);
        setNominees(newNominees);
    };

  const handleAddNewUser = async () => {
    if (!newUserData.displayName || !newUserData.email) {
      toast({ title: "Error", description: "Display Name and Email are required.", variant: 'destructive' });
      return;
    }
    try {
      await addDoc(collection(db, "users"), {
        ...newUserData,
        createdAt: new Date().toISOString(),
        role: 'player',
        status: 'pending'
      });
      toast({ title: "User Created", description: `A new user profile has been created for ${newUserData.displayName}.` });
      setIsNewUserDialogOpen(false);
      setNewUserData({ displayName: '', email: '' });
    } catch (error) {
      console.error("Error creating user: ", error);
      toast({ title: "Error", description: "Could not create new user.", variant: "destructive" });
    }
  };
  
  const handleAddUserToLeague = async () => {
     if (!addUserToLeagueData.userId || !addUserToLeagueData.teamId) {
        toast({ title: "Error", description: "Please select a user and a team.", variant: 'destructive' });
        return;
    }
    const user = users.find(u => u.id === addUserToLeagueData.userId);
    const team = teams.find(t => t.id === addUserToLeagueData.teamId);

    if (!user || !team) return;

    const batch = writeBatch(db);

    // Remove user from any other team first
    teams.forEach(t => {
        if ((t.ownerUserIds || []).includes(user.id)) {
            const teamDocRef = doc(db, 'teams', t.id);
            const updatedOwners = t.ownerUserIds.filter(id => id !== user.id);
            batch.update(teamDocRef, { ownerUserIds: updatedOwners });
        }
    });

    // Add user to the selected team
    const teamDocRef = doc(db, 'teams', team.id);
    const newOwners = [...(team.ownerUserIds || []), user.id];
    batch.update(teamDocRef, { ownerUserIds: newOwners });

    try {
        await batch.commit();
        toast({ title: "User Assigned", description: `${user?.displayName} has been assigned to ${team?.name}.` });
        setIsAddUserToLeagueDialogOpen(false);
        setAddUserToLeagueData({ userId: '', teamId: '' });
    } catch(error) {
         console.error("Error assigning user: ", error);
        toast({ title: "Error", description: "Could not assign user to team.", variant: "destructive" });
    }
  };
  
  const handleRemoveUserFromTeam = async (userId: string, teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const updatedOwnerIds = (team.ownerUserIds || []).filter(id => id !== userId);
    try {
        const teamDocRef = doc(db, 'teams', teamId);
        await updateDoc(teamDocRef, { ownerUserIds: updatedOwnerIds });
        const user = users.find(u => u.id === userId);
        toast({ title: "User Unassigned", description: `${user?.displayName} has been unassigned from ${team.name}.` });
    } catch (error) {
        console.error("Error unassigning user: ", error);
        toast({ title: "Error", description: "Could not unassign user.", variant: "destructive" });
    }
  };


  const handleUserAction = (action: 'resend' | 'reset', user: UserType) => {
    if (action === 'resend') {
        toast({ title: "Invitation Resent", description: `Invitation has been resent to ${user.email}.` });
    }
    if (action === 'reset') {
        toast({ title: "Password Reset Sent", description: `A password reset link has been sent to ${user.email}.` });
    }
  };

  const handleSaveLeagueSettings = async () => {
    if (!leagueSettings || !activeSeason) return;
    const batch = writeBatch(db);
    try {
        const leagueDocRef = doc(db, 'leagues', leagueSettings.id);
        const leagueDataToSave = {
            ...leagueSettings,
        };
        batch.set(leagueDocRef, leagueDataToSave, { merge: true });
        
        await batch.commit();
        toast({ title: "Changes Saved", description: `League settings have been saved.` });
    } catch (error) {
        console.error(`Error saving league settings: `, error);
        toast({ title: "Error", description: `Could not save league settings.`, variant: "destructive" });
    }
  };
  
  const handleSaveTeamsAndUsers = async () => {
     if (!leagueSettings) return;
     const batch = writeBatch(db);
     try {
        teams.forEach(team => {
            const teamDocRef = doc(db, 'teams', team.id);
            const dataToSave: Partial<Team> = {
                name: teamNames[team.id] || team.name,
                draftOrder: teamDraftOrders[team.id] || team.draftOrder,
            };
            batch.update(teamDocRef, dataToSave);
        });

        await batch.commit();
        
        toast({ title: "Changes Saved", description: `Team and user settings have been saved.` });
    } catch (error) {
        console.error(`Error saving teams/users: `, error);
        toast({ title: "Error", description: `Could not save teams and users.`, variant: "destructive" });
    }
  };

  const handleSaveRules = async () => {
    if (!scoringRuleSet || !leagueSettings) return;
    const batch = writeBatch(db);
    try {
        const rulesetDocRef = doc(db, 'scoring_rules', scoringRuleSet.id);
        batch.set(rulesetDocRef, { rules: scoringRuleSet.rules }, { merge: true });

        const leagueDocRef = doc(db, 'leagues', leagueSettings.id);
        const updatedSettings = {
          ...leagueSettings.settings,
          scoringBreakdownCategories: leagueSettings.settings.scoringBreakdownCategories.filter(c => c.displayName)
        };
        
        batch.update(leagueDocRef, { settings: updatedSettings });

        await batch.commit();
        toast({ title: "Changes Saved", description: `Scoring rules and breakdowns have been saved.` });
    } catch (error) {
        console.error(`Error saving rules: `, error);
        toast({ title: "Error", description: `Could not save scoring rules.`, variant: "destructive" });
    }
  };

  const handleSaveWeeklyEvents = async () => {
    if (!activeSeason || !leagueSettings) return;
    const batch = writeBatch(db);

    const createEvent = (type: Competition['type'], data: Omit<Competition, 'id' | 'seasonId' | 'type'>) => {
        const id = `${leagueSettings.id}_wk${selectedWeek}_${type}_${Date.now()}`;
        batch.set(doc(db, 'competitions', id), {
            ...data,
            id,
            seasonId: activeSeason.id,
            week: selectedWeek,
            type,
        });
    };

    if (hohWinnerId) {
        createEvent('HOH', { winnerId: hohWinnerId, airDate: hohDate.toISOString() });
    }
    if (nominees.some(n => n)) {
        createEvent('NOMINATIONS', { nominees: nominees.filter(n => n), airDate: nomsDate.toISOString() });
    }
    if (vetoWinnerId) {
        createEvent('VETO', { winnerId: vetoWinnerId, used: vetoUsed, usedOnId, replacementNomId, airDate: vetoDate.toISOString() });
        if (vetoUsed && vetoUsedOnId) {
             createEvent('SPECIAL_EVENT', {
                specialEventCode: 'SAVED',
                winnerId: vetoUsedOnId,
                airDate: vetoDate.toISOString(),
                notes: 'Saved by Power of Veto'
            });
        }
    }
    if (blockBusterWinnerId) {
        createEvent('BLOCK_BUSTER', { winnerId: blockBusterWinnerId, airDate: blockBusterDate.toISOString() });
    }
    if (evictedId) {
        const juryStartWeek = leagueSettings.settings.juryStartWeek;
        const eventCode = juryStartWeek && selectedWeek >= juryStartWeek ? 'EVICT_POST' : 'EVICT_PRE';
        createEvent('EVICTION', { evictedId: evictedId, airDate: evictionDate.toISOString(), specialEventCode: eventCode });
    }

    try {
        await batch.commit();
        toast({ title: "Events Saved", description: `All event changes for Week ${selectedWeek} have been saved.`});
    } catch (error) {
        console.error("Error saving weekly events: ", error);
        toast({ title: "Error", description: "Could not save event changes.", variant: "destructive" });
    }
  };

  const handleTeamNameChange = (teamId: string, newName: string) => {
    setTeamNames(prev => ({ ...prev, [teamId]: newName }));
  };

  const handleDraftOrderChange = (teamId: string, order: string) => {
    const numOrder = Number(order);
    if (!isNaN(numOrder)) {
        setTeamDraftOrders(prev => ({...prev, [teamId]: numOrder}));
    }
  };

  const handleUpdateRule = (index: number, field: keyof ScoringRule, value: string | number) => {
    if (!scoringRuleSet) return;
    
    if (field === 'code' && typeof value === 'string') {
        const otherCodes = scoringRuleSet.rules.filter((_, i) => i !== index).map(r => r.code);
        if (otherCodes.includes(value)) {
            toast({
                title: "Duplicate Code",
                description: `The event code "${value}" is already in use. Please choose a unique code.`,
                variant: "destructive",
            });
            // Revert the change locally if it's a duplicate
            return;
        }
    }
    
    const updatedRules = [...scoringRuleSet.rules];
    (updatedRules[index] as any)[field] = value;
    setScoringRuleSet({ ...scoringRuleSet, rules: updatedRules });
};

  const handleAddRule = () => {
    if (!newRuleData.code || !newRuleData.label || !scoringRuleSet) {
        toast({ title: "Error", description: "Rule code and label are required.", variant: 'destructive' });
        return;
    }
    const updatedRules = [...scoringRuleSet.rules, newRuleData];
    setScoringRuleSet({ ...scoringRuleSet, rules: updatedRules });
    setIsAddRuleDialogOpen(false);
    setNewRuleData({ code: '', label: '', points: 0 });
    toast({ title: "Rule Added", description: "The new scoring rule has been added. Remember to save changes." });
  };

  const handleRemoveRule = (codeToRemove: string) => {
    if (!scoringRuleSet) return;
    const updatedRules = scoringRuleSet.rules.filter(rule => rule.code !== codeToRemove);
    setScoringRuleSet({ ...scoringRuleSet, rules: updatedRules });
    toast({ title: "Rule Removed", description: "The scoring rule has been removed. Remember to save changes." });
  };

  const handleBreakdownCategoryChange = (catIndex: number, field: keyof LeagueScoringBreakdownCategory, value: string | string[]) => {
      if (!leagueSettings) return;
      const updatedCategories = [...leagueSettings.settings.scoringBreakdownCategories];
      
      let finalValue = value;
      if (field === 'displayName' && typeof value === 'string' && value.length > 12) {
          finalValue = value.substring(0, 12);
          toast({ title: "Character Limit", description: "Display names are limited to 12 characters.", variant: "destructive"});
      }

      (updatedCategories[catIndex] as any)[field] = finalValue;
      
      setLeagueSettings({
          ...leagueSettings,
          settings: {
              ...leagueSettings.settings,
              scoringBreakdownCategories: updatedCategories,
          },
      });
  };

  const handleBreakdownRuleCodeChange = (catIndex: number, ruleIndex: number, value: string) => {
      if (!leagueSettings) return;
      const updatedCategories = [...leagueSettings.settings.scoringBreakdownCategories];
      const newRuleCodes = [...updatedCategories[catIndex].ruleCodes];
      newRuleCodes[ruleIndex] = value;
      updatedCategories[catIndex].ruleCodes = newRuleCodes;
       setLeagueSettings({
          ...leagueSettings,
          settings: {
              ...leagueSettings.settings,
              scoringBreakdownCategories: updatedCategories,
          },
      });
  };

  const addBreakdownRuleCode = (catIndex: number) => {
      if (!leagueSettings) return;
      const updatedCategories = [...leagueSettings.settings.scoringBreakdownCategories];
      updatedCategories[catIndex].ruleCodes.push('');
       setLeagueSettings({
          ...leagueSettings,
          settings: {
              ...leagueSettings.settings,
              scoringBreakdownCategories: updatedCategories,
          },
      });
  };
  
  const removeBreakdownRuleCode = (catIndex: number, ruleIndex: number) => {
      if (!leagueSettings) return;
      const updatedCategories = [...leagueSettings.settings.scoringBreakdownCategories];
      const newRuleCodes = updatedCategories[catIndex].ruleCodes.filter((_, i) => i !== ruleIndex);
      updatedCategories[catIndex].ruleCodes = newRuleCodes;
       setLeagueSettings({
          ...leagueSettings,
          settings: {
              ...leagueSettings.settings,
              scoringBreakdownCategories: updatedCategories,
          },
      });
  };
  
  const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const IconComponent = (LucideIcons as any)[name];
    if (!IconComponent) {
        return <LucideIcons.HelpCircle className={className} />;
    }
    return createElement(IconComponent, { className });
  };

  const getUsersForTeam = (teamId: string): UserType[] => {
      const team = teams.find(t => t.id === teamId);
      if (!team || !team.ownerUserIds) return [];
      return users.filter(u => (team.ownerUserIds || []).includes(u.id));
  };
  
  const getContestantsForTeam = (teamId: string): Contestant[] => {
    const team = teams.find(t => t.id === teamId);
    if (!team || !team.contestantIds) return [];
    return contestants.filter(c => (team.contestantIds || []).includes(c.id));
  };

  const handleOpenDraftDialog = (team: Team) => {
    setDraftingTeam(team);
    setIsDraftDialogOpen(true);
    setDraftSelection('');
  }

  const handleDraftContestant = async () => {
    if (!draftingTeam || !draftSelection) {
        toast({ title: "Error", description: "No contestant selected.", variant: "destructive"});
        return;
    }

    const teamDocRef = doc(db, 'teams', draftingTeam.id);
    const updatedContestantIds = [...(draftingTeam.contestantIds || []), draftSelection];
    
    try {
        await updateDoc(teamDocRef, { contestantIds: updatedContestantIds });
        toast({ title: "Draft Successful", description: `${getContestantDisplayName(contestants.find(c => c.id === draftSelection), 'full')} has been drafted to ${draftingTeam.name}.`});
        setIsDraftDialogOpen(false);
        setDraftingTeam(null);
    } catch(e) {
        console.error("Error drafting contestant: ", e);
        toast({ title: "Error", description: "Could not draft contestant.", variant: "destructive"});
    }
  };
  
  const handleRemoveContestantFromTeam = async (contestantId: string, teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team || !team.contestantIds) return;
    
    const teamDocRef = doc(db, 'teams', team.id);
    const updatedContestantIds = team.contestantIds.filter(id => id !== contestantId);

    try {
        await updateDoc(teamDocRef, { contestantIds: updatedContestantIds });
        const contestant = contestants.find(c => c.id === contestantId);
        toast({ title: "Player Removed", description: `${getContestantDisplayName(contestant, 'full')} has been removed from ${team.name}.`});
    } catch(e) {
        console.error("Error removing contestant: ", e);
        toast({ title: "Error", description: "Could not remove contestant.", variant: "destructive"});
    }
  };


  const contestantTerm = leagueSettings?.contestantTerm || { singular: 'Contestant', plural: 'Contestants' };

  const handleOpenContestantDialog = (contestantOrNew: Contestant | 'new') => {
    if (contestantOrNew === 'new') {
        const newContestant: Contestant = {
            id: `new_contestant_${Date.now()}`,
            seasonId: activeSeason?.id || '',
            firstName: '',
            lastName: '',
            nickname: '',
            age: 0,
            hometown: '',
            occupation: '',
            status: 'active',
            enteredDay: 1,
            photoUrl: ''
        };
        setEditingContestant(newContestant);
    } else {
        setEditingContestant(contestantOrNew);
    }
  };
  
  const handleUpdateContestant = (field: keyof Contestant, value: string | number | boolean) => {
    if (editingContestant) {
      setEditingContestant({ ...editingContestant, [field]: value });
    }
  };

  const handleSaveContestant = async () => {
      if (!editingContestant) return;
  
      const contestantData = { ...editingContestant };
      const isNew = contestantData.id.startsWith('new_contestant_');
      
      try {
          if (isNew) {
              const { id, ...dataToSave } = contestantData;
              await addDoc(collection(db, 'contestants'), dataToSave);
              toast({ title: "Contestant Added", description: `${getContestantDisplayName(editingContestant, 'full')} has been added.` });
          } else {
              const { id, ...dataToSave } = contestantData;
              const contestantDoc = doc(db, 'contestants', editingContestant.id);
              await updateDoc(contestantDoc, dataToSave);
              toast({ title: "Contestant Updated", description: `${getContestantDisplayName(editingContestant, 'full')} has been updated.` });
          }
          setEditingContestant(null);
      } catch (error) {
          console.error("Error saving contestant: ", error);
          toast({ title: "Error", description: "Could not save contestant details.", variant: "destructive" });
      }
  };
  
  const handleDeleteContestant = async () => {
    if (!contestantToDelete) return;

    try {
      // First, delete the photo from storage if it exists
      if (contestantToDelete.photoUrl && contestantToDelete.photoUrl.includes('firebasestorage')) {
          const photoRef = ref(storage, contestantToDelete.photoUrl);
          await deleteObject(photoRef).catch(err => console.warn("Could not delete photo, it might not exist:", err));
      }

      // Then, delete the document from Firestore
      await deleteDoc(doc(db, 'contestants', contestantToDelete.id));

      // Finally, update local state
      setContestants(prev => prev.filter(c => c.id !== contestantToDelete.id));
      
      toast({ title: "Contestant Deleted", description: `${getContestantDisplayName(contestantToDelete, 'full')} has been permanently removed.` });
    } catch (error) {
        console.error("Error deleting contestant: ", error);
        toast({ title: "Error", description: "Could not delete contestant.", variant: "destructive" });
    } finally {
        setContestantToDelete(null);
    }
  };

  const allAssignedUserIds = useMemo(() => teams.flatMap(t => t.ownerUserIds || []), [teams]);
  const unassignedUsers = useMemo(() => users.filter(u => !(allAssignedUserIds || []).includes(u.id)), [users, allAssignedUserIds]);
  
  const isEditingNewContestant = editingContestant?.id.startsWith('new_contestant_');

  // Image Cropping Handlers
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };
  
  const handlePhotoUpload = async () => {
    if (!croppedAreaPixels || !imageSrc || !editingContestant) return;
    try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        if (!croppedImage) return;

        const storageRef = ref(storage, `contestant_photos/${editingContestant.id}_${Date.now()}.jpeg`);
        await uploadString(storageRef, croppedImage, 'data_url', {contentType: 'image/jpeg'});
        const downloadURL = await getDownloadURL(storageRef);
        
        handleUpdateContestant('photoUrl', downloadURL);
        
        setImageSrc(null); // Close the cropper
        setZoom(1);
        toast({ title: "Photo Uploaded", description: "New photo is ready. Don't forget to save." });
    } catch (e) {
        console.error("Error uploading photo: ", e);
        toast({ title: "Upload Failed", description: "Could not upload the photo.", variant: "destructive"});
    }
  };

    const isSeasonFinished = useMemo(() => {
        if (!leagueSettings || !leagueSettings.settings.seasonEndDate) return false;
        const endDate = new Date(leagueSettings.settings.seasonEndDate);
        const today = new Date();
        return today > endDate;
    }, [leagueSettings]);

    const handleFinishSeason = async () => {
        if (!winnerId || !runnerUpId || !leagueSettings || !activeSeason) {
            toast({ title: "Error", description: "Please select a winner and a runner-up.", variant: "destructive" });
            return;
        }

        const batch = writeBatch(db);
        const createEvent = (type: Competition['type'], data: Partial<Competition>) => {
            const id = `${leagueSettings.id}_wk${selectedWeek}_${type}_${Date.now()}`;
            batch.set(doc(db, 'competitions', id), {
                ...data,
                id,
                seasonId: activeSeason.id,
                week: activeSeason.currentWeek, // Final week
                type,
                airDate: new Date().toISOString()
            });
        };

        createEvent('SPECIAL_EVENT', { winnerId, specialEventCode: 'WINNER' });
        createEvent('SPECIAL_EVENT', { winnerId: runnerUpId, specialEventCode: 'RUNNER_UP' });

        try {
            await batch.commit();
            toast({ title: "Season Finished!", description: "Winner and runner-up have been recorded."});
            setIsFinishSeasonDialogOpen(false);
        } catch (error) {
            console.error("Error finishing season:", error);
            toast({ title: "Error", description: "Could not finalize season.", variant: "destructive" });
        }
    };
  
  if (!leagueSettings || !activeSeason) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div>Loading Admin Panel...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <Building className="h-5 w-5" />
          Admin Panel
        </h1>
        <Button asChild variant="outline" size="sm">
            <Link href="/"><Home className="mr-2 h-4 w-4" /> Back to App</Link>
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="scoring">Scoring</TabsTrigger>
                <TabsTrigger value="contestants">Contestants</TabsTrigger>
                <TabsTrigger value="rules">Rules</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="league">League Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="scoring" className="mt-6 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2"><CalendarClock/> Weekly Event Management</CardTitle>
                            <CardDescription>Update results for the selected week.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-32">
                                <Select value={String(selectedWeek)} onValueChange={handleWeekChange}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                    {weekOptions.map(week => <SelectItem key={week} value={String(week)}>Week {week}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {isSeasonFinished ? (
                                 <Dialog open={isFinishSeasonDialogOpen} onOpenChange={setIsFinishSeasonDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm"><Trophy className="mr-2 h-4 w-4"/> Finish Season</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Finalize Season</DialogTitle>
                                            <DialogDescription>Select the winner and runner-up to calculate final scores.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Winner</Label>
                                                <Select value={winnerId} onValueChange={setWinnerId}>
                                                    <SelectTrigger><SelectValue placeholder="Select Winner..."/></SelectTrigger>
                                                    <SelectContent>
                                                        {activeContestants.map(c => <SelectItem key={c.id} value={c.id}>{getContestantDisplayName(c, 'full')}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Runner-up</Label>
                                                <Select value={runnerUpId} onValueChange={setRunnerUpId}>
                                                    <SelectTrigger><SelectValue placeholder="Select Runner-up..."/></SelectTrigger>
                                                    <SelectContent>
                                                         {activeContestants.filter(c => c.id !== winnerId).map(c => <SelectItem key={c.id} value={c.id}>{getContestantDisplayName(c, 'full')}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsFinishSeasonDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleFinishSeason}>Finalize</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            ) : (
                                <Button variant="outline" size="sm" onClick={handleStartNewWeek}><Plus className="mr-2 h-4 w-4"/> New Week</Button>
                            )}
                        </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base text-purple-600"><Crown className="h-4 w-4" /> Head of Household</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Label>HOH Winner</Label>
                                    <Select value={hohWinnerId} onValueChange={(val) => setHohWinnerId(val === 'none' ? undefined : val)}>
                                        <SelectTrigger><SelectValue placeholder="Select HOH..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='none'>None</SelectItem>
                                            {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base text-red-500">
                                        <Users className="h-4 w-4" /> Nominations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {nominees.map((nomineeId, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Select value={nomineeId} onValueChange={(value) => handleNomineeChange(index, value === 'none' ? '' : value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Nominee..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value='none'>None</SelectItem>
                                                    {activeContestants
                                                        .filter(c => !nominees.includes(c.id) || nominees[index] === c.id)
                                                        .map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            {index > 1 && (
                                                <Button variant="ghost" size="icon" onClick={() => removeNomineeField(index)} className="h-9 w-9">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={addNomineeField} className="mt-2">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Nominee
                                    </Button>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base text-amber-500"><Shield className="h-4 w-4" /> Power of Veto</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Veto Winner</Label>
                                        <Select value={vetoWinnerId} onValueChange={(val) => setVetoWinnerId(val === 'none' ? undefined : val)}>
                                            <SelectTrigger><SelectValue placeholder="Select Veto Winner..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value='none'>None</SelectItem>
                                                {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="veto-used" checked={vetoUsed} onCheckedChange={(checked) => setVetoUsed(!!checked)} />
                                        <Label htmlFor="veto-used">Veto was used</Label>
                                    </div>
                                    {vetoUsed && (
                                        <>
                                            <div>
                                                <Label>Used On (Saved)</Label>
                                                <Select value={vetoUsedOnId} onValueChange={(val) => setVetoUsedOnId(val === 'none' ? undefined : val)}>
                                                    <SelectTrigger><SelectValue placeholder="Select Player Saved..." /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value='none'>None</SelectItem>
                                                        {nominees?.map(nomId => {
                                                            const nom = contestants.find(c => c.id === nomId);
                                                            return nom ? <SelectItem key={nom.id} value={nom.id}>{getContestantDisplayName(nom, 'full')}</SelectItem> : null;
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Replacement Nominee (Renom)</Label>
                                                <Select value={vetoReplacementNomId} onValueChange={(val) => setVetoReplacementNomId(val === 'none' ? undefined : val)}>
                                                    <SelectTrigger><SelectValue placeholder="Select Replacement..." /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value='none'>None</SelectItem>
                                                        {activeContestants.filter(c => !nominees?.includes(c.id)).map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base text-sky-500"><ShieldCheck className="h-4 w-4" /> Block Buster</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Label>Winner (Safe)</Label>
                                    <Select value={blockBusterWinnerId} onValueChange={(val) => setBlockBusterWinnerId(val === 'none' ? undefined : val)}>
                                        <SelectTrigger><SelectValue placeholder="Select Winner..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='none'>None</SelectItem>
                                            {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base text-muted-foreground"><UserX className="h-4 w-4" /> Eviction</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Label>Evicted Player</Label>
                                    <Select value={evictedId} onValueChange={(val) => setEvictedId(val === 'none' ? undefined : val)}>
                                        <SelectTrigger><SelectValue placeholder="Select Evictee..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='none'>None</SelectItem>
                                            {contestants.filter(c => c.status === 'active').map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base text-green-500"><ShieldQuestion className="h-4 w-4" /> Special Event</CardTitle>
                                </CardHeader>
                                <CardContent className="flex h-[calc(100%-4rem)] items-center justify-center">
                                    <Dialog open={isSpecialEventDialogOpen} onOpenChange={setIsSpecialEventDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline"><PlusCircle className="mr-2" /> Add Event</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Log Special Event / Penalty</DialogTitle>
                                                <DialogDescription>Apply a special scoring rule to a contestant for this week.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div>
                                                    <Label>Contestant</Label>
                                                    <Select value={specialEventData.contestantId} onValueChange={(val) => setSpecialEventData({...specialEventData, contestantId: val})}>
                                                        <SelectTrigger><SelectValue placeholder="Select Contestant..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Event/Rule</Label>
                                                    <Select value={specialEventData.ruleCode} onValueChange={(val) => setSpecialEventData({...specialEventData, ruleCode: val})}>
                                                        <SelectTrigger><SelectValue placeholder="Select Rule..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {specialEventRules.map(rule => <SelectItem key={rule.code} value={rule.code}>{rule.label} ({rule.points > 0 ? '+': ''}{rule.points})</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Notes (optional)</Label>
                                                    <Textarea value={specialEventData.notes} onChange={(e) => setSpecialEventData({...specialEventData, notes: e.target.value})} />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsSpecialEventDialogOpen(false)}>Cancel</Button>
                                                <Button>Log Event</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="outline">Reset Week {selectedWeek}</Button>
                        <Button onClick={handleSaveWeeklyEvents}><Save className="mr-2"/>Save All Event Changes</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="contestants" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserSquare/> Contestants Management</CardTitle>
                        <CardDescription>Manage contestant details for the league.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Contestants Roster</h3>
                                <Button size="sm" variant="outline" onClick={() => handleOpenContestantDialog('new')}><PlusCircle className="mr-2"/> Add {contestantTerm.singular}</Button>
                            </div>
                            <div className="space-y-2">
                                {contestants.map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={c.photoUrl || undefined} alt={getContestantDisplayName(c, 'full')} />
                                                <AvatarFallback>{getContestantDisplayName(c, 'full').charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{getContestantDisplayName(c, 'full')}</p>
                                                <p className="text-sm text-muted-foreground">{c.hometown}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleOpenContestantDialog(c)}><Pencil className="mr-2 h-3 w-3" /> Edit</Button>
                                            <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => setContestantToDelete(c)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Dialog open={!!editingContestant} onOpenChange={(isOpen) => !isOpen && setEditingContestant(null)}>
                            <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>{isEditingNewContestant ? `Add New ${contestantTerm.singular}` : `Edit ${getContestantDisplayName(editingContestant, 'full')}`}</DialogTitle>
                                </DialogHeader>
                                {editingContestant && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                      {/* Left side: Form */}
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>First Name</Label>
                                                <Input value={editingContestant.firstName || ''} onChange={(e) => handleUpdateContestant('firstName', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Last Name</Label>
                                                <Input value={editingContestant.lastName || ''} onChange={(e) => handleUpdateContestant('lastName', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Nickname (optional)</Label>
                                                <Input value={editingContestant.nickname || ''} onChange={(e) => handleUpdateContestant('nickname', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Age</Label>
                                                <Input type="number" value={editingContestant.age || 0} onChange={(e) => handleUpdateContestant('age', Number(e.target.value))} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={editingContestant.status} onValueChange={(val) => handleUpdateContestant('status', val)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="evicted">Evicted</SelectItem>
                                                    <SelectItem value="jury">Jury</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Hometown</Label>
                                            <Input value={editingContestant.hometown || ''} onChange={(e) => handleUpdateContestant('hometown', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Occupation</Label>
                                            <Input value={editingContestant.occupation || ''} onChange={(e) => handleUpdateContestant('occupation', e.target.value)} />
                                        </div>
                                      </div>
                                      {/* Right side: Photo */}
                                      <div className="space-y-4">
                                          <Label>Photo</Label>
                                          <div className="p-4 border-2 border-dashed rounded-lg text-center">
                                            <Avatar className="mx-auto h-32 w-32 mb-4">
                                                <AvatarImage src={editingContestant.photoUrl || undefined} />
                                                <AvatarFallback className="text-3xl">
                                                    {getContestantDisplayName(editingContestant, 'full').charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <Input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                                            <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById('photo-upload')?.click()}>
                                                <Upload className="mr-2 h-4 w-4"/> Change Photo
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-2">Upload a new photo for this contestant.</p>
                                          </div>
                                      </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditingContestant(null)}>Cancel</Button>
                                    <Button onClick={handleSaveContestant}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        
                         <AlertDialog open={!!contestantToDelete} onOpenChange={(isOpen) => !isOpen && setContestantToDelete(null)}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete {getContestantDisplayName(contestantToDelete, 'full')} and all their data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setContestantToDelete(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteContestant}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        
                        <Dialog open={!!imageSrc} onOpenChange={(isOpen) => !isOpen && setImageSrc(null)}>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Crop Photo</DialogTitle>
                                    <DialogDescription>Adjust the image to fit the circle.</DialogDescription>
                                </DialogHeader>
                                <div className="relative h-96 w-full bg-muted">
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
                                            showGrid={false}
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
                                    <Button onClick={handlePhotoUpload}>Save Photo</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="rules" className="mt-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookCopy /> Scoring Rules</CardTitle>
                        <CardDescription>Manage the point values for all events in the league.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Point Values</h3>
                                <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
                                    <DialogTrigger asChild><Button size="sm" variant="outline"><PlusCircle className="mr-2"/> Add Rule</Button></DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Scoring Rule</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Event Code</Label>
                                                <Input value={newRuleData.code} onChange={(e) => setNewRuleData({...newRuleData, code: e.target.value.toUpperCase()})} placeholder="e.g., HOH_WIN" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Label</Label>
                                                <Input value={newRuleData.label} onChange={(e) => setNewRuleData({...newRuleData, label: e.target.value})} placeholder="e.g., Wins Head of Household" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Points</Label>
                                                <Input type="number" value={newRuleData.points} onChange={(e) => setNewRuleData({...newRuleData, points: Number(e.target.value)})} placeholder="e.g., 10" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddRuleDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleAddRule}>Add Rule</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event Code</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Score</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {scoringRuleSet?.rules.map((rule, index) => (
                                        <RuleRow 
                                            key={`${rule.code}-${index}`} 
                                            rule={rule} 
                                            index={index} 
                                            onUpdate={handleUpdateRule} 
                                            onRemove={handleRemoveRule} 
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Separator/>
                        <div>
                            <h3 className="text-lg font-medium mb-2">Scoring Breakdown Categories</h3>
                            <p className="text-sm text-muted-foreground mb-4">Customize how scores are displayed on team cards. Define up to 6 categories.</p>
                            <div className="space-y-2">
                                {leagueSettings.settings?.scoringBreakdownCategories?.map((category, catIndex) => (
                                    <div key={catIndex} className="flex items-center gap-2 p-3 border rounded-lg">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="icon" className={cn("w-10 h-10", category.color ? category.color.replace('text-','bg-') : 'bg-gray-500' )}>
                                                    <DynamicIcon name={category.icon} className="h-5 w-5 text-white" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto">
                                                <div className="grid grid-cols-8 gap-1">
                                                    {iconSelection.map(iconName => (
                                                        <Button key={iconName} variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleBreakdownCategoryChange(catIndex, 'icon', iconName)}>
                                                            <DynamicIcon name={iconName} />
                                                        </Button>
                                                    ))}
                                                </div>
                                                <Separator className="my-2" />
                                                <div className="grid grid-cols-9 gap-1">
                                                    {colorSelection.map(colorClass => (
                                                        <Button key={colorClass} variant="outline" size="icon" className="h-7 w-7 rounded-full p-0" onClick={() => handleBreakdownCategoryChange(catIndex, 'color', colorClass.replace('bg-','text-'))}>
                                                            <div className={cn("h-4 w-4 rounded-full", colorClass)} />
                                                        </Button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <Input 
                                            placeholder="Display Name"
                                            value={category.displayName} 
                                            onChange={(e) => handleBreakdownCategoryChange(catIndex, 'displayName', e.target.value)}
                                            maxLength={12}
                                            className="w-40"
                                        />
                                        <div className="flex flex-col gap-1 flex-grow">
                                        {category.ruleCodes.map((ruleCode, ruleIndex) => (
                                            <div key={ruleIndex} className="flex items-center gap-1">
                                                <Select value={ruleCode} onValueChange={(value) => handleBreakdownRuleCodeChange(catIndex, ruleIndex, value)}>
                                                    <SelectTrigger><SelectValue placeholder="Select event code..."/></SelectTrigger>
                                                    <SelectContent>
                                                        {scoringRules.map(rule => <SelectItem key={rule.code} value={rule.code}>{rule.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeBreakdownRuleCode(catIndex, ruleIndex)}>
                                                    <Trash2 className="h-4 w-4 text-red-500"/>
                                                </Button>
                                            </div>
                                        ))}
                                        </div>
                                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => addBreakdownRuleCode(catIndex)}>
                                            <Plus className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button onClick={handleSaveRules}><Save className="mr-2"/>Save Rules</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="draft" className="mt-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Draft Center</CardTitle>
                        <CardDescription>Assign contestants to teams.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {teams.map(team => (
                                <Card key={team.id}>
                                    <CardHeader className="flex-row items-center justify-between p-4">
                                        <CardTitle className="text-lg">{team.name}</CardTitle>
                                        <Button size="sm" onClick={() => handleOpenDraftDialog(team)}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Draft {contestantTerm.singular}
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                    {getContestantsForTeam(team.id).length > 0 ? (
                                        <div className="space-y-2">
                                            {getContestantsForTeam(team.id).map(contestant => (
                                                <div key={contestant.id} className="flex items-center justify-between text-sm">
                                                    <span>{getContestantDisplayName(contestant, 'full')}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveContestantFromTeam(contestant.id, team.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ): (
                                        <p className="text-sm text-muted-foreground">No {contestantTerm.plural} drafted yet.</p>
                                    )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Undrafted {contestantTerm.plural}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {undraftedContestants.map(c => (
                                    <Badge key={c.id} variant="secondary">{getContestantDisplayName(c, 'short')}</Badge>
                                ))}
                                {undraftedContestants.length === 0 && <p className="text-sm text-muted-foreground">All {contestantTerm.plural} have been drafted.</p>}
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>

                <Dialog open={isDraftDialogOpen} onOpenChange={setIsDraftDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Drafting to {draftingTeam?.name}</DialogTitle>
                            <DialogDescription>Select a {contestantTerm.singular} to add to this team.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Select value={draftSelection} onValueChange={setDraftSelection}>
                                <SelectTrigger>
                                    <SelectValue placeholder={`Select a ${contestantTerm.singular}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {undraftedContestants.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{getContestantDisplayName(c, 'full')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDraftDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleDraftContestant}>Draft</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </TabsContent>

            <TabsContent value="league" className="mt-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Settings /> General League Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="leagueName">League Name</Label>
                                <Input id="leagueName" value={leagueSettings.name} onChange={(e) => setLeagueSettings({...leagueSettings, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="seasonName">Season Name</Label>
                                <Input id="seasonName" value={activeSeason.title} onChange={(e) => setActiveSeason({...activeSeason, title: e.target.value})} />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="seasonStart">Season Start Date</Label>
                                <Input 
                                    id="seasonStart" 
                                    type="date"
                                    value={leagueSettings.settings.seasonStartDate || ''}
                                    onChange={(e) => setLeagueSettings({...leagueSettings, settings: {...leagueSettings.settings, seasonStartDate: e.target.value }})}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="seasonEnd">Season End Date</Label>
                                <Input 
                                    id="seasonEnd" 
                                    type="date"
                                    value={leagueSettings.settings.seasonEndDate || ''}
                                    onChange={(e) => setLeagueSettings({...leagueSettings, settings: {...leagueSettings.settings, seasonEndDate: e.target.value }})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jury Start Week</Label>
                                <Select 
                                    value={String(leagueSettings.settings.juryStartWeek || 'none')} 
                                    onValueChange={(val) => setLeagueSettings({...leagueSettings, settings: {...leagueSettings.settings, juryStartWeek: val === 'none' ? undefined : Number(val) }})}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select week..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {weekOptions.map(week => <SelectItem key={week} value={String(week)}>Week {week}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="termSingular">Contestant (Singular)</Label>
                                <Input id="termSingular" value={leagueSettings.contestantTerm.singular} onChange={(e) => setLeagueSettings({...leagueSettings, contestantTerm: {...leagueSettings.contestantTerm, singular: e.target.value}})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="termPlural">Contestant (Plural)</Label>
                                <Input id="termPlural" value={leagueSettings.contestantTerm.plural} onChange={(e) => setLeagueSettings({...leagueSettings, contestantTerm: {...leagueSettings.contestantTerm, plural: e.target.value}})} />
                            </div>
                        </div>
                        <div className="space-y-2 w-40">
                            <Label htmlFor="maxTeams">Number of Teams</Label>
                            <Input 
                                id="maxTeams" 
                                type="number"
                                min="4"
                                max="12"
                                value={leagueSettings.maxTeams} 
                                onChange={(e) => {
                                    const val = Math.max(4, Math.min(12, Number(e.target.value)));
                                    setLeagueSettings({...leagueSettings, maxTeams: val});
                                }}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button onClick={handleSaveLeagueSettings}><Save className="mr-2"/>Save Settings</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><UserCog /> Users &amp; Teams</CardTitle>
                        <CardDescription className="text-left">Manage user roles, team names, assignments, and invitations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="flex justify-end gap-2">
                        <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline"><UserPlus className="mr-2 h-4 w-4" /> New User</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New User</DialogTitle>
                                    <DialogDescription>Create a new global user profile. This does not add them to any league.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input value={newUserData.displayName} onChange={(e) => setNewUserData({...newUserData, displayName: e.target.value})} placeholder="e.g., Jane Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} placeholder="jane@example.com" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddNewUser}><UserPlus className="mr-2" /> Create User</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isAddUserToLeagueDialogOpen} onOpenChange={setIsAddUserToLeagueDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><UserPlus2 className="mr-2 h-4 w-4" /> Add User to League</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add User to League</DialogTitle>
                                    <DialogDescription>Invite an existing user to this league and assign them to a team.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>User</Label>
                                        <Select value={addUserToLeagueData.userId} onValueChange={(value) => setAddUserToLeagueData({...addUserToLeagueData, userId: value})}>
                                            <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                                            <SelectContent>
                                                {unassignedUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.displayName} ({user.email})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Team Assignment</Label>
                                        <Select value={addUserToLeagueData.teamId} onValueChange={(value) => setAddUserToLeagueData({...addUserToLeagueData, teamId: value})}>
                                            <SelectTrigger><SelectValue placeholder="Select a team" /></SelectTrigger>
                                            <SelectContent>
                                                {teams.map(team => <SelectItem key={team.id} value={team.id}>{teamNames[team.id]}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddUserToLeagueDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddUserToLeague}><Send className="mr-2" /> Add to League</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {teams.map((team, index) => (
                                    <Card key={team.id}>
                                        <CardHeader className="p-4 flex-row items-center justify-between">
                                            <CardTitle className="text-base flex-grow mr-2">
                                                <Input 
                                                    value={teamNames[team.id] || `Team ${index + 1}`} 
                                                    placeholder={`Team ${index + 1}`}
                                                    onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                                                    className="border-0 shadow-none focus-visible:ring-0 p-0 text-base font-semibold"
                                                />
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`draft-order-${team.id}`} className="text-xs text-muted-foreground"><SortAsc className="h-3 w-3 inline-block mr-1"/>Draft</Label>
                                                <Input 
                                                    id={`draft-order-${team.id}`}
                                                    type="number"
                                                    value={teamDraftOrders[team.id] || ''}
                                                    onChange={(e) => handleDraftOrderChange(team.id, e.target.value)}
                                                    className="w-14 h-8 text-center"
                                                />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            {getUsersForTeam(team.id).length > 0 ? (
                                                getUsersForTeam(team.id).map(user => (
                                                    <div key={user.id} className="flex items-center justify-between text-sm py-1">
                                                        <div className="flex items-center gap-2">
                                                            <span>{user.displayName}</span>
                                                            <Badge variant={user.status === 'active' ? 'outline' : 'secondary'} className={cn(
                                                                user.status === 'active' && 'text-green-600 border-green-600',
                                                                user.status === 'pending' && 'bg-white text-amber-600 border-amber-600'
                                                            )}>
                                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                    {user.status === 'pending' && <DropdownMenuItem onClick={() => handleUserAction('resend', user)}><MailQuestion className="mr-2" /> Resend Invitation</DropdownMenuItem>}
                                                                    <DropdownMenuItem onClick={() => handleUserAction('reset', user)}><KeyRound className="mr-2" /> Send Password Reset</DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveUserFromTeam(user.id, team.id)}><UserX className="mr-2"/> Unassign Team</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No members assigned.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button onClick={handleSaveTeamsAndUsers}><Save className="mr-2"/>Save Teams &amp; Users</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

    