
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users, Pencil, CalendarClock, Crown, Shield, UserX, UserCheck, Save, PlusCircle, Trash2, ShieldCheck, UserCog, Upload, UserSquare, Mail, KeyRound, User, Lock, Building, MessageSquareQuote, ListChecks, RotateCcw, ArrowLeft, MoreHorizontal, Send, MailQuestion, UserPlus2, SortAsc, ShieldQuestion } from "lucide-react";
import { MOCK_USERS, MOCK_TEAMS, MOCK_SEASONS, MOCK_COMPETITIONS, MOCK_SCORING_RULES, MOCK_LEAGUES } from "@/lib/data";
import type { User as UserType, Team, UserRole, Contestant, Competition, League, ScoringRule, UserStatus } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { app } from '@/lib/firebase';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, query } from 'firebase/firestore';
import { SheetHeader, SheetTitle } from './ui/sheet';


export function AdminPanel() {
  const { toast } = useToast();
  const db = getFirestore(app);
  
  const [leagueSettings, setLeagueSettings] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  const currentUser = MOCK_USERS.find(u => u.role === 'site_admin');
  const activeSeason = MOCK_SEASONS[0];

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(MOCK_SCORING_RULES.find(rs => rs.id === 'std_bb_rules_v1')?.rules || []);

  const specialEventRules = scoringRules.filter(r => ['PENALTY_RULE', 'SPECIAL_POWER'].includes(r.code)) || [];
  
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingContestant, setEditingContestant] = useState<Contestant | null | 'new'>(null);
  
  const [selectedWeek, setSelectedWeek] = useState(activeSeason.currentWeek);
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

    const leaguesCol = collection(db, "leagues");
    const unsubscribeLeagues = onSnapshot(leaguesCol, (querySnapshot) => {
        if (!querySnapshot.empty) {
            const firstLeagueDoc = querySnapshot.docs[0];
            setLeagueSettings({ ...firstLeagueDoc.data(), id: firstLeagueDoc.id } as League);
        } else {
            console.log("No league documents found, using mock data.");
            setLeagueSettings(MOCK_LEAGUES[0] || null);
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
  const weekOptions = Array.from({ length: activeSeason.totalWeeks || activeSeason.currentWeek }, (_, i) => i + 1);

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
  
  const handleAddUserToLeague = () => {
     if (!addUserToLeagueData.userId || !addUserToLeagueData.teamId) {
        toast({ title: "Error", description: "Please select a user and a team.", variant: 'destructive' });
        return;
    }
    const user = users.find(u => u.id === addUserToLeagueData.userId);
    const team = teams.find(t => t.id === addUserToLeagueData.teamId);
    
    setTeams(currentTeams => 
        currentTeams.map(t => {
            let ownerIds = t.ownerUserIds || [];
            // Remove user from any other team
            ownerIds = ownerIds.filter(uid => uid !== user!.id);
            // Add user to the new team
            if (t.id === team?.id) {
                ownerIds.push(user!.id);
            }
            return { ...t, ownerUserIds: ownerIds };
        })
    );
    
    toast({ title: "User Assigned", description: `${user?.displayName} has been assigned to ${team?.name}. Remember to save changes.` });
    setIsAddUserToLeagueDialogOpen(false);
    setAddUserToLeagueData({ userId: '', teamId: '' });
  };
  
  const handleRemoveUserFromTeam = (userId: string, teamId: string) => {
    setTeams(currentTeams => 
        currentTeams.map(t => {
            if (t.id === teamId) {
                return { ...t, ownerUserIds: t.ownerUserIds.filter(uid => uid !== userId) };
            }
            return t;
        })
    );
    const user = users.find(u => u.id === userId);
    toast({ title: "User Unassigned", description: `${user?.displayName} has been unassigned. Remember to save changes.` });
  };


  const handleUserAction = (action: 'resend' | 'reset', user: UserType) => {
    if (action === 'resend') {
        toast({ title: "Invitation Resent", description: `Invitation has been resent to ${user.email}.` });
    }
    if (action === 'reset') {
        toast({ title: "Password Reset Sent", description: `A password reset link has been sent to ${user.email}.` });
    }
  };

  const handleSaveChanges = async (section?: string) => {
    if (!leagueSettings) return;

    if (section === 'League Settings') {
        try {
            const leagueDocRef = doc(db, 'leagues', leagueSettings.id);
            await setDoc(leagueDocRef, leagueSettings, { merge: true });
            
            const rulesetDocRef = doc(db, 'scoring_rules', leagueSettings.settings.scoringRuleSetId);
            await setDoc(rulesetDocRef, { rules: scoringRules }, { merge: true });
            
            toast({ title: "League & Scoring Saved", description: "Your changes have been saved to the database." });
        } catch (error) {
            console.error("Error saving league settings: ", error);
            toast({ title: "Error", description: "Could not save league settings.", variant: "destructive" });
        }
    } else {
        toast({ title: "Changes Saved", description: `${section || 'All updates'} have been saved.` });
    }

    if(editingContestant) {
        setEditingContestant(null);
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

  const handleUpdateRule = (code: string, field: 'label' | 'points', value: string | number) => {
    setScoringRules(currentRules =>
      currentRules.map(rule =>
        rule.code === code ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleAddRule = () => {
    if (!newRuleData.code || !newRuleData.label) {
        toast({ title: "Error", description: "Rule code and label are required.", variant: 'destructive' });
        return;
    }
    setScoringRules([...scoringRules, newRuleData]);
    setIsAddRuleDialogOpen(false);
    setNewRuleData({ code: '', label: '', points: 0 });
    toast({ title: "Rule Added", description: "The new scoring rule has been added. Remember to save changes." });
  };

  const handleRemoveRule = (codeToRemove: string) => {
    setScoringRules(currentRules => currentRules.filter(rule => rule.code !== codeToRemove));
    toast({ title: "Rule Removed", description: "The scoring rule has been removed. Remember to save changes." });
  };
  
  const handleAssignTeam = (userId: string, teamId: string) => {
    console.log(`Assigning user ${userId} to team ${teamId}`);
    toast({ title: "Team Assigned", description: `User has been assigned to a new team.` });
  };
  
  if (!leagueSettings) {
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

  const handleSaveTerminology = async () => {
    if (!leagueSettings) return;

    try {
        const leagueDoc = doc(db, 'leagues', leagueSettings.id);
        await setDoc(leagueDoc, {
            contestantTerm: leagueSettings.contestantTerm
        }, { merge: true });
        toast({ title: "Terminology Updated", description: "Your changes have been saved." });
    } catch (error) {
        console.error("Error saving terminology: ", error);
        toast({ title: "Error", description: "Could not save terminology.", variant: "destructive" });
    }
  };
  
  const handleSaveTeams = async () => {
    const promises = displayedTeams.map(team => {
        if(team.id.endsWith('_placeholder')) return;
        const teamDocRef = doc(db, 'teams', team.id);
        const dataToSave = {
            id: team.id,
            leagueId: team.leagueId,
            name: teamNames[team.id] || team.name,
            draftOrder: teamDraftOrders[team.id] || team.draftOrder,
            ownerUserIds: team.ownerUserIds,
            contestantIds: team.contestantIds || [],
        };
        return setDoc(teamDocRef, dataToSave, { merge: true });
    }).filter(Boolean);
    try {
        await Promise.all(promises);
        toast({ title: "Team Changes Saved", description: "Team names and draft order have been updated." });
    } catch (error) {
        console.error("Error saving team changes: ", error);
        toast({ title: "Error", description: "Could not save team changes.", variant: "destructive" });
    }
  };
  
  const handleSaveUserAndTeamChanges = async () => {
    const teamPromises = teams.map(team => {
        const teamDocRef = doc(db, 'teams', team.id);
        return setDoc(teamDocRef, { ownerUserIds: team.ownerUserIds }, { merge: true });
    });

    try {
        await Promise.all(teamPromises);
        toast({ title: "User & Team Changes Saved", description: "User assignments have been updated." });
    } catch (error) {
        console.error("Error saving user and team changes: ", error);
        toast({ title: "Error", description: "Could not save user assignments.", variant: "destructive" });
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
        <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="contestants">Contestants</TabsTrigger>
                <TabsTrigger value="league">League Settings</TabsTrigger>
                <TabsTrigger value="users">Users & Teams</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-6">
                <Card>
                    <CardHeader>
                       <div className="flex justify-between items-center">
                         <div>
                           <CardTitle className="flex items-center gap-2"><CalendarClock/> Weekly Event Management</CardTitle>
                           <CardDescription>Update results for the selected week.</CardDescription>
                         </div>
                         <div className="w-32">
                             <Select value={String(selectedWeek)} onValueChange={(val) => setSelectedWeek(Number(val))}>
                               <SelectTrigger><SelectValue/></SelectTrigger>
                               <SelectContent>
                                 {weekOptions.map(week => <SelectItem key={week} value={String(week)}>Week {week}</SelectItem>)}
                               </SelectContent>
                             </Select>
                         </div>
                       </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         {/* Weekly Event Forms will go here, using state derived from selectedWeek */}
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
                                    <CardTitle className="flex items-center gap-2 text-base text-red-500"><Users className="h-4 w-4" /> Nominations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Label>Nominees</Label>
                                    <div className="space-y-2 mt-2">
                                    {activeContestants.map(hg => (
                                        <div key={hg.id} className="flex items-center gap-2">
                                            <Checkbox id={`nom-${hg.id}`} checked={noms?.nominees?.includes(hg.id)} />
                                            <Label htmlFor={`nom-${hg.id}`}>{hg.fullName}</Label>
                                        </div>
                                    ))}
                                    </div>
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
                                                <Label>Used On</Label>
                                                <Select value={pov?.usedOnId}>
                                                    <SelectTrigger><SelectValue placeholder="Select Player Saved..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {noms?.nominees?.map(nomId => {
                                                            const nom = contestants.find(c => c.id === nomId);
                                                            return nom ? <SelectItem key={nom.id} value={nom.id}>{nom.fullName}</SelectItem> : null;
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Replacement Nominee</Label>
                                                <Select value={pov?.replacementNomId}>
                                                    <SelectTrigger><SelectValue placeholder="Select Replacement..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {activeContestants.filter(c => !noms?.nominees?.includes(c.id)).map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
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
                                    <DialogHeader>
                                        <CardTitle className="flex items-center gap-2 text-base text-green-500"><ShieldQuestion className="h-4 w-4" /> Special Event</CardTitle>
                                    </DialogHeader>
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
                       <Button onClick={() => handleSaveChanges('Event')}><Save className="mr-2"/>Save Event Changes</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="contestants" className="mt-6">
                <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2"><UserSquare/> Contestant Management</CardTitle>
                       <CardDescription>Manage contestant details, status, and terminology for the league.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div className="space-y-4">
                           <h3 className="text-lg font-medium flex items-center gap-2"><MessageSquareQuote/> Terminology</h3>
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
                           <div className="flex justify-end mt-2">
                            <Button onClick={handleSaveTerminology}><Save className="mr-2"/>Save Terminology</Button>
                           </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Contestant Roster</h3>
                                <Button size="sm" variant="outline" onClick={() => handleOpenContestantDialog('new')}><PlusCircle className="mr-2"/> Add Contestant</Button>
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
                                    <DialogTitle>{editingContestant === 'new' ? 'Add New Contestant' : `Edit ${editingContestant?.fullName}`}</DialogTitle>
                                    <DialogDescription>
                                        Update the details for this contestant. Changes will be saved to the database.
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

            <TabsContent value="league" className="mt-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck /> League Settings</CardTitle>
                        <CardDescription>Manage core settings for the league.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="leagueName">League Name</Label>
                                    <Input id="leagueName" value={leagueSettings.name} onChange={(e) => setLeagueSettings({...leagueSettings, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="seasonName">Season Name</Label>
                                    <Input id="seasonName" value={activeSeason.title} readOnly disabled />
                                </div>
                                <div className="space-y-2">
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
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button onClick={() => handleSaveChanges('League Settings')}><Save className="mr-2"/>Save League Settings</Button>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2"><ListChecks/> Scoring Rules</CardTitle>
                                <CardDescription>Manage points for all scoring events.</CardDescription>
                            </div>
                            <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm"><PlusCircle className="mr-2"/>Add Rule</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Scoring Rule</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Event Code</Label>
                                            <Input 
                                                value={newRuleData.code}
                                                onChange={(e) => setNewRuleData({...newRuleData, code: e.target.value.toUpperCase().replace(/\s/g, '_')})}
                                                placeholder="e.g., CUSTOM_EVENT"
                                            />
                                            <p className="text-xs text-muted-foreground">A unique, uppercase identifier for the rule.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Label</Label>
                                            <Input
                                                value={newRuleData.label}
                                                onChange={(e) => setNewRuleData({...newRuleData, label: e.target.value})}
                                                placeholder="e.g., Wins a secret power"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Points</Label>
                                            <Input
                                                type="number"
                                                value={newRuleData.points}
                                                onChange={(e) => setNewRuleData({...newRuleData, points: Number(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddRuleDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleAddRule}>Add Rule</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {scoringRules.map(rule => (
                            <div key={rule.code} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-8 space-y-1">
                                    <Label htmlFor={`rule-label-${rule.code}`}>Label</Label>
                                    <Input
                                        id={`rule-label-${rule.code}`}
                                        value={rule.label}
                                        onChange={(e) => handleUpdateRule(rule.code, 'label', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-3 space-y-1">
                                    <Label htmlFor={`rule-points-${rule.code}`}>Points</Label>
                                    <Input
                                        id={`rule-points-${rule.code}`}
                                        type="number"
                                        value={rule.points}
                                        onChange={(e) => handleUpdateRule(rule.code, 'points', Number(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-1 self-end">
                                     <Button variant="ghost" size="icon" onClick={() => handleRemoveRule(rule.code)} className="h-9 w-9">
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="users" className="mt-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2"><UserCog /> Users & Teams</CardTitle>
                                <CardDescription>Manage user roles, team names, assignments, and invitations.</CardDescription>
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
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Teams</h3>
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
                                                                user.status === 'pending' && 'text-amber-600 border-amber-600'
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
                             <div className="flex justify-end gap-2">
                                <Button onClick={handleSaveTeams}><Save className="mr-2"/>Save Team Changes</Button>
                                <Button onClick={handleSaveUserAndTeamChanges}><Save className="mr-2"/>Save User Assignments</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
