import { MOCK_LEAGUES, MOCK_TEAMS, MOCK_USERS, MOCK_COMPETITIONS, MOCK_HOUSEGUESTS } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Trophy, Users, Calendar, Shield } from "lucide-react";

export default function DashboardPage() {
  const activeLeague = MOCK_LEAGUES[0];
  const teams = MOCK_TEAMS.sort((a, b) => b.total_score - a.total_score);
  
  // Assuming the logged-in user is 'user_scott' for now.
  const currentUser = MOCK_USERS.find(u => u.id === 'user_scott');
  const myTeam = teams.find(t => t.ownerUserIds.includes(currentUser?.id || ''));
  const myTeamHouseguests = MOCK_HOUSEGUESTS.filter(hg => myTeam?.houseguestIds.includes(hg.id));

  // Get the next 3 upcoming events
  const upcomingEvents = MOCK_COMPETITIONS
    .filter(c => new Date(c.airDate) >= new Date('2025-08-11')) // Mocking "today"
    .sort((a, b) => new Date(a.airDate).getTime() - new Date(b.airDate).getTime())
    .slice(0, 3);

  const getEventType = (type: string) => {
    switch (type) {
        case 'HOH': return { label: 'HOH', variant: 'primary' as const };
        case 'VETO': return { label: 'Veto', variant: 'secondary' as const };
        case 'EVICTION': return { label: 'Eviction', variant: 'destructive' as const };
        default: return { label: 'Event', variant: 'default' as const };
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Top teams in the league</CardDescription>
            </div>
            <Link href="/standings">
                <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
           <ul className="space-y-4">
            {teams.slice(0, 3).map((team, index) => {
              const owners = MOCK_USERS.filter(u => team.ownerUserIds.includes(u.id));
              return (
                 <li key={team.id} className="flex items-center gap-4">
                    <span className="text-lg font-bold w-6 text-center">{index + 1}</span>
                    <Avatar>
                        <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="logo team" />
                        <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold">{team.name}</p>
                        <p className="text-sm text-muted-foreground">{owners.map(o => o.displayName).join(' & ')}</p>
                    </div>
                    <span className="font-bold text-lg">{team.total_score}</span>
                 </li>
              )
            })}
           </ul>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>My Team</CardTitle>
                    <CardDescription>{myTeam?.name}</CardDescription>
                </div>
                 <Link href="/team">
                    <Button variant="ghost" size="sm">
                        Manage Team <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex -space-x-4">
                {myTeamHouseguests.slice(0, 3).map(hg => (
                    <Avatar key={hg.id} className="border-2 border-background">
                        <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint={`person ${hg.occupation}`} />
                        <AvatarFallback>{hg.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                ))}
            </div>
            <p className="text-sm text-muted-foreground">
                {myTeamHouseguests.length} players on your roster
            </p>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Up Next</CardTitle>
            <CardDescription>Upcoming game events.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {upcomingEvents.map(event => {
                const eventType = getEventType(event.type);
                return (
                    <Badge key={event.id} variant={eventType.variant}>{eventType.label}</Badge>
                )
            })}
          </CardContent>
      </Card>
    </div>
  );
}
