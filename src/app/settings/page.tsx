
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, UserPlus, Users } from "lucide-react";
import { MOCK_USERS, MOCK_TEAMS, MOCK_LEAGUES } from "@/lib/data";
import type { User, Team } from "@/lib/data";

// For this prototype, we'll assume the logged-in user is the first admin found.
const currentUser = MOCK_USERS.find(u => u.isAdmin);
const activeLeague = MOCK_LEAGUES[0];

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [newUserEmail, setNewUserEmail] = useState('');

  const handleInviteUser = () => {
    if (!newUserEmail.trim()) {
      alert("Please enter a valid email.");
      return;
    }
    const newId = `user_${newUserEmail.split('@')[0].toLowerCase()}`;
    const newUser: User = {
      id: newId,
      email: newUserEmail,
      displayName: newUserEmail.split('@')[0], // Simple display name from email
      createdAt: new Date().toISOString(),
    };
    setUsers([...users, newUser]);
    setNewUserEmail('');
    alert(`User ${newUser.displayName} invited!`);
  };

  const handleAssignTeam = (userId: string, teamId: string) => {
    const updatedTeams = teams.map(team => {
      // Remove user from their current team if they are on one
      const newOwnerIds = team.ownerUserIds.filter(id => id !== userId);
      if (team.id === teamId) {
        // Add user to the new team, preventing duplicates
        if (!newOwnerIds.includes(userId)) {
          newOwnerIds.push(userId);
        }
      }
      return { ...team, ownerUserIds: newOwnerIds };
    });
    setTeams(updatedTeams);
  };

  if (!currentUser?.isAdmin) {
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
            <CardTitle className="flex items-center gap-2"><Users /> Manage Team Rosters</CardTitle>
            <CardDescription>Assign users to their respective teams for the "{activeLeague.name}" league.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between gap-4 p-2 rounded-md border">
                <p className="font-medium">{user.displayName} <span className="text-sm text-muted-foreground">({user.email})</span></p>
                <Select
                  value={teams.find(t => t.ownerUserIds.includes(user.id))?.id || 'unassigned'}
                  onValueChange={(teamId) => handleAssignTeam(user.id, teamId)}
                >
                  <SelectTrigger className="w-[240px]">
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
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
