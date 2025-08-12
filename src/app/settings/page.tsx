

"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users, Pencil, CalendarClock, Crown, Shield, UserX, UserCheck, Save, PlusCircle, Trash2, ShieldCheck, UserCog, Upload, UserSquare, Mail, KeyRound, User, Lock, Building, MessageSquareQuote, ListChecks, RotateCcw } from "lucide-react";
import { MOCK_USERS, MOCK_TEAMS, MOCK_LEAGUES, MOCK_CONTESTANTS, MOCK_SEASONS, MOCK_COMPETITIONS, MOCK_SCORING_RULES } from "@/lib/data";
import type { User as UserType, Team, UserRole, Contestant, Competition, League, ScoringRule } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// For this prototype, we'll assume the logged-in user is the first site admin found.
const currentUser = MOCK_USERS.find(u => u.role === 'site_admin');
const activeSeason = MOCK_SEASONS[0];


export default function SettingsPage() {
  const { toast } = useToast();
  const [isAdminView, setIsAdminView] = useState(false);

  // Admin state
  const [users, setUsers] = useState<UserType[]>(MOCK_USERS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [league, setLeague] = useState<League>(MOCK_LEAGUES[0]);
  const [contestants, setContestants] = useState<Contestant[]>(MOCK_CONTESTANTS);
  const [competitions, setCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(MOCK_SCORING_RULES.find(rs => rs.id === 'std_bb_rules_v1')?.rules || []);

  const specialEventRules = scoringRules.filter(r => ['PENALTY_RULE', 'SPECIAL_POWER'].includes(r.code)) || [];
  
  const contestantTerm = league.contestantTerm;
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(activeSeason.currentWeek);
  const [isSpecialEventDialogOpen, setIsSpecialEventDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);

  const [newUserData, setNewUserData] = useState({
    displayName: '',
    email: '',
    role: 'player' as UserRole,
    teamId: 'unassigned'
  });
  
  const [newRuleData, setNewRuleData] = useState({ code: '', label: '', points: 0 });

  const [specialEventData, setSpecialEventData] = useState({
      contestantId: '',
      ruleCode: '',
      notes: ''
  });

  const activeContestants = contestants.filter(hg => hg.status === 'active');
  const weekEvents = competitions.filter(c => c.week === selectedWeek);
  
  const hoh = weekEvents.find(c => c.type === 'HOH');
  const pov = weekEvents.find(c => c.type === 'VETO');
  const noms = weekEvents.find(c => c.type === 'NOMINATIONS');
  const eviction = weekEvents.find(c => c.type === 'EVICTION');
  const blockBuster = weekEvents.find(c => c.type === 'BLOCK_BUSTER');
  const weekOptions = Array.from({ length: activeSeason.totalWeeks || activeSeason.currentWeek }, (_, i) => i + 1);

  const handleAddUser = () => {
    if (!newUserData.email.trim() || !newUserData.displayName.trim()) {
      toast({ title: "Error", description: "Please enter a valid display name and email.", variant: "destructive" });
      return;
    }
    const newUser: UserType = {
      id: `user_${newUserData.email.split('@')[0].toLowerCase()}`,
      displayName: newUserData.displayName,
      email: newUserData.email,
      createdAt: new Date().toISOString(),
      role: newUserData.role,
      status: 'pending',
    };

    let updatedTeams = [...teams];
    if (newUserData.teamId !== 'unassigned') {
        updatedTeams = teams.map(team => {
            if (team.id === newUserData.teamId) {
                return {...team, ownerUserIds: [...team.ownerUserIds, newUser.id]};
            }
            return team;
        });
    }

    setUsers([...users, newUser]);
    setTeams(updatedTeams);
    setNewUserData({ displayName: '', email: '', role: 'player', teamId: 'unassigned' });
    setIsAddUserDialogOpen(false);
    toast({ title: "Success!", description: `User ${newUser.displayName} created and invite sent!` });
  };

  const handleSaveChanges = (section?: string) => {
    const message = section ? `${section} changes saved.` : "All updates have been saved.";
    console.log("Saving changes for:", section || "All sections");
    toast({ title: "Changes Saved", description: message });
  };

  const handleAssignTeam = (userId: string, teamId: string) => {
    const updatedTeams = teams.map(team => {
      let newOwnerIds = team.ownerUserIds.filter(id => id !== userId);
      if (team.id === teamId) {
        if (!newOwnerIds.includes(userId)) {
          newOwnerIds.push(userId);
        }
      }
      return { ...team, ownerUserIds: newOwnerIds };
    });
    setTeams(updatedTeams);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
  };

  const handleUpdateContestant = () => {
      if(!editingContestant) return;
      setContestants(contestants.map(hg => hg.id === editingContestant.id ? editingContestant : hg));
      setEditingContestant(null);
  }
  
  const handleRoleChange = (userId: string, role: UserRole) => {
    setUsers(users.map(u => u.id === userId ? {...u, role, managedLeagueIds: role === 'league_admin' ? u.managedLeagueIds || [] : undefined} : u));
  }
  
  const handleEventUpdate = (type: 'HOH' | 'VETO', value: string) => {
    let newCompetitions = [...competitions];
    let event = newCompetitions.find(c => c.week === selectedWeek && c.type === type);
    
    if (!event) {
      event = { id: `bb27_wk${selectedWeek}_${type.toLowerCase()}`, seasonId: 'bb27', week: selectedWeek, type, airDate: new Date().toISOString() };
      newCompetitions.push(event);
    }
    
    event.winnerId = value as string;
    setCompetitions(newCompetitions);
  };

  const handleNomineeChange = (index: number, newId: string) => {
    const nomEvent = competitions.find(c => c.week === selectedWeek && c.type === 'NOMINATIONS');
    if (!nomEvent || !nomEvent.nominees) return;
    const updatedNominees = [...nomEvent.nominees];
    updatedNominees[index] = newId;
    setCompetitions(competitions.map(c => c.id === nomEvent.id ? {...c, nominees: updatedNominees} : c));
  }

  const handleNomineeResultChange = (nomineeId: string, result: 'safe' | 'evicted' | 'saved' | 'blockbuster' | '') => {
      let newCompetitions = [...competitions];
      
      // Clear previous results for this week
      let evictionEvent = newCompetitions.find(c => c.week === selectedWeek && c.type === 'EVICTION');
      if (evictionEvent && evictionEvent.evictedId === nomineeId) evictionEvent.evictedId = undefined;

      let blockBusterEvent = newCompetitions.find(c => c.week === selectedWeek && c.type === 'BLOCK_BUSTER');
      if (blockBusterEvent && blockBusterEvent.winnerId === nomineeId) blockBusterEvent.winnerId = undefined;

      let povEvent = newCompetitions.find(c => c.week === selectedWeek && c.type === 'VETO');
      if (povEvent && povEvent.usedOnId === nomineeId) povEvent.usedOnId = undefined;

      // Set new result
      if (result === 'evicted') {
          if (!evictionEvent) {
              evictionEvent = { id: `bb27_wk${selectedWeek}_eviction`, seasonId: 'bb27', week: selectedWeek, type: 'EVICTION', airDate: new Date().toISOString() };
              newCompetitions.push(evictionEvent);
          }
          evictionEvent.evictedId = nomineeId;
      } else if (result === 'blockbuster') {
          if (!blockBusterEvent) {
              blockBusterEvent = { id: `bb27_wk${selectedWeek}_block_buster`, seasonId: 'bb27', week: selectedWeek, type: 'BLOCK_BUSTER', airDate: new Date().toISOString() };
              newCompetitions.push(blockBusterEvent);
          }
          blockBusterEvent.winnerId = nomineeId;
      } else if (result === 'saved') {
          if (povEvent) {
              povEvent.usedOnId = nomineeId;
          } else { // create if doesn't exist
              const newPovEvent = { id: `bb27_wk${selectedWeek}_veto`, seasonId: 'bb27', week: selectedWeek, type: 'VETO' as const, airDate: new Date().toISOString(), used: true, usedOnId: nomineeId };
              newCompetitions.push(newPovEvent);
          }
      }
      setCompetitions(newCompetitions);
  };

  const handleRenomChange = (nomineeId: string, isChecked: boolean) => {
    let povEvent = competitions.find(c => c.week === selectedWeek && c.type === 'VETO');
    if (!povEvent) {
        povEvent = { id: `bb27_wk${selectedWeek}_veto`, seasonId: 'bb27', week: selectedWeek, type: 'VETO', airDate: new Date().toISOString() };
        setCompetitions([...competitions, povEvent]);
    }
    setCompetitions(currentCompetitions => currentCompetitions.map(c => 
        c.id === povEvent!.id ? { ...c, replacementNomId: isChecked ? nomineeId : undefined } : c
    ));
  }

  const handleAddNominee = () => {
    let nomEvent = competitions.find(c => c.week === selectedWeek && c.type === 'NOMINATIONS');
    if (!nomEvent) {
      const newNomEvent: Competition = { id: `bb27_wk${selectedWeek}_nominations`, seasonId: 'bb27', week: selectedWeek, type: 'NOMINATIONS', airDate: new Date().toISOString(), nominees: [''] };
      setCompetitions([...competitions, newNomEvent]);
    } else {
      const updatedCompetitions = competitions.map(c => {
        if (c.id === nomEvent!.id) {
          return { ...c, nominees: [...(c.nominees || []), ''] };
        }
        return c;
      });
      setCompetitions(updatedCompetitions);
    }
  };

  const handleRemoveNominee = (indexToRemove: number) => {
      const nomEvent = competitions.find(c => c.week === selectedWeek && c.type === 'NOMINATIONS');
      if (!nomEvent || !nomEvent.nominees) return;
      
      const updatedNominees = nomEvent.nominees.filter((_, index) => index !== indexToRemove);
      
      const updatedCompetitions = competitions.map(c => {
          if (c.id === nomEvent.id) {
              return { ...c, nominees: updatedNominees };
          }
          return c;
      });
      setCompetitions(updatedCompetitions);
  };

  
  const handleAddSpecialEvent = () => {
    if (!specialEventData.contestantId || !specialEventData.ruleCode) {
        toast({ title: "Error", description: `Please select a ${contestantTerm.singular} and an event type.`, variant: "destructive" });
        return;
    }
    const newEvent: Competition = {
        id: `bb27_wk${selectedWeek}_special_${Date.now()}`,
        seasonId: 'bb27',
        week: selectedWeek,
        type: 'SPECIAL_EVENT',
        winnerId: specialEventData.contestantId,
        notes: specialEventData.notes,
        specialEventCode: specialEventData.ruleCode,
        airDate: new Date().toISOString()
    };
    setCompetitions([...competitions, newEvent]);
    setSpecialEventData({ contestantId: '', ruleCode: '', notes: '' });
    setIsSpecialEventDialogOpen(false);
    toast({ title: "Special Event Added", description: `Event logged for week ${selectedWeek}.` });
  }

  const handleTeamNameChange = (teamIndex: number, newName: string) => {
    setTeams(currentTeams => {
        const updatedTeams = [...currentTeams];
        if (updatedTeams[teamIndex]) {
            updatedTeams[teamIndex] = { ...updatedTeams[teamIndex], name: newName };
        }
        return updatedTeams;
    });
  }

  const handleUpdateRule = (code: string, field: 'label' | 'points', value: string) => {
    setScoringRules(currentRules =>
      currentRules.map(rule =>
        rule.code === code ? { ...rule, [field]: field === 'points' ? Number(value) : value } : rule
      )
    );
  };

  const handleAddRule = () => {
    if (!newRuleData.code.trim() || !newRuleData.label.trim()) {
      toast({ title: "Error", description: "Please provide a unique code and a label for the new rule.", variant: "destructive" });
      return;
    }
    if (scoringRules.some(rule => rule.code === newRuleData.code)) {
      toast({ title: "Error", description: `The event code "${newRuleData.code}" already exists. Please use a unique code.`, variant: "destructive" });
      return;
    }
    const newRule: ScoringRule = {
      code: newRuleData.code,
      label: newRuleData.label,
      points: newRuleData.points
    };
    setScoringRules([...scoringRules, newRule]);
    setNewRuleData({ code: '', label: '', points: 0 });
    setIsAddRuleDialogOpen(false);
    toast({ title: "Rule Added", description: `The rule "${newRule.label}" has been added.` });
  };

  const handleRemoveRule = (codeToRemove: string) => {
    setScoringRules(currentRules => currentRules.filter(rule => rule.code !== codeToRemove));
  };


  const canShowAdminView = currentUser?.role === 'site_admin' || currentUser?.role === 'league_admin';

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Settings
        </h1>
        {canShowAdminView && (
            <Button variant="outline" onClick={() => setIsAdminView(!isAdminView)}>
                {isAdminView ? <><User className="mr-2"/> User View</> : <><Building className="mr-2"/> Admin View</>}
            </Button>
        )}
      </header>
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
        {isAdminView && canShowAdminView ? (
          // Admin View
          <div className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => handleSaveChanges()}><Save className="mr-2 h-4 w-4"/>Save All Admin Changes</Button>
              </div>
              <Accordion type="multiple" className="w-full space-y-6" defaultValue={["events"]}>
                <AccordionItem value="events" asChild>
                    <Card>
                      <AccordionTrigger className="p-6">
                        <CardHeader className="p-0 text-left">
                           <CardTitle className="flex items-center gap-2"><CalendarClock/> Weekly Event Management</CardTitle>
                           <CardDescription>Update results for the selected week.</CardDescription>
                        </CardHeader>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                          <div className="w-40 mb-4">
                              <Label>Select Week</Label>
                              <Select value={String(selectedWeek)} onValueChange={(val) => setSelectedWeek(Number(val))}>
                                  <SelectTrigger><SelectValue/></SelectTrigger>
                                  <SelectContent>
                                      {weekOptions.map(week => <SelectItem key={week} value={String(week)}>Week {week}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
                                      <Label className="flex items-center gap-1 mb-1"><Crown className="text-primary"/>HOH Winner</Label>
                                      <Select value={hoh?.winnerId || ''} onValueChange={(val) => handleEventUpdate('HOH', val)}>
                                          <SelectTrigger><SelectValue placeholder="Select HOH..."/></SelectTrigger>
                                          <SelectContent>
                                              {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                  </div>
                                  <div>
                                      <Label className="flex items-center gap-1 mb-1"><Shield className="text-accent"/>Veto Winner</Label>
                                      <Select value={pov?.winnerId || ''} onValueChange={(val) => handleEventUpdate('VETO', val)}>
                                          <SelectTrigger><SelectValue placeholder="Select Veto Winner..."/></SelectTrigger>
                                          <SelectContent>
                                            {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                  </div>
                              </div>
                              <Separator/>
                              <div className="space-y-2">
                                <Label className="flex items-center gap-1 mb-1"><UserCheck className="text-red-400"/>Nominees & Results</Label>
                                <div className='space-y-4'>
                                  {(noms?.nominees || []).map((nomineeId, index) => {
                                      const isRenom = nomineeId === pov?.replacementNomId;
                                      let currentResult: 'safe' | 'evicted' | 'saved' | 'blockbuster' | '' = '';
                                      if (nomineeId === eviction?.evictedId) currentResult = 'evicted';
                                      else if (nomineeId === pov?.usedOnId) currentResult = 'saved';
                                      else if (nomineeId === blockBuster?.winnerId) currentResult = 'blockbuster';
                                      else if (nomineeId && noms?.nominees?.includes(nomineeId)) currentResult = 'safe';
                                    
                                    return (
                                      <div key={index} className="flex flex-col gap-3 p-3 border rounded-lg bg-background/50">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <Select value={nomineeId} onValueChange={(val) => handleNomineeChange(index, val)}>
                                                    <SelectTrigger><SelectValue placeholder={`Select Nominee ${index + 1}...`}/></SelectTrigger>
                                                    <SelectContent>
                                                        {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveNominee(index)} className="h-9 w-9">
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                        {nomineeId && (
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id={`renom-${nomineeId}`} checked={isRenom} onCheckedChange={(checked) => handleRenomChange(nomineeId, !!checked)}/>
                                                    <label htmlFor={`renom-${nomineeId}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        Replacement Nominee
                                                    </label>
                                                </div>
                                                <div className="w-full sm:w-auto">
                                                    <Select
                                                        value={currentResult}
                                                        onValueChange={(val) => handleNomineeResultChange(nomineeId, val as any)}
                                                    >
                                                        <SelectTrigger className="w-full sm:w-[150px]">
                                                            <SelectValue placeholder="Select Result..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="">Select Result...</SelectItem>
                                                            <SelectItem value="safe">Safe</SelectItem>
                                                            <SelectItem value="evicted">Evicted</SelectItem>
                                                            <SelectItem value="saved">Saved by Veto</SelectItem>
                                                            <SelectItem value="blockbuster">Block Buster</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                                <Button variant="outline" size="sm" onClick={handleAddNominee} className="mt-2">
                                    <PlusCircle className="mr-2 h-4 w-4"/> Add Nominee
                                </Button>
                              </div>
                              <Separator/>
                              <div className="flex justify-between items-center gap-2">
                                  <Dialog open={isSpecialEventDialogOpen} onOpenChange={setIsSpecialEventDialogOpen}>
                                      <DialogTrigger asChild>
                                          <Button variant="outline"><PlusCircle className="mr-2"/>Log Special Event</Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                          <DialogHeader>
                                              <DialogTitle>Log a Special Scoring Event</DialogTitle>
                                              <CardDescription>Use for non-standard events like winning a power or penalties.</CardDescription>
                                          </DialogHeader>
                                          <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                  <Label>{contestantTerm.singular}</Label>
                                                  <Select value={specialEventData.contestantId} onValueChange={(val) => setSpecialEventData({...specialEventData, contestantId: val})}>
                                                      <SelectTrigger><SelectValue placeholder={`Select a ${contestantTerm.singular.toLowerCase()}...`}/></SelectTrigger>
                                                      <SelectContent>
                                                          {activeContestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                                                      </SelectContent>
                                                  </Select>
                                            </div>
                                            <div className="space-y-2">
                                                  <Label>Event Type</Label>
                                                  <Select value={specialEventData.ruleCode} onValueChange={(val) => setSpecialEventData({...specialEventData, ruleCode: val})}>
                                                      <SelectTrigger><SelectValue placeholder="Select event type..."/></SelectTrigger>
                                                      <SelectContent>
                                                          {specialEventRules.map(rule => <SelectItem key={rule.code} value={rule.code}>{rule.label} ({rule.points > 0 ? '+':''}{rule.points} pts)</SelectItem>)}
                                                      </SelectContent>
                                                  </Select>
                                            </div>
                                            <div className="space-y-2">
                                                  <Label>Notes / Description</Label>
                                                  <Textarea value={specialEventData.notes} onChange={(e) => setSpecialEventData({...specialEventData, notes: e.target.value})} placeholder="e.g., Won the 'Secret Power of Invisibility'"/>
                                            </div>
                                          </div>
                                          <DialogFooter>
                                              <Button variant="outline" onClick={() => setIsSpecialEventDialogOpen(false)}>Cancel</Button>
                                              <Button onClick={handleAddSpecialEvent}>Add Event</Button>
                                          </DialogFooter>
                                      </DialogContent>
                                  </Dialog>
                                  <div className="flex gap-2">
                                      <Button variant="outline" disabled={selectedWeek !== activeSeason.currentWeek}>Start Next Week</Button>
                                  </div>
                              </div>
                          </div>
                          <CardFooter className="justify-end p-0 pt-6">
                            <Button onClick={() => handleSaveChanges('Weekly Events')}><Save className="mr-2"/>Save Event Changes</Button>
                          </CardFooter>
                      </AccordionContent>
                    </Card>
                </AccordionItem>
                 <AccordionItem value="contestants" asChild>
                    <Card>
                      <AccordionTrigger className="p-6">
                        <CardHeader className="p-0 text-left">
                           <CardTitle className="flex items-center gap-2"><UserSquare/> {contestantTerm.plural} Roster</CardTitle>
                           <CardDescription>Edit {contestantTerm.plural.toLowerCase()} information and photos.</CardDescription>
                        </CardHeader>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {contestants.map(hg => (
                                    <div key={hg.id} className="flex items-center justify-between p-2 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={hg.photoUrl || "https://placehold.co/100x100.png"}
                                                alt={hg.fullName}
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                                data-ai-hint="portrait person"
                                            />
                                            <div>
                                                <p className="font-medium">{hg.fullName}</p>
                                                <Badge 
                                                  variant={hg.status === 'active' ? 'default' : 'destructive'} 
                                                  className={cn('h-fit text-xs mt-1', hg.status === 'active' && 'bg-green-600 text-white')}>
                                                    {hg.status.charAt(0).toUpperCase() + hg.status.slice(1)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Dialog onOpenChange={(open) => !open && setEditingContestant(null)}>
                                            <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingContestant({...hg})}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            </DialogTrigger>
                                            {editingContestant && editingContestant.id === hg.id && (
                                            <DialogContent>
                                                <DialogHeader>
                                                <DialogTitle>Edit {contestantTerm.singular}: {editingContestant.fullName}</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="hgName">Full Name</Label>
                                                    <Input id="hgName" value={editingContestant.fullName} onChange={(e) => setEditingContestant({...editingContestant, fullName: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="hgOccupation">Occupation</Label>
                                                    <Input id="hgOccupation" value={editingContestant.occupation} onChange={(e) => setEditingContestant({...editingContestant, occupation: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="hgPhotoUrl">Photo URL</Label>
                                                    <div className="flex items-center gap-2">
                                                    <Input id="hgPhotoUrl" value={editingContestant.photoUrl || ''} onChange={(e) => setEditingContestant({...editingContestant, photoUrl: e.target.value})} />
                                                    <Button variant="outline" size="icon"><Upload className="h-4 w-4"/></Button>
                                                    </div>
                                                </div>
                                                </div>
                                                <DialogFooter>
                                                <Button variant="outline" onClick={() => setEditingContestant(null)}>Cancel</Button>
                                                <Button onClick={handleUpdateContestant}>Save Changes</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                            )}
                                        </Dialog>
                                    </div>
                                ))}
                            </div>
                            <CardFooter className="justify-end p-0 pt-6">
                                <Button onClick={() => handleSaveChanges(`${contestantTerm.plural}`)}><Save className="mr-2"/>Save {contestantTerm.plural} Changes</Button>
                            </CardFooter>
                      </AccordionContent>
                    </Card>
                 </AccordionItem>
                <AccordionItem value="league" asChild>
                    <Card>
                        <AccordionTrigger className="p-6">
                            <CardHeader className="p-0 text-left">
                                <CardTitle className="flex items-center gap-2"><ShieldCheck /> League Settings</CardTitle>
                                <CardDescription>Manage core settings, terminology, and scoring rules for the league.</CardDescription>
                            </CardHeader>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">General</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="leagueName">League Name</Label>
                                    <Input id="leagueName" value={league.name} onChange={(e) => setLeague({...league, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxTeams">Number of Teams</Label>
                                    <Input id="maxTeams" type="number" value={league.maxTeams} onChange={(e) => setLeague({...league, maxTeams: Number(e.target.value)})} />
                                </div>
                                <Label>Team Names</Label>
                                <div className="space-y-2">
                                {Array.from({ length: league.maxTeams }).map((_, index) => (
                                    <div key={teams[index]?.id || `new_team_${index}`} className="flex items-center gap-2">
                                        <Label className="w-8 text-right text-muted-foreground">{index + 1}:</Label>
                                        <Input 
                                            value={teams[index]?.name || ''} 
                                            placeholder={`Team ${index + 1} Name`}
                                            onChange={(e) => handleTeamNameChange(index, e.target.value)} 
                                        />
                                    </div>
                                ))}
                                </div>
                            </div>
                            <Separator/>
                             <div className="space-y-4">
                                <h3 className="text-lg font-medium flex items-center gap-2"><MessageSquareQuote/> Terminology</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="termSingular">Contestant (Singular)</Label>
                                        <Input id="termSingular" value={league.contestantTerm.singular} onChange={(e) => setLeague({...league, contestantTerm: { ...league.contestantTerm, singular: e.target.value }})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="termPlural">Contestant (Plural)</Label>
                                        <Input id="termPlural" value={league.contestantTerm.plural} onChange={(e) => setLeague({...league, contestantTerm: { ...league.contestantTerm, plural: e.target.value }})} />
                                    </div>
                                </div>
                             </div>
                            <Separator/>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium flex items-center gap-2"><ListChecks/> Scoring Rules</h3>
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
                                <div className="space-y-2">
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
                                                    onChange={(e) => handleUpdateRule(rule.code, 'points', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-1 self-end">
                                                 <Button variant="ghost" size="icon" onClick={() => handleRemoveRule(rule.code)} className="h-9 w-9">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <CardFooter className="justify-end p-0 pt-6">
                                <Button onClick={() => handleSaveChanges('League Settings')}><Save className="mr-2"/>Save League Settings</Button>
                            </CardFooter>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
                <AccordionItem value="members" asChild>
                    <Card>
                        <AccordionTrigger className="p-6">
                            <CardHeader className="p-0 text-left">
                                <CardTitle className="flex items-center gap-2"><UserCog /> League Members & Teams</CardTitle>
                                <CardDescription>Manage user roles, assignments, and invitations.</CardDescription>
                            </CardHeader>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                             <div className="flex justify-end mb-4">
                                <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm"><UserPlus className="mr-2 h-4 w-4" /> Add Member</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New League Member</DialogTitle>
                                            <CardDescription>Invite a new user and assign them to a team.</CardDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Display Name</Label>
                                                <Input value={newUserData.displayName} onChange={(e) => setNewUserData({...newUserData, displayName: e.target.value})} placeholder="e.g., Jane Doe"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} placeholder="new.user@example.com"/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Role</Label>
                                                <Select value={newUserData.role} onValueChange={(role: UserRole) => setNewUserData({...newUserData, role })}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="player">Player</SelectItem>
                                                        <SelectItem value="league_admin">League Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Team</Label>
                                                <Select value={newUserData.teamId} onValueChange={(teamId) => setNewUserData({...newUserData, teamId})}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                                        {teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleAddUser}>Send Invite</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="space-y-3">
                                {users.map(user => (
                                <div key={user.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-2 rounded-lg border">
                                    <div className="flex-1 min-w-[150px] flex items-center gap-2">
                                    <div>
                                        <p className="font-medium">{user.displayName}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={cn(user.status === 'active' && 'bg-green-600 text-white')}>{user.status === 'active' ? 'Active' : 'Pending'}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                    <Select
                                        value={user.role}
                                        onValueChange={(role: UserRole) => handleRoleChange(user.id, role)}
                                    >
                                        <SelectTrigger className="w-full sm:w-[130px] h-9">
                                        <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        <SelectItem value="site_admin">Site Admin</SelectItem>
                                        <SelectItem value="league_admin">League Admin</SelectItem>
                                        <SelectItem value="player">Player</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    
                                    {user.role !== 'site_admin' && (
                                        <Select
                                        value={teams.find(t => t.ownerUserIds.includes(user.id))?.id || 'unassigned'}
                                        onValueChange={(teamId) => handleAssignTeam(user.id, teamId)}
                                        >
                                        <SelectTrigger className="w-full sm:w-[150px] h-9">
                                            <SelectValue placeholder="Assign team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {teams.map(team => (
                                            <SelectItem key={team.id} value={team.id}>
                                                {team.name}
                                            </SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                    )}
                                    <Dialog onOpenChange={(open) => !open && setEditingUser(null)}>
                                            <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Pencil className="h-4 w-4" onClick={() => setEditingUser({...user})}/>
                                            </Button>
                                            </DialogTrigger>
                                            {editingUser && editingUser.id === user.id && (
                                            <DialogContent>
                                                <DialogHeader>
                                                <DialogTitle>Edit User: {editingUser.displayName}</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="displayName">Display Name</Label>
                                                    <Input id="displayName" value={editingUser.displayName} onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="userEmail">Email</Label>
                                                    <Input id="userEmail" type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} />
                                                </div>
                                                </div>
                                                <DialogFooter>
                                                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                                                <Button onClick={handleUpdateUser}>Save Changes</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                            )}
                                        </Dialog>
                                        {user.status === 'pending' ? (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({description: `Resending invite to ${user.email}`})}>
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({description: `Password reset sent to ${user.email}`})}>
                                                <KeyRound className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                ))}
                            </div>
                            <CardFooter className="justify-end p-0 pt-6">
                                <Button onClick={() => handleSaveChanges('League Members')}><Save className="mr-2"/>Save Member Changes</Button>
                            </CardFooter>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
              </Accordion>
             <div className="flex justify-end">
                <Button onClick={() => handleSaveChanges()}><Save className="mr-2 h-4 w-4"/>Save All Admin Changes</Button>
              </div>
          </div>
        ) : (
          // Default User View
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User/> Profile Information</CardTitle>
                <CardDescription>Update your display name and email address.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" defaultValue={currentUser?.displayName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={currentUser?.email} />
                </div>
              </CardContent>
              <DialogFooter className='p-6 pt-0'>
                <Button>Save Profile</Button>
              </DialogFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock/> Change Password</CardTitle>
                <CardDescription>Update your account password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </CardContent>
               <DialogFooter className='p-6 pt-0'>
                <Button>Update Password</Button>
              </DialogFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
