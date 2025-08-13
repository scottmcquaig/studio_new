
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users, Pencil, CalendarClock, Crown, Shield, UserX, UserCheck, Save, PlusCircle, Trash2, ShieldCheck, UserCog, Upload, UserSquare, Mail, KeyRound, User, Lock, Building, MessageSquareQuote, ListChecks, RotateCcw, ArrowLeft, MoreHorizontal, Send, MailQuestion, UserPlus2, SortAsc, ShieldQuestion, ChevronsUpDown, Plus, BookCopy } from "lucide-react";
import { MOCK_USERS, MOCK_TEAMS, MOCK_SEASONS, MOCK_COMPETITIONS, MOCK_LEAGUES, MOCK_SCORING_RULES } from "@/lib/data";
import type { User as UserType, Team, UserRole, Contestant, Competition, League, ScoringRule, UserStatus, Season, ScoringRuleSet, LeagueScoringBreakdownCategory } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { app } from '@/lib/firebase';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, query, getDoc } from 'firebase/firestore';
import { SheetHeader, SheetTitle } from './ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';


export function AdminPanel() {
  const { toast } = useToast();
  const db = getFirestore(app);
  
  const [leagueSettings, setLeagueSettings] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  const [activeSeason, setActiveSeason] = useState<Season | null>(MOCK_SEASONS[0]);

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  const [scoringRuleSet, setScoringRuleSet] = useState<ScoringRuleSet | null>(null);
  
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingContestant, setEditingContestant] = useState<Contestant | null | 'new'>(null);
  
  const [selectedWeek, setSelectedWeek] = useState(activeSeason?.currentWeek || 1);
  const [isSpecialEventDialogOpen, setIsSpecialEventDialogOpen] = useState(false);
  
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isAddUserToLeagueDialogOpen, setIsAddUserToLeagueDialogOpen] = useState(false);

  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);

  const [newUserData, setNewUserData] = useState({ displayName: '', email: ''});
  const [addUserToLeagueData, setAddUserToLeagueData] = useState({ userId: '', teamId: '' });
  const [newRuleData, setNewRuleData] = useState({ code: '', label: '', points: 0 });
  const [specialEventData, setSpecialEventData] = useState({ contestantId: '', ruleCode: '', notes: '' });
  
  const [teamNames, setTeamNames] = useState<{[id: string]: string}>({});

  const [teamDraftOrders, setTeamDraftOrders] = useState<{[id: string]: number}>({});

  const [activeTab, setActiveTab] = useState('scoring');

  const scoringRules = scoringRuleSet?.rules || [];
  const specialEventRules = scoringRules.filter(r => ['PENALTY_RULE', 'SPECIAL_POWER'].includes(r.code)) || [];

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
    const sortedTeams = [...teams].sort((a,b) => (teamDraftOrders[a.id] ?? a.draftOrder) - (teamDraftOrders[b.id] ?? b.draftOrder));
    if (JSON.stringify(sortedTeams) !== JSON.stringify(teams)) {
        setTeams(sortedTeams);
    }
  }, [teamDraftOrders, teams]);
  
  const displayedTeams = Array.from({ length: leagueSettings?.maxTeams || 0 }, (_, i) => {
    return teams[i] || {
        id: `team_${i + 1}_placeholder`,
        leagueId: leagueSettings?.id || '',
        name: `Team ${i + 1}`,
        ownerUserIds: [],
        contestantIds: [],
        faab: 100,
        createdAt: new Date().toISOString(),
        total_score: 0,
        weekly_score: 0,
        draftOrder: i + 1,
        weekly_score_breakdown: { week4: [] }
    };
  });


  useEffect(() => {
    const contestantsCol = collection(db, "contestants");
    const unsubscribeContestants = onSnapshot(contestantsCol, (querySnapshot) => {
        const contestantData: Contestant[] = [];
        querySnapshot.forEach((doc) => {
            contestantData.push({ ...doc.data(), id: doc.id } as Contestant);
        });
        setContestants(contestantData);
    });
    
    const teamsCol = collection(db, "teams");
    const qTeams = query(teamsCol);
    const unsubscribeTeams = onSnapshot(qTeams, (querySnapshot) => {
      if (!querySnapshot.empty) {
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
      } else {
        console.log("No teams documents found, using mock data.");
        setTeams(MOCK_TEAMS);
        const mockTeamNames: {[id: string]: string} = {};
        const mockDraftOrders: {[id: string]: number} = {};
        MOCK_TEAMS.forEach(team => {
            mockTeamNames[team.id] = team.name;
            mockDraftOrders[team.id] = team.draftOrder;
        });
        setTeamNames(mockTeamNames);
        setTeamDraftOrders(mockDraftOrders);
      }
    });

    const leagueDocRef = doc(db, "leagues", "bb27");
    const unsubscribeLeagues = onSnapshot(leagueDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const leagueData = { ...docSnap.data(), id: docSnap.id } as League;
            setLeagueSettings(leagueData);

            if (leagueData.settings.scoringRuleSetId) {
                const ruleSetDocRef = doc(db, 'scoring_rules', leagueData.settings.scoringRuleSetId);
                const unsubscribeRules = onSnapshot(ruleSetDocRef, (ruleSnap) => {
                    if (ruleSnap.exists()) {
                        setScoringRuleSet({ id: ruleSnap.id, ...ruleSnap.data() } as ScoringRuleSet);
                    } else {
                        setScoringRuleSet(MOCK_SCORING_RULES.find(rs => rs.id === leagueData.settings.scoringRuleSetId) || null);
                    }
                });
                // In a real app, you would manage this unsubscribe
            }
        } else {
            console.log("No league documents found, using mock data.");
            setLeagueSettings(MOCK_LEAGUES[0] || null);
             if (MOCK_LEAGUES[0]?.settings.scoringRuleSetId) {
                const ruleset = MOCK_SCORING_RULES.find(rs => rs.id === MOCK_LEAGUES[0].settings.scoringRuleSetId);
                setScoringRuleSet(ruleset || null);
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
        unsubscribeContestants();
        unsubscribeLeagues();
        unsubscribeTeams();
        unsubscribeUsers();
    };
  }, [db]);


  const activeContestants = contestants.filter(hg => hg.status === 'active');
  const weekEvents = competitions.filter(c => c.week === selectedWeek);
  
  const hoh = weekEvents.find(c => c.type === 'HOH');
  const pov = weekEvents.find(c => c.type === 'VETO');
  const noms = weekEvents.find(c => c.type === 'NOMINATIONS');
  const eviction = weekEvents.find(c => c.type === 'EVICTION');
  const blockBuster = weekEvents.find(c => c.type === 'BLOCK_BUSTER');
  const weekOptions = Array.from({ length: activeSeason?.currentWeek || 1 }, (_, i) => i + 1).reverse();


  const [nominees, setNominees] = useState<string[]>(noms?.nominees || ['', '']);

    useEffect(() => {
        setNominees(noms?.nominees || ['', '']);
    }, [selectedWeek, competitions]);

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

    // Remove user from any other team first
    const updatedTeams = teams.map(t => {
        if (t.ownerUserIds.includes(user.id)) {
            return { ...t, ownerUserIds: t.ownerUserIds.filter(id => id !== user.id) };
        }
        return t;
    });

    // Add user to the selected team
    const finalTeams = updatedTeams.map(t => {
        if (t.id === team.id) {
            return { ...t, ownerUserIds: [...t.ownerUserIds, user.id] };
        }
        return t;
    });

    try {
        const batch = [];
        finalTeams.forEach(t => {
            const teamDocRef = doc(db, 'teams', t.id);
            batch.push(updateDoc(teamDocRef, { ownerUserIds: t.ownerUserIds }));
        });
        await Promise.all(batch);

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

    const updatedOwnerIds = team.ownerUserIds.filter(id => id !== userId);
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
    try {
        const leagueDocRef = doc(db, 'leagues', leagueSettings.id);
        const leagueDataToSave = {
            name: leagueSettings.name,
            maxTeams: leagueSettings.maxTeams,
            contestantTerm: leagueSettings.contestantTerm,
        };
        await setDoc(leagueDocRef, leagueDataToSave, { merge: true });

        const seasonDocRef = doc(db, 'seasons', activeSeason.id);
        await setDoc(seasonDocRef, { title: activeSeason.title }, { merge: true });
        
        toast({ title: "Changes Saved", description: `League settings have been saved.` });
    } catch (error) {
        console.error(`Error saving league settings: `, error);
        toast({ title: "Error", description: `Could not save league settings.`, variant: "destructive" });
    }
  };
  
  const handleSaveTeamsAndUsers = async () => {
     if (!leagueSettings) return;

     try {
        const teamPromises = displayedTeams.map(team => {
            if(team.id.endsWith('_placeholder')) return null;
            const teamDocRef = doc(db, 'teams', team.id);
            const dataToSave: Partial<Team> = {
                name: teamNames[team.id] || team.name,
                draftOrder: teamDraftOrders[team.id] || team.draftOrder,
            };
            return updateDoc(teamDocRef, dataToSave);
        }).filter(Boolean);

        await Promise.all(teamPromises as Promise<void>[]);
        
        toast({ title: "Changes Saved", description: `Team and user settings have been saved.` });
    } catch (error) {
        console.error(`Error saving teams/users: `, error);
        toast({ title: "Error", description: `Could not save teams and users.`, variant: "destructive" });
    }
  };

  const handleSaveRules = async () => {
      if (!scoringRuleSet || !leagueSettings) return;
      try {
          const rulesetDocRef = doc(db, 'scoring_rules', scoringRuleSet.id);
          await setDoc(rulesetDocRef, { rules: scoringRuleSet.rules }, { merge: true });
          
          const leagueDocRef = doc(db, 'leagues', leagueSettings.id);
          await setDoc(leagueDocRef, {
              'settings.scoringBreakdownCategories': leagueSettings.settings.scoringBreakdownCategories,
          }, { merge: true });

          toast({ title: "Changes Saved", description: `Scoring rules and breakdowns have been saved.` });
      } catch (error) {
          console.error(`Error saving rules: `, error);
          toast({ title: "Error", description: `Could not save scoring rules.`, variant: "destructive" });
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
    const updatedRules = [...scoringRuleSet.rules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
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

  const handleBreakdownCategoryChange = (index: number, field: keyof LeagueScoringBreakdownCategory, value: string | string[]) => {
      if (!leagueSettings) return;
      const updatedCategories = [...leagueSettings.settings.scoringBreakdownCategories];
      
      let finalValue = value;
      if (field === 'displayName' && typeof value === 'string' && value.length > 12) {
          finalValue = value.substring(0, 12);
          toast({ title: "Character Limit", description: "Display names are limited to 12 characters.", variant: "destructive"});
      }

      (updatedCategories[index] as any)[field] = finalValue;
      
      setLeagueSettings({
          ...leagueSettings,
          settings: {
              ...leagueSettings.settings,
              scoringBreakdownCategories: updatedCategories,
          },
      });
  };
  
  
  if (!leagueSettings || !activeSeason) {
    return <div>Loading...</div>;
  }

  const getTeamForUser = (user: UserType): Team | undefined => {
    return teams.find(team => team.ownerUserIds.includes(user.id));
  };
  
  const getUsersForTeam = (teamId: string): UserType[] => {
      const team = teams.find(t => t.id === teamId);
      if (!team) return [];
      return users.filter(u => team.ownerUserIds.includes(u.id));
  };

  const contestantTerm = leagueSettings.contestantTerm;

  const handleOpenContestantDialog = (contestant: Contestant | 'new') => {
    if (contestant === 'new') {
        const newContestant: Contestant = {
            id: `new_contestant_${Date.now()}`,
            seasonId: activeSeason.id,
            fullName: '',
            age: 0,
            hometown: '',
            occupation: '',
            status: 'active',
            enteredDay: 1,
            photoUrl: 'https://placehold.co/100x100.png'
        };
        setEditingContestant(newContestant);
    } else {
        setEditingContestant(contestant);
    }
  };
  
  const handleUpdateContestant = (field: keyof Contestant, value: string | number | boolean) => {
    if (editingContestant && editingContestant !== 'new') {
      setEditingContestant({ ...editingContestant, [field]: value });
    }
  };

  const handleSaveContestant = async () => {
      if (!editingContestant || editingContestant === 'new') return;
  
      const contestantData = { ...editingContestant };
      const isNew = !contestants.some(c => c.id === editingContestant.id);
      
      delete (contestantData as any).id;
  
      try {
          if (isNew) {
              await addDoc(collection(db, 'contestants'), contestantData);
              toast({ title: "Contestant Added", description: `${editingContestant.fullName} has been added.` });
          } else {
              const contestantDoc = doc(db, 'contestants', editingContestant.id);
              await updateDoc(contestantDoc, contestantData);
              toast({ title: "Contestant Updated", description: `${editingContestant.fullName} has been updated.` });
          }
          setEditingContestant(null);
      } catch (error) {
          console.error("Error saving contestant: ", error);
          toast({ title: "Error", description: "Could not save contestant details.", variant: "destructive" });
      }
  };
  
  const handleDeleteContestant = async () => {
      if (!editingContestant || editingContestant === 'new') return;
      if (!window.confirm(`Are you sure you want to delete ${editingContestant.fullName}?`)) return;
      
      try {
          const contestantDoc = doc(db, 'contestants', editingContestant.id);
          await deleteDoc(contestantDoc);
          toast({ title: "Contestant Deleted", description: `${editingContestant.fullName} has been removed.` });
          setEditingContestant(null);
      } catch (error) {
          console.error("Error deleting contestant: ", error);
          toast({ title: "Error", description: "Could not delete contestant.", variant: "destructive" });
      }
  };

  const allAssignedUserIds = teams.flatMap(t => t.ownerUserIds);
  const unassignedUsers = users.filter(u => !allAssignedUserIds.includes(u.id));

  return (
    <div className="flex flex-col h-full">
       <SheetHeader className="px-4 sm:px-6 pt-6">
         <SheetTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Admin Panel
        </SheetTitle>
       </SheetHeader>
      
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scoring">Scoring</TabsTrigger>
                <TabsTrigger value="contestants">Contestants</TabsTrigger>
                <TabsTrigger value="rules">Rules</TabsTrigger>
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
                            <Button variant="outline" size="sm" onClick={handleStartNewWeek}><Plus className="mr-2 h-4 w-4"/> New Week</Button>
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
                                    <Select value={hoh?.winnerId}>
                                        <SelectTrigger><SelectValue placeholder="Select HOH..." /></SelectTrigger>
                                        <SelectContent>
                                            {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
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
                                            <Select value={nomineeId} onValueChange={(value) => handleNomineeChange(index, value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Nominee..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeContestants
                                                        .filter(c => !nominees.includes(c.id) || nominees[index] === c.id)
                                                        .map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Button variant="ghost" size="icon" onClick={() => removeNomineeField(index)} className="h-9 w-9">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
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
                                        <Select value={pov?.winnerId}>
                                            <SelectTrigger><SelectValue placeholder="Select Veto Winner..." /></SelectTrigger>
                                            <SelectContent>
                                                {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="veto-used" checked={pov?.used} />
                                        <Label htmlFor="veto-used">Veto was used</Label>
                                    </div>
                                    {pov?.used && (
                                        <>
                                            <div>
                                                <Label>Used On (Saved)</Label>
                                                <Select value={pov?.usedOnId}>
                                                    <SelectTrigger><SelectValue placeholder="Select Player Saved..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {nominees?.map(nomId => {
                                                            const nom = contestants.find(c => c.id === nomId);
                                                            return nom ? <SelectItem key={nom.id} value={nom.id}>{nom.fullName}</SelectItem> : null;
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Replacement Nominee (Renom)</Label>
                                                <Select value={pov?.replacementNomId}>
                                                    <SelectTrigger><SelectValue placeholder="Select Replacement..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {activeContestants.filter(c => !nominees?.includes(c.id)).map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
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
                                     <Select value={blockBuster?.winnerId}>
                                        <SelectTrigger><SelectValue placeholder="Select Winner..." /></SelectTrigger>
                                        <SelectContent>
                                            {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
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
                                     <Select value={eviction?.evictedId}>
                                        <SelectTrigger><SelectValue placeholder="Select Evictee..." /></SelectTrigger>
                                        <SelectContent>
                                            {contestants.filter(c => c.status === 'active').map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                            <Card>
                                 <CardHeader>
                                    <DialogTitle className="flex items-center gap-2 text-base text-green-500"><ShieldQuestion className="h-4 w-4" /> Special Event</DialogTitle>
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
                                                            {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
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
                       <Button><Save className="mr-2"/>Save All Event Changes</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="contestants" className="mt-6">
                <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2"><UserSquare/> {contestantTerm.plural} Management</CardTitle>
                       <CardDescription>Manage contestant details for the league.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">{contestantTerm.plural} Roster</h3>
                                <Button size="sm" variant="outline" onClick={() => handleOpenContestantDialog('new')}><PlusCircle className="mr-2"/> Add {contestantTerm.singular}</Button>
                            </div>
                            <div className="space-y-2">
                                {contestants.map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={c.photoUrl} alt={c.fullName} />
                                                <AvatarFallback>{c.fullName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{c.fullName}</p>
                                                <p className="text-sm text-muted-foreground">{c.hometown}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenContestantDialog(c)}><Pencil className="mr-2 h-3 w-3" /> Edit</Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Dialog open={!!editingContestant} onOpenChange={(isOpen) => !isOpen && setEditingContestant(null)}>
                           <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingContestant === 'new' ? `Add New ${contestantTerm.singular}` : `Edit ${editingContestant?.fullName}`}</DialogTitle>
                                    <DialogDescription>
                                        Update the details for this {contestantTerm.singular}. Changes will be saved to the database.
                                    </DialogDescription>
                                </DialogHeader>
                                {editingContestant && editingContestant !== 'new' && (
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input value={editingContestant.fullName} onChange={(e) => handleUpdateContestant('fullName', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Age</Label>
                                            <Input type="number" value={editingContestant.age} onChange={(e) => handleUpdateContestant('age', Number(e.target.value))} />
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
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hometown</Label>
                                        <Input value={editingContestant.hometown} onChange={(e) => handleUpdateContestant('hometown', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Occupation</Label>
                                        <Input value={editingContestant.occupation} onChange={(e) => handleUpdateContestant('occupation', e.target.value)} />
                                    </div>
                                     <div className="space-y-2">
                                        <Label>Photo URL</Label>
                                        <Input value={editingContestant.photoUrl} onChange={(e) => handleUpdateContestant('photoUrl', e.target.value)} />
                                    </div>
                                </div>
                                )}
                                <DialogFooter className="justify-between">
                                    <div>
                                        {editingContestant !== 'new' && (
                                            <Button variant="destructive" onClick={handleDeleteContestant}>Delete</Button>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setEditingContestant(null)}>Cancel</Button>
                                        <Button onClick={handleSaveContestant}>Save Changes</Button>
                                    </div>
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
                                        <TableRow key={rule.code}>
                                            <TableCell>
                                                <Input value={rule.code} onChange={(e) => handleUpdateRule(index, 'code', e.target.value.toUpperCase())} className="h-8" />
                                            </TableCell>
                                            <TableCell>
                                                <Input value={rule.label} onChange={(e) => handleUpdateRule(index, 'label', e.target.value)} className="h-8" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input type="number" value={rule.points} onChange={(e) => handleUpdateRule(index, 'points', Number(e.target.value))} className="h-8 w-20 text-right" />
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveRule(rule.code)}>
                                                    <Trash2 className="h-4 w-4 text-red-500"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Separator/>
                        <div>
                            <h3 className="text-lg font-medium mb-2">Scoring Breakdown Categories</h3>
                            <p className="text-sm text-muted-foreground mb-4">Customize how scores are displayed on team cards. Define up to 6 categories.</p>
                            <div className="space-y-4">
                                {leagueSettings.settings.scoringBreakdownCategories.map((category, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                                        <div>
                                            <Label>Display Name</Label>
                                            <Input 
                                                value={category.displayName} 
                                                onChange={(e) => handleBreakdownCategoryChange(index, 'displayName', e.target.value)}
                                                maxLength={12}
                                            />
                                        </div>
                                        <div>
                                            <Label>Associated Rule Codes</Label>
                                            {/* This should be a multi-select component in a real app */}
                                            <Input 
                                                value={category.ruleCodes.join(', ')} 
                                                onChange={(e) => handleBreakdownCategoryChange(index, 'ruleCodes', e.target.value.split(',').map(s => s.trim()))}
                                                placeholder="e.g., HOH_WIN, VETO_WIN"
                                            />
                                        </div>
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

            <TabsContent value="league" className="mt-6 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Settings /> General Settings</CardTitle>
                        <CardDescription>Manage league name, season, and terminology.</CardDescription>
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
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button onClick={handleSaveLeagueSettings}><Save className="mr-2"/>Save Settings</Button>
                    </CardFooter>
                </Card>

                <Accordion type="single" collapsible defaultValue="item-1">
                     <AccordionItem value="item-1">
                         <Card>
                            <AccordionTrigger className="w-full">
                               <CardHeader className="flex-row items-center justify-between w-full p-4">
                                 <div>
                                   <CardTitle className="flex items-center gap-2 text-lg"><UserCog /> Users &amp; Teams</CardTitle>
                                   <CardDescription className="text-left">Manage user roles, team names, assignments, and invitations.</CardDescription>
                                 </div>
                                 <ChevronsUpDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                               </CardHeader>
                            </AccordionTrigger>
                            <AccordionContent>
                                <CardContent className="space-y-6 p-4 pt-0">
                                  <div className="flex justify-between items-center">
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
                                    <div className="flex gap-2">
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
                                                                {displayedTeams.map(team => <SelectItem key={team.id} value={team.id}>{teamNames[team.id]}</SelectItem>)}
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
                                </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {displayedTeams.map((team, index) => (
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
                                                                            user.status === 'pending' && 'bg-background text-amber-600 border-amber-600'
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
                            </AccordionContent>
                         </Card>
                    </AccordionItem>
                </Accordion>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

    