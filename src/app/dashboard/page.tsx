
import { MOCK_LEAGUES, MOCK_TEAMS, MOCK_USERS } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, TrendingUp, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DashboardPage() {
  const activeLeague = MOCK_LEAGUES[0];
  const teams = MOCK_TEAMS.sort((a, b) => b.total_score - a.total_score);
  
  // Assuming the admin user is 'user_scott' for now.
  const currentUser = MOCK_USERS.find(u => u.id === 'user_scott');
  const userTeam = teams.find(t => t.ownerUserIds.includes(currentUser?.id || ''));
  const userRank = teams.findIndex(t => t.id === userTeam?.id) + 1;

  const topTeams = teams.slice(0, 3);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <div className="flex items-center justify-center rounded-full bg-accent/20 h-8 w-8">
                <Award className="h-4 w-4 text-accent-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRank > 0 ? `${userRank}th` : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">out of {teams.length} teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <div className="flex items-center justify-center rounded-full bg-primary/20 h-8 w-8">
                <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userTeam?.total_score.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{userTeam?.weekly_score || 0} from last week
            </p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Event</CardTitle>
             <div className="flex items-center justify-center rounded-full bg-secondary h-8 w-8">
                <Calendar className="h-4 w-4 text-secondary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Week 5 Veto</div>
            <p className="text-xs text-muted-foreground">
              Airs on August 11, 2025
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top 3 teams in the league.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTeams.map((team, index) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{team.name}</TableCell>
                    <TableCell className="text-right">{team.total_score.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>AI-Powered Predictions</CardTitle>
            <CardDescription>Get an edge on the competition.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Predictions coming soon.</p>
          </CardContent>
      </Card>
    </div>
  );
}
