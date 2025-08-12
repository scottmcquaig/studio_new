
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users, ShieldCheck, Pencil } from "lucide-react";
import { MOCK_USERS, MOCK_TEAMS, MOCK_LEAGUES } from "@/lib/data";
import type { User, Team, UserRole } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

// For this prototype, we'll assume the logged-in user is the first site admin found.
const currentUser = MOCK_USERS.find(u => u.role === 'site_admin');
const activeLeague = MOCK_LEAGUES[0];

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

  const handleAssignTeam = (userId: string, teamId: string) => {
    const updatedTeams = teams.map(team => {
      const newOwnerIds = team.ownerUserIds.filter(id => id !== userId);
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
  
  const handleRoleChange = (userId: string, role: UserRole) => {
    setUsers(users.map(u => u.id === userId ? {...u, role, managedLeagueIds: role === 'league_admin' ? u.managedLeagueIds || [] : undefined} : u));
  }

  const handleLeagueAdminChange = (userId: string, leagueId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId && u.role === 'league_admin') {
        // for now, we only support one league
        return {...u, managedLeagueIds: [leagueId]}
      }
      return u;
    }));
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
              <p>User and league settings will be displayed here.</p>
              <p className="text-muted-foreground mt-4">You do not have administrative permissions.</p>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> Manage Users</CardTitle>
            <CardDescription>Edit user roles, league assignments, and team assignments.</CardDescription>
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

    