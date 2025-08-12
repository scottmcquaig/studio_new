
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users, Pencil, CalendarClock, Crown, Shield, UserX, UserCheck, Save, PlusCircle, Trash2, ShieldCheck, UserCog, Upload, UserSquare, Mail, KeyRound } from "lucide-react";
import { MOCK_USERS, MOCK_TEAMS, MOCK_LEAGUES, MOCK_HOUSEGUESTS, MOCK_SEASONS, MOCK_COMPETITIONS, MOCK_SCORING_RULES } from "@/lib/data";
import type { User, Team, UserRole, Houseguest, Competition, League } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// For this prototype, we'll assume the logged-in user is the first site admin found.
const currentUser = MOCK_USERS.find(u => u.role === 'site_admin');
const activeSeason = MOCK_SEASONS[0];
const specialEventRules = MOCK_SCORING_RULES.find(rs => rs.id === 'std_bb_rules_v1')?.rules.filter(r => ['PENALTY_RULE', 'SPECIAL_POWER'].includes(r.code)) || [];


export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [league, setLeague] = useState<League>(MOCK_LEAGUES[0]);
  const [houseguests, setHouseguests] = useState<Houseguest[]>(MOCK_HOUSEGUESTS);
  const [competitions, setCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingHouseguest, setEditingHouseguest] = useState<Houseguest | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(activeSeason.currentWeek);
  const [isSpecialEventDialogOpen, setIsSpecialEventDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  const [newUserData, setNewUserData] = useState({
    displayName: '',
    email: '',
    role: 'player' as UserRole,
    teamId: 'unassigned'
  });
  
  const [specialEventData, setSpecialEventData] = useState({
      houseguestId: '',
      ruleCode: '',
      notes: ''
  });


  const activeHouseguests = houseguests.filter(hg => hg.status === 'active');
  const weekEvents = competitions.filter(c => c.week === selectedWeek);
  
  const hoh = weekEvents.find(c => c.type === 'HOH');
  const pov = weekEvents.find(c => c.type === 'VETO');
  const noms = weekEvents.find(c => c.type === 'NOMINATIONS');
  const eviction = weekEvents.find(c => c.type === 'EVICTION');
  const weekOptions = Array.from({ length: activeSeason.currentWeek }, (_, i) => i + 1);


  const handleAddUser = () => {
    if (!newUserData.email.trim() || !newUserData.displayName.trim()) {
      alert("Please enter a valid display name and email.");
      return;
    }
    const newUser: User = {
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
    alert(`User ${newUser.displayName} created and invite sent!`);
  };

  const handleSaveChanges = () => {
    // In a real app, this would send updates to the backend.
    console.log("Saving changes for users:", users);
    console.log("Saving changes for teams:", teams);
    console.log("Saving changes for competitions:", competitions);
    console.log("Saving changes for league:", league);
    console.log("Saving changes for houseguests:", houseguests);
    alert("Changes saved to console!");
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

  const handleUpdateHouseguest = () => {
      if(!editingHouseguest) return;
      setHouseguests(houseguests.map(hg => hg.id === editingHouseguest.id ? editingHouseguest : hg));
      setEditingHouseguest(null);
  }
  
  const handleRoleChange = (userId: string, role: UserRole) => {
    setUsers(users.map(u => u.id === userId ? {...u, role, managedLeagueIds: role === 'league_admin' ? u.managedLeagueIds || [] : undefined} : u));
  }
  
  const handleEventUpdate = (type: 'HOH' | 'VETO' | 'NOMINATIONS' | 'EVICTION', value: string | string[]) => {
    const newCompetitions = [...competitions];
    let event = newCompetitions.find(c => c.week === selectedWeek && c.type === type);
    
    if (!event) {
      event = { id: `bb27_wk${selectedWeek}_${type.toLowerCase()}`, seasonId: 'bb27', week: selectedWeek, type, airDate: new Date().toISOString() };
      newCompetitions.push(event);
    }
    
    if (type === 'HOH' || type === 'VETO') {
        event.winnerId = value as string;
    } else if (type === 'NOMINATIONS') {
        event.nominees = (value as string[]).filter(v => v); // Filter out empty strings
    } else if (type === 'EVICTION') {
        event.evictedId = value as string;
    }
    
    setCompetitions(newCompetitions);
  };
  
  const handleAddSpecialEvent = () => {
    if (!specialEventData.houseguestId || !specialEventData.ruleCode) {
        alert("Please select a houseguest and an event type.");
        return;
    }
    const newEvent: Competition = {
        id: `bb27_wk${selectedWeek}_special_${Date.now()}`,
        seasonId: 'bb27',
        week: selectedWeek,
        type: 'SPECIAL_EVENT',
        winnerId: specialEventData.houseguestId,
        notes: specialEventData.notes,
        specialEventCode: specialEventData.ruleCode,
        airDate: new Date().toISOString()
    };
    setCompetitions([...competitions, newEvent]);
    console.log("Added special event:", newEvent);
    setSpecialEventData({ houseguestId: '', ruleCode: '', notes: '' });
    setIsSpecialEventDialogOpen(false);
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


  if (currentUser?.role !== 'site_admin') {
    return (
      <div className="flex flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
          <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>App Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You do not have administrative permissions.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Admin View
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Admin Settings
        </h1>
        <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/>Save All Changes</Button>
      </header>
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><CalendarClock/> Weekly Event Management</CardTitle>
                        <CardDescription>Update results for the selected week.</CardDescription>
                    </div>
                     <div className="w-40">
                         <Label>Select Week</Label>
                         <Select value={String(selectedWeek)} onValueChange={(val) => setSelectedWeek(Number(val))}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {weekOptions.map(week => <SelectItem key={week} value={String(week)}>Week {week}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <Label className="flex items-center gap-1 mb-1"><Crown className="text-primary"/>HOH Winner</Label>
                        <Select value={hoh?.winnerId || ''} onValueChange={(val) => handleEventUpdate('HOH', val)}>
                            <SelectTrigger><SelectValue placeholder="Select HOH..."/></SelectTrigger>
                            <SelectContent>
                                {activeHouseguests.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label className="flex items-center gap-1 mb-1"><Shield className="text-accent"/>Veto Winner</Label>
                        <Select value={pov?.winnerId || ''} onValueChange={(val) => handleEventUpdate('VETO', val)}>
                            <SelectTrigger><SelectValue placeholder="Select Veto Winner..."/></SelectTrigger>
                            <SelectContent>
                               {activeHouseguests.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="flex items-center gap-1 mb-1"><UserCheck className="text-red-400"/>Nominee 1</Label>
                        <Select value={noms?.nominees?.[0] || ''} onValueChange={(val) => handleEventUpdate('NOMINATIONS', [val, noms?.nominees?.[1] || '', noms?.nominees?.[2] || ''])}>
                            <SelectTrigger><SelectValue placeholder="Select Nominee..."/></SelectTrigger>
                            <SelectContent>
                               {activeHouseguests.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="flex items-center gap-1 mb-1"><UserCheck className="text-red-400"/>Nominee 2</Label>
                        <Select value={noms?.nominees?.[1] || ''} onValueChange={(val) => handleEventUpdate('NOMINATIONS', [noms?.nominees?.[0] || '', val, noms?.nominees?.[2] || ''])}>
                            <SelectTrigger><SelectValue placeholder="Select Nominee..."/></SelectTrigger>
                            <SelectContent>
                                {activeHouseguests.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label className="flex items-center gap-1 mb-1"><UserCheck className="text-red-400"/>Nominee 3 (optional)</Label>
                        <Select value={noms?.nominees?.[2] || ''} onValueChange={(val) => handleEventUpdate('NOMINATIONS', [noms?.nominees?.[0] || '', noms?.nominees?.[1] || '', val])}>
                            <SelectTrigger><SelectValue placeholder="Select Nominee..."/></SelectTrigger>
                            <SelectContent>
                                {activeHouseguests.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label className="flex items-center gap-1 mb-1"><UserX className="text-muted-foreground"/>Evicted Houseguest</Label>
                        <Select value={eviction?.evictedId || ''} onValueChange={(val) => handleEventUpdate('EVICTION', val)}>
                            <SelectTrigger><SelectValue placeholder="Select Evicted..."/></SelectTrigger>
                            <SelectContent>
                                {activeHouseguests.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
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
                                    <Label>Houseguest</Label>
                                    <Select value={specialEventData.houseguestId} onValueChange={(val) => setSpecialEventData({...specialEventData, houseguestId: val})}>
                                        <SelectTrigger><SelectValue placeholder="Select a houseguest..."/></SelectTrigger>
                                        <SelectContent>
                                            {activeHouseguests.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
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
                        <Button variant="outline" onClick={handleSaveChanges}>Apply & Lock Events</Button>
                        <Button variant="outline" disabled={selectedWeek !== activeSeason.currentWeek}>Start Next Week</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserSquare/> Houseguest Management</CardTitle>
                <CardDescription>Edit houseguest information and photos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {houseguests.map(hg => (
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
                                    <Badge variant={hg.status === 'active' ? 'default' : 'destructive'} className="h-fit text-xs mt-1">
                                        {hg.status.charAt(0).toUpperCase() + hg.status.slice(1)}
                                    </Badge>
                                </div>
                            </div>
                            <Dialog onOpenChange={(open) => !open && setEditingHouseguest(null)}>
                                <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingHouseguest({...hg})}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                </DialogTrigger>
                                {editingHouseguest && editingHouseguest.id === hg.id && (
                                <DialogContent>
                                    <DialogHeader>
                                    <DialogTitle>Edit Houseguest: {editingHouseguest.fullName}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hgName">Full Name</Label>
                                        <Input id="hgName" value={editingHouseguest.fullName} onChange={(e) => setEditingHouseguest({...editingHouseguest, fullName: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hgOccupation">Occupation</Label>
                                        <Input id="hgOccupation" value={editingHouseguest.occupation} onChange={(e) => setEditingHouseguest({...editingHouseguest, occupation: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hgPhotoUrl">Photo URL</Label>
                                        <div className="flex items-center gap-2">
                                        <Input id="hgPhotoUrl" value={editingHouseguest.photoUrl || ''} onChange={(e) => setEditingHouseguest({...editingHouseguest, photoUrl: e.target.value})} />
                                        <Button variant="outline" size="icon"><Upload className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                    </div>
                                    <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditingHouseguest(null)}>Cancel</Button>
                                    <Button onClick={handleUpdateHouseguest}>Save Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                                )}
                            </Dialog>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck /> League Settings</CardTitle>
                    <CardDescription>Manage core settings for the league.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="leagueName">League Name</Label>
                        <Input id="leagueName" value={league.name} onChange={(e) => setLeague({...league, name: e.target.value})} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="maxTeams">Number of Teams</Label>
                        <Input id="maxTeams" type="number" value={league.maxTeams} onChange={(e) => setLeague({...league, maxTeams: Number(e.target.value)})} />
                    </div>
                    <Separator />
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
                </CardContent>
            </Card>

             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><UserCog /> League Members & Teams</CardTitle>
                        <CardDescription>Manage user roles, assignments, and invitations.</CardDescription>
                    </div>
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
                </CardHeader>
                <CardContent className="space-y-3">
                     {users.map(user => (
                      <div key={user.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-2 rounded-lg border">
                        <div className="flex-1 min-w-[150px] flex items-center gap-2">
                          <div>
                            <p className="font-medium">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                           <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status === 'active' ? 'Active' : 'Pending'}</Badge>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`Resending invite to ${user.email}`)}>
                                    <Mail className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`Password reset sent to ${user.email}`)}>
                                    <KeyRound className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                      </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}

    