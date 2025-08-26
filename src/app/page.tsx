
"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Home,
  TrendingUp,
  ListOrdered,
  Flame,
  PlusCircle,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn, getContestantDisplayName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/app-header";
import { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, onSnapshot, query, doc, Unsubscribe, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Team, League, ScoringRuleSet, Competition, Contestant, Season, User, Pick, ScoringRule } from '@/lib/data';
import withAuth from "@/components/withAuth";
import { PageLayout } from "@/components/page-layout";
import { WeeklyStatus } from "@/components/weekly-status";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

function DashboardPage() {
  const db = getFirestore(app);
  const { appUser } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRuleSet | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // This logic should be enhanced with a league switcher
    const unsubLeagues = onSnapshot(collection(db, "leagues"), (snap) => {
        if (!snap.empty) {
            const leagues = snap.docs.map(d => ({...d.data(), id: d.id} as League));
            // A more robust league selection mechanism would be needed for multiple leagues.
            // For now, we'll just pick one, e.g., 'bb27' or the first one.
            const currentLeague = leagues.find(l => l.id === 'bb27') || leagues[0];
            setActiveLeague(currentLeague);
        } else {
            setActiveLeague(null);
            setDataLoading(false);
        }
    });

    const unsubSeasons = onSnapshot(collection(db, "seasons"), (snap) => {
        setSeasons(snap.docs.map(d => ({ ...d.data(), id: d.id } as Season)));
    });

    return () => {
        unsubLeagues();
        unsubSeasons();
    };
  }, [db]);

  useEffect(() => {
    if (activeLeague && seasons.length > 0) {
        const season = seasons.find(s => s.id === activeLeague.seasonId);
        setActiveSeason(season || null);
    } else if (!activeLeague) {
        setActiveSeason(null);
    }
  }, [activeLeague, seasons]);


  useEffect(() => {
    if (!activeLeague || !activeSeason) {
        if (!dataLoading && !activeLeague) {
           // If we've confirmed there are no leagues, we're done loading.
           setDataLoading(false);
        }
        return;
    };
    
    setDataLoading(true);

    const unsubscribes: Unsubscribe[] = [];

    if (activeLeague.settings.scoringRuleSetId) {
        unsubscribes.push(onSnapshot(doc(db, "scoring_rules", activeLeague.settings.scoringRuleSetId), (ruleSnap) => {
            if (ruleSnap.exists()) setScoringRules({ ...ruleSnap.data(), id: ruleSnap.id } as ScoringRuleSet);
        }));
    }
    
    const qTeams = query(collection(db, "teams"), where("leagueId", "==", activeLeague.id));
    unsubscribes.push(onSnapshot(qTeams, (snap) => setTeams(snap.docs.map(d => ({...d.data(), id: d.id } as Team)))));

    const qPicks = query(collection(db, "picks"), where("leagueId", "==", activeLeague.id));
    unsubscribes.push(onSnapshot(qPicks, (snap) => setPicks(snap.docs.map(d => ({...d.data(), id: d.id } as Pick)))));
    
    const qContestants = query(collection(db, "contestants"), where("seasonId", "==", activeSeason.id));
    unsubscribes.push(onSnapshot(qContestants, (snap) => setContestants(snap.docs.map(d => ({...d.data(), id: d.id } as Contestant)))));
    
    const qCompetitions = query(collection(db, "competitions"), where("seasonId", "==", activeSeason.id));
    unsubscribes.push(onSnapshot(qCompetitions, (snap) => setCompetitions(snap.docs.map(d => ({...d.data(), id: d.id } as Competition)))));
    
    unsubscribes.push(onSnapshot(query(collection(db, "users")), (snap) => {
        setUsers(snap.docs.map(d => ({...d.data(), id: d.id } as User)));
        setDataLoading(false); // Set loading to false after the last query completes
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [db, activeLeague, activeSeason]);

  const currentWeekEvents = useMemo(() => {
    if (!activeSeason) return [];
    return competitions.filter((c) => c.week === activeSeason.currentWeek);
   }, [competitions, activeSeason]
  );
  
  const calculateTeamScore = (team: Team, rules: ScoringRule[], teamPicks: Pick[], relevantCompetitions: Competition[]): number => {
    let score = 0;
    if (!rules.length || !teamPicks.length) return 0;

    const teamContestantIds = teamPicks.map(p => p.contestantId);

    relevantCompetitions.forEach(comp => {
        const processEvent = (contestantId: string, eventCode: string) => {
            if (teamContestantIds.includes(contestantId)) {
                const rule = rules.find(r => r.code === eventCode);
                if (rule) {
                    score += rule.points;
                }
            }
        };
        
        const rule = rules.find(r => r.code === comp.type);
        if (!rule) return;

        if (comp.winnerId) processEvent(comp.winnerId, comp.type);
        if (comp.evictedId) processEvent(comp.evictedId, comp.type);
        if (comp.nominees) comp.nominees.forEach(nomId => processEvent(nomId, comp.type));
    });

    return score;
  };

  const teamsWithScores = useMemo(() => {
    if (!teams.length || !scoringRules?.rules.length || !picks.length || !activeSeason) return [];
    
    const currentWeekCompetitions = competitions.filter(c => c.week === activeSeason.currentWeek);

    return teams.map(team => {
      const teamPicks = picks.filter(p => p.teamId === team.id);
      const total_score = calculateTeamScore(team, scoringRules.rules, teamPicks, competitions);
      const weekly_score = calculateTeamScore(team, scoringRules.rules, teamPicks, currentWeekCompetitions);
      return { ...team, total_score, weekly_score };
    });
  }, [teams, scoringRules, picks, competitions, activeSeason]);

  const sortedTeams = useMemo(() => {
    return [...teamsWithScores].sort((a, b) => (b.total_score || 0) - (a.total_score || 0) || a.draftOrder - b.draftOrder);
  }, [teamsWithScores]);


  const topMovers = useMemo(() => {
    if (!scoringRules?.rules.length || !contestants.length || !currentWeekEvents.length) return [];
    
    const weeklyScores: {[key: string]: { contestant: Contestant, score: number }} = {};
    
    contestants.forEach(c => weeklyScores[c.id] = { contestant: c, score: 0 });

    currentWeekEvents.forEach(comp => {
        const rule = scoringRules.rules.find(r => r.code === comp.type);
        if (!rule) return;

        const processEvent = (contestantId: string) => {
            if (weeklyScores[contestantId] !== undefined) {
                weeklyScores[contestantId].score += rule.points;
            }
        };
        
        if(comp.winnerId) processEvent(comp.winnerId);
        if(comp.evictedId) processEvent(comp.evictedId);
        if(comp.nominees) comp.nominees.forEach(processEvent);
    });
    
    const movers = Object.values(weeklyScores)
        .filter(c => c.score !== 0)
        .sort((a, b) => {
            const absA = Math.abs(a.score);
            const absB = Math.abs(b.score);
            if (absB !== absA) {
                return absB - absA; // Sort by absolute value descending
            }
            return b.score - a.score; // If absolute values are equal, positive scores come first
        });

    // Group by score
    const grouped = movers.reduce((acc, mover) => {
        const scoreKey = mover.score;
        if (!acc[scoreKey]) {
            acc[scoreKey] = [];
        }
        acc[scoreKey].push(mover.contestant);
        return acc;
    }, {} as Record<number, Contestant[]>);

    return Object.entries(grouped)
        .map(([score, contestants]) => ({ score: Number(score), contestants }))
        .sort((a, b) => {
            const absA = Math.abs(a.score);
            const absB = Math.abs(b.score);
            if (absB !== absA) return absB - absA;
            return b.score - a.score;
        })
        .slice(0, 3);

  }, [contestants, scoringRules, currentWeekEvents]);
  
  const weeklyActivity = useMemo(() => {
    if (!scoringRules?.rules || !contestants.length || !currentWeekEvents.length) return [];
    
    const activities: any[] = [];
    currentWeekEvents.forEach(event => {
        const rule = scoringRules.rules.find(r => r.code === event.type);
        if (!rule) return;

        const processPlayer = (playerId: string) => {
            const player = contestants.find(c => c.id === playerId);
            if (player) {
                activities.push({
                    player,
                    description: `${getContestantDisplayName(player, 'full')} ${rule.label}.`,
                    points: rule.points,
                    type: rule.label,
                });
            }
        };

        if (event.winnerId) processPlayer(event.winnerId);
        if (event.evictedId) processPlayer(event.evictedId);
        if (event.nominees) event.nominees.forEach(processPlayer);
    });
    return activities;
  }, [currentWeekEvents, contestants, scoringRules]);


  if (dataLoading) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div>Loading Dashboard...</div>
        </div>
    );
  }

  if (!activeLeague || !activeSeason) {
    return (
        <PageLayout>
          <AppHeader pageTitle="Dashboard" pageIcon={Home} />
          <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
             <Card className="w-full max-w-md text-center">
                 <CardHeader>
                     <CardTitle>Welcome!</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <p className="text-muted-foreground">No league data available.</p>
                     {appUser?.role === 'site_admin' && (
                         <Button asChild className="mt-4">
                            <Link href="/admin?view=site"><PlusCircle className="mr-2"/> Create a League</Link>
                         </Button>
                     )}
                 </CardContent>
             </Card>
          </main>
        </PageLayout>
    );
  }

  const getOwnerNames = (team: Team) => {
    if (!users.length) return '...';
    return (team.ownerUserIds || [])
        .map(id => users.find(u => u.id === id)?.displayName)
        .filter(Boolean)
        .join(' & ') || 'Unassigned';
  };

  return (
    <PageLayout>
      <AppHeader pageTitle="Dashboard" pageIcon={Home} />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <WeeklyStatus 
                competitions={currentWeekEvents} 
                contestants={contestants} 
                activeSeason={activeSeason} 
            />
          
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><TrendingUp /> Current Standings</CardTitle>
                      <CardDescription>Team rankings and weekly performance.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="flex justify-between items-center px-4 mb-2">
                          <span className="text-xs font-medium text-muted-foreground">TEAM</span>
                           <div className="flex items-center gap-8">
                            <span className="text-xs font-medium text-muted-foreground text-right">POINTS</span>
                           </div>
                      </div>
                      <div className="space-y-4">
                          {sortedTeams.map((team, index) => {
                               const currentRank = index + 1;
                               const weeklyScore = team.weekly_score || 0;
                               
                               const RankChangeIndicator = () => {
                                   if (weeklyScore === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
                                   if (weeklyScore > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
                                   return <TrendingDown className="h-3 w-3 text-red-500" />;
                               };
                               
                               return (
                               <div key={team.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                  <div className="flex items-center gap-3">
                                      <span className={cn("text-lg font-bold w-6 text-center", 
                                          index === 0 && "text-amber-400",
                                          index === 1 && "text-slate-300",
                                          index === 2 && "text-orange-400"
                                      )}>{currentRank}</span>
                                      <div>
                                          <p className="font-medium">{team.name}</p>
                                          <p className="text-sm text-muted-foreground">{getOwnerNames(team)}</p>
                                      </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                      <Badge 
                                         variant="secondary" 
                                         className={cn(
                                            "w-20 justify-center text-base",
                                            (team.total_score || 0) > 0 && "bg-green-100 text-green-800 hover:bg-green-200",
                                            (team.total_score || 0) < 0 && "bg-red-100 text-red-800 hover:bg-red-200",
                                            (team.total_score || 0) === 0 && "bg-gray-100 text-gray-800"
                                         )}
                                      >
                                        <span>{team.total_score || 0}</span>
                                      </Badge>
                                      <div className={cn("flex items-center text-xs mt-1",
                                          weeklyScore > 0 && "text-green-600",
                                          weeklyScore < 0 && "text-red-600",
                                          weeklyScore === 0 && "text-muted-foreground"
                                      )}>
                                          <RankChangeIndicator />
                                          <span className="ml-1 font-mono">
                                              {weeklyScore > 0 ? '+':''}{weeklyScore} this week
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          )})}
                      </div>
                  </CardContent>
              </Card>
              
              <div className="space-y-4 md:space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Flame /> Top Movers</CardTitle>
                        <CardDescription>Biggest point swings for Week {activeSeason.currentWeek}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                           {topMovers.map(({ score, contestants }) => (
                                <div key={score} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                    <div className="flex items-center gap-3">
                                      {contestants.length > 1 ? (
                                        <div className="flex -space-x-4">
                                          {contestants.slice(0, 3).map((c) => (
                                            <Image
                                              key={c.id}
                                              src={c.photoUrl || "https://placehold.co/100x100.png"}
                                              alt={getContestantDisplayName(c, 'full')}
                                              width={40}
                                              height={40}
                                              className="rounded-full border-2 border-background"
                                              data-ai-hint="portrait person"
                                            />
                                          ))}
                                          {contestants.length > 3 && (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border-2 border-background">
                                              <span className="text-sm font-bold">+{contestants.length - 3}</span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <Image
                                          src={contestants[0].photoUrl || "https://placehold.co/100x100.png"}
                                          alt={getContestantDisplayName(contestants[0], 'full')}
                                          width={40}
                                          height={40}
                                          className="rounded-full"
                                          data-ai-hint="portrait person"
                                        />
                                      )}
                                      <div className="flex-1">
                                        <p className="font-medium truncate text-sm">
                                            {contestants.length > 1
                                                ? contestants.map(c => getContestantDisplayName(c, 'short')).join(', ')
                                                : getContestantDisplayName(contestants[0], 'full')
                                            }
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant="default" className={cn("w-20 justify-center text-base", score > 0 ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200")}>
                                      <span>{score > 0 ? '+':''}{score || 0}</span>
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ListOrdered /> Weekly Activity</CardTitle>
                        <CardDescription>A log of all point-scoring events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                        {weeklyActivity.length > 0 ? weeklyActivity.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                                <Image
                                src={activity.player.photoUrl || "https://placehold.co/100x100.png"}
                                alt={getContestantDisplayName(activity.player, 'full')}
                                width={40}
                                height={40}
                                className="rounded-full"
                                data-ai-hint="portrait person"
                                />
                                <div>
                                <p className="text-sm">{activity.description}</p>
                                </div>
                            </div>
                            <Badge variant={activity.points! >= 0 ? "default" : "destructive"} className={cn(
                                    "w-12 justify-center text-xs",
                                    activity.points! >= 0 && "bg-green-100 text-green-800 hover:bg-green-200", 
                                    activity.points! < 0 && "bg-red-100 text-red-800")}>
                                    <span>{activity.points! > 0 ? '+': ''}{activity.points}</span>
                            </Badge>
                            </div>
                        )) : (
                            <p className="text-muted-foreground text-sm text-center py-4">No scoring activity logged yet.</p>
                        )}
                        </div>
                    </CardContent>
                </Card>
              </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}

export default withAuth(DashboardPage);
