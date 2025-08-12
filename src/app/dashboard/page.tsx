
import { MOCK_LEAGUES, MOCK_TEAMS } from "@/lib/data";
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
  const topTeams = teams.slice(0, 3);
  const userTeam = MOCK_TEAMS.find(t => t.id === 'team_scott');
  const userRank = teams.findIndex(t => t.id === 'team_scott') + 1;


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRank}th</div>
            <p className="text-xs text-muted-foreground">out of {teams.length} teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userTeam?.total_score.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{userTeam?.weekly_score} from last week
            </p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Event</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
    </div>
  );
}
