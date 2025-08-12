
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MOCK_COMPETITIONS, MOCK_HOUSEGUESTS, MOCK_SEASONS, MOCK_TEAMS, MOCK_SCORING_RULES } from "@/lib/data";
import {
  Home,
  Crown,
  Shield,
  Users,
  UserX,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Medal,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Helper to get top players
const getTopPlayers = () => {
  const allPlayers = MOCK_TEAMS.flatMap(team => 
    team.weekly_score_breakdown.week4.map(playerScore => {
      const player = MOCK_HOUSEGUESTS.find(hg => hg.id === playerScore.houseguestId);
      return {
        ...player,
        points: playerScore.points,
        absPoints: Math.abs(playerScore.points),
      };
    })
  );

  return allPlayers
    .sort((a, b) => b.absPoints - a.absPoints)
    .slice(0, 4);
};


export default function DashboardPage() {
  const activeSeason = MOCK_SEASONS[0];
  const currentWeekEvents = MOCK_COMPETITIONS.filter(
    (c) => c.week === activeSeason.currentWeek
  );

  const hoh = currentWeekEvents.find((c) => c.type === "HOH");
  const hohWinner = MOCK_HOUSEGUESTS.find((hg) => hg.id === hoh?.winnerId);

  const noms = currentWeekEvents.find((c) => c.type === "NOMINATIONS");
  const nomWinners = MOCK_HOUSEGUESTS.filter(
    (hg) => noms?.nominees?.includes(hg.id)
  );

  const pov = currentWeekEvents.find((c) => c.type === "VETO");
  const povWinner = MOCK_HOUSEGUESTS.find((hg) => hg.id === pov?.winnerId);

  const eviction = currentWeekEvents.find((c) => c.type === "EVICTION");
  const evictedPlayer = MOCK_HOUSEGUESTS.find(
    (hg) => hg.id === eviction?.evictedId
  );
  
  const sortedTeams = [...MOCK_TEAMS].sort((a, b) => b.total_score - a.total_score);
  const topPlayers = getTopPlayers();
  const scoringRules = MOCK_SCORING_RULES.find(rs => rs.id === 'std_bb_rules_v1')?.rules;


  const weeklyActivity = [];
    if (hoh && hohWinner) {
        weeklyActivity.push({
            type: 'HOH',
            player: hohWinner,
            points: scoringRules?.find(r => r.code === 'HOH_WIN')?.points,
            description: `${hohWinner.fullName} won Head of Household.`
        });
    }
    if (noms && nomWinners.length > 0) {
        nomWinners.forEach(nominee => {
            weeklyActivity.push({
                type: 'NOMINATIONS',
                player: nominee,
                points: scoringRules?.find(r => r.code === 'NOMINATED')?.points,
                description: `${nominee.fullName} was nominated for eviction.`
            });
        });
    }
    if (pov && povWinner) {
        weeklyActivity.push({
            type: 'VETO',
            player: povWinner,
            points: scoringRules?.find(r => r.code === 'VETO_WIN')?.points,
            description: `${povWinner.fullName} won the Power of Veto.`
        });
    }


  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <Home className="h-5 w-5" />
          Dashboard
        </h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Week {activeSeason.currentWeek} Status</span>
              <span className="text-sm font-normal text-muted-foreground">
                {activeSeason.title}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background">
              <h3 className="font-semibold flex items-center gap-1 text-primary">
                <Crown className="h-4 w-4" /> HOH
              </h3>
              {hohWinner ? (
                <>
                  <Image
                    src={hohWinner.photoUrl!}
                    alt={hohWinner.fullName}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-primary"
                    data-ai-hint="portrait person"
                  />
                  <span className="text-sm">{hohWinner.fullName.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50">
                    <HelpCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">TBD</span>
                </>
              )}
            </div>

            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background">
              <h3 className="font-semibold flex items-center gap-1 text-red-400">
                <Users className="h-4 w-4" /> Noms
              </h3>
              <div className="flex items-center justify-center gap-2 min-h-[76px]">
                {nomWinners.length > 0 ? (
                  nomWinners.map((nom) => (
                    <div
                      key={nom.id}
                      className="flex flex-col items-center gap-1"
                    >
                      <Image
                        src={nom.photoUrl!}
                        alt={nom.fullName}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-red-400"
                        data-ai-hint="portrait person"
                      />
                      <span className="text-xs">
                        {nom.fullName.split(" ")[0]}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50">
                      <HelpCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </>
                )}
              </div>
              {nomWinners.length === 0 && (
                <span className="text-sm text-muted-foreground -mt-2">TBD</span>
              )}
            </div>

            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background">
              <h3 className="font-semibold flex items-center gap-1 text-accent">
                <Shield className="h-4 w-4" /> POV
              </h3>
              {povWinner ? (
                <>
                  <Image
                    src={povWinner.photoUrl!}
                    alt={povWinner.fullName}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-accent"
                    data-ai-hint="portrait person"
                  />
                  <span className="text-sm">{povWinner.fullName.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50">
                    <HelpCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">TBD</span>
                </>
              )}
            </div>

            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background">
              <h3 className="font-semibold flex items-center gap-1 text-muted-foreground">
                <UserX className="h-4 w-4" /> Evicted
              </h3>
              {evictedPlayer ? (
                <>
                  <Image
                    src={evictedPlayer.photoUrl!}
                    alt={evictedPlayer.fullName}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-muted-foreground"
                    data-ai-hint="portrait person"
                  />
                  <span className="text-sm">{evictedPlayer.fullName.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50">
                    <HelpCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">TBD</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Current Standings</CardTitle>
                    <CardDescription>Team rankings and weekly performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sortedTeams.map((team, index) => (
                             <div key={team.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={cn("text-lg font-bold w-6 text-center", 
                                        index === 0 && "text-amber-400",
                                        index === 1 && "text-slate-300",
                                        index === 2 && "text-orange-400"
                                    )}>{index + 1}</span>
                                    <div>
                                        <p className="font-medium">{team.name}</p>
                                        <p className="text-sm text-muted-foreground">{team.total_score.toLocaleString()} pts</p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-sm font-semibold",
                                    team.weekly_score >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {team.weekly_score >= 0 ? <ArrowUp className="h-4 w-4"/> : <ArrowDown className="h-4 w-4"/>}
                                    <span>({team.weekly_score > 0 ? '+': ''}{team.weekly_score})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Medal/> Top Movers (Week 4)</CardTitle>
                    <CardDescription>Players with the biggest point swings last week.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        {topPlayers.map(player => (
                            <div key={player.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Image 
                                        src={player.photoUrl!}
                                        alt={player.fullName}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                        data-ai-hint="portrait person"
                                    />
                                    <div>
                                        <p className="font-medium">{player.fullName}</p>
                                        <p className="text-sm text-muted-foreground">{player.status === 'active' ? 'Active' : 'Evicted'}</p>
                                    </div>
                                </div>
                                <Badge variant={player.points >= 0 ? "default" : "destructive"} className="text-sm font-bold bg-green-600">
                                    {player.points > 0 ? '+': ''}{player.points}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListOrdered /> Week {activeSeason.currentWeek} Scoring Activity</CardTitle>
            <CardDescription>A log of all point-scoring events from this week.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyActivity.length > 0 ? weeklyActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image
                      src={activity.player.photoUrl!}
                      alt={activity.player.fullName}
                      width={40}
                      height={40}
                      className="rounded-full"
                      data-ai-hint="portrait person"
                    />
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.type === 'HOH' && 'HOH Win'}
                        {activity.type === 'NOMINATIONS' && 'Nomination'}
                        {activity.type === 'VETO' && 'Veto Win'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={activity.points >= 0 ? "default" : "destructive"} className="text-sm font-bold bg-green-600">
                    {activity.points > 0 ? '+': ''}{activity.points}
                  </Badge>
                </div>
              )) : (
                <p className="text-muted-foreground text-sm text-center py-4">No scoring activity logged for this week yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
