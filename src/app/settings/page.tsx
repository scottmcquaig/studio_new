
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users, Pencil, CalendarClock, Crown, Shield, UserX, UserCheck, Save } from "lucide-react";
import { MOCK_USERS, MOCK_TEAMS, MOCK_LEAGUES, MOCK_HOUSEGUESTS, MOCK_SEASONS, MOCK_COMPETITIONS } from "@/lib/data";
import type { User, Team, UserRole, Houseguest, Competition } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// For this prototype, we'll assume the logged-in user is the first site admin found.
const currentUser = MOCK_USERS.find(u => u.role === 'site_admin');
const activeLeague = MOCK_LEAGUES[0];
const activeSeason = MOCK_SEASONS[0];

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [competitions, setCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const activeHouseguests = MOCK_HOUSEGUESTS.filter(hg => hg.status === 'active');
  const currentWeekEvents = competitions.filter(c => c.week === activeSeason.currentWeek);
  
  const hoh = currentWeekEvents.find(c => c.type === 'HOH');
  const pov = currentWeekEvents.find(c => c.type === 'VETO');
  const noms = currentWeekEvents.find(c => c.type === 'NOMINATIONS');
  const eviction = currentWeekEvents.find(c => c.type === 'EVICTION');

  const handleInviteUser = () => {
    if (!newUserEmail.trim()) {
      alert("Please enter a valid email.");
      return;
    }
    const newId = `user_${newUserEmail.split('@')[0].toLowerCase()}`;
    const newUser: User = {
      id: newId,
      email: newUserEmail,
      displayName: newUserEmail.split('@')[0],
      createdAt: new Date().toISOString(),
      role: 'player',
    };
    setUsers([...users, newUser]);
    setNewUserEmail('');
    alert(`User ${newUser.displayName} invited!`);
  };

  const handleSaveChanges = () => {
    // In a real app, this would send updates to the backend.
    console.log("Saving changes for users:", users);
    console.log("Saving changes for teams:", teams);
    console.log("Saving changes for competitions:", competitions);
    alert("Changes saved to console!");
  };

  const handleAssignTeam = (userId: string, teamId: string) => {
    const updatedTeams = teams.map(team => {
      // Create a new list of owner IDs, excluding the current user to prevent duplicates or handle re-assignment.
      let newOwnerIds = team.ownerUserIds.filter(id => id !== userId);
      
      // If the current team is the one being assigned to, add the user.
      if (team.id === teamId) {
        if (!newOwnerIds.includes(userId)) {
          newOwnerIds.push(userId);
        }
      }
      return { ...team, ownerUserIds: newOwnerIds };
    });
    setTeams(updatedTeams);

    // Also update the user state to reflect this change immediately in the UI if needed
    // This part is mostly for consistency if the user object itself tracks the team
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
  };
  
  const handleRoleChange = (userId: string, role: UserRole) => {
    setUsers(users.map(u => u.id === userId ? {...u, role, managedLeagueIds: role === 'league_admin' ? u.managedLeagueIds || [] : undefined} : u));
  }

  const handleLeagueAdminChange = (userId: string, leagueId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId && u.role === 'league_admin') {
        return {...u, managedLeagueIds: [leagueId]}
      }
      return u;
    }));
  }
  
  const handleEventUpdate = (type: 'HOH' | 'VETO' | 'NOMINATIONS' | 'EVICTION', value: string | string[]) => {
    const newCompetitions = [...competitions];
    let event = newCompetitions.find(c => c.week === activeSeason.currentWeek && c.type === type);
    
    if (!event) {
      event = { id: `bb27_wk${activeSeason.currentWeek}_${type.toLowerCase()}`, seasonId: 'bb27', week: activeSeason.currentWeek, type, airDate: new Date().toISOString() };
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
      </header>
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarClock/> Weekly Event Management</CardTitle>
                <CardDescription>Update results for Week {activeSeason.currentWeek}.</CardDescription>
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
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleSaveChanges}>Apply & Lock Events</Button>
                    <Button variant="outline" disabled>Start Next Week</Button>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus /> Invite New User</CardTitle>
            <CardDescription>Send an invitation to a new user to join the league.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="new.user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <Button className="self-end" onClick={handleInviteUser}>Send Invite</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Users /> Manage Users</CardTitle>
              <CardDescription>Edit user roles, league assignments, and team assignments.</CardDescription>
            </div>
            <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/>Save User Changes</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg border bg-card/50">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                   <Select
                    value={user.role}
                    onValueChange={(role: UserRole) => handleRoleChange(user.id, role)}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Select a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="site_admin">Site Admin</SelectItem>
                      <SelectItem value="league_admin">League Admin</SelectItem>
                      <SelectItem value="player">Player</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {user.role === 'league_admin' && (
                     <Select
                        value={user.managedLeagueIds?.[0] || ''}
                        onValueChange={(leagueId) => handleLeagueAdminChange(user.id, leagueId)}
                      >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Assign a league..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_LEAGUES.map(league => (
                          <SelectItem key={league.id} value={league.id}>
                            {league.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {user.role !== 'site_admin' && (
                    <Select
                      value={teams.find(t => t.ownerUserIds.includes(user.id))?.id || 'unassigned'}
                      onValueChange={(teamId) => handleAssignTeam(user.id, teamId)}
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Assign a team..." />
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
                      <Button variant="ghost" size="icon" onClick={() => setEditingUser({...user})}>
                        <Pencil className="h-4 w-4" />
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
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
