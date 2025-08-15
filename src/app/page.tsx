
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
  Crown,
  Users,
  HelpCircle,
  TrendingUp,
  ListOrdered,
  RotateCcw,
  UserCheck,
  Ban,
  BrickWall,
  Skull,
  TriangleAlert,
  Flame,
} from "lucide-react";
import { cn, getContestantDisplayName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/app-header";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, onSnapshot, query, doc, Unsubscribe, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Team, League, ScoringRuleSet, Competition, Contestant, Season, User, Pick, ScoringRule } from '@/lib/data';
import { MOCK_SEASONS } from "@/lib/data";
import withAuth from "@/components/withAuth";

const LEAGUE_ID = 'bb27';

function DashboardPage() {
  const db = getFirestore(app);

  const [teams, setTeams] = useState<Team[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRuleSet | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);

  // Using mock for now, will be dynamic later
  const activeSeason = MOCK_SEASONS[0]; 

  useEffect(() => {
    const unsubscribes: Unsubscribe[] = [];

    unsubscribes.push(onSnapshot(doc(db, "leagues", LEAGUE_ID), (docSnap) => {
        if (docSnap.exists()) {
            const leagueData = { ...docSnap.data(), id: docSnap.id } as League;
            setLeague(leagueData);
            if (leagueData.settings.scoringRuleSetId) {
                unsubscribes.push(onSnapshot(doc(db, "scoring_rules", leagueData.settings.scoringRuleSetId), (ruleSnap) => {
                    if (ruleSnap.exists()) setScoringRules({ ...ruleSnap.data(), id: ruleSnap.id } as ScoringRuleSet);
                }));
            }
        }
    }));
    
    unsubscribes.push(onSnapshot(query(collection(db, "teams"), where("leagueId", "==", LEAGUE_ID)), (snap) => setTeams(snap.docs.map(d => ({...d.data(), id: d.id } as Team)))));
    unsubscribes.push(onSnapshot(query(collection(db, "contestants")), (snap) => setContestants(snap.docs.map(d => ({...d.data(), id: d.id } as Contestant)))));
    unsubscribes.push(onSnapshot(query(collection(db, "competitions")), (snap) => setCompetitions(snap.docs.map(d => ({...d.data(), id: d.id } as Competition)))));
    unsubscribes.push(onSnapshot(query(collection(db, "users")), (snap) => setUsers(snap.docs.map(d => ({...d.data(), id: d.id } as User)))));
    unsubscribes.push(onSnapshot(query(collection(db, "picks"), where("leagueId", "==", LEAGUE_ID)), (snap) => setPicks(snap.docs.map(d => ({...d.data(), id: d.id } as Pick)))));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [db]);

  const currentWeekEvents = useMemo(() => 
    competitions.filter((c) => c.week === activeSeason.currentWeek),
    [competitions, activeSeason.currentWeek]
  );
  
  const hoh = useMemo(() => currentWeekEvents.find((c) => c.type === "HOH"), [currentWeekEvents]);
  const hohWinner = useMemo(() => contestants.find((hg) => hg.id === hoh?.winnerId), [contestants, hoh]);

  const noms = useMemo(() => currentWeekEvents.find((c) => c.type === "NOMINATIONS"), [currentWeekEvents]);
  const nomWinners = useMemo(() => contestants.filter((hg) => noms?.nominees?.includes(hg.id)), [contestants, noms]);

  const pov = useMemo(() => currentWeekEvents.find((c) => c.type === "VETO"), [currentWeekEvents]);
  const povWinner = useMemo(() => contestants.find((hg) => hg.id === pov?.winnerId), [contestants, pov]);
  const savedPlayer = useMemo(() => contestants.find((hg) => hg.id === pov?.usedOnId), [contestants, pov]);
  const renomPlayer = useMemo(() => contestants.find((hg) => hg.id === pov?.replacementNomId), [contestants, pov]);

  const blockBuster = useMemo(() => currentWeekEvents.find((c) => c.type === "BLOCK_BUSTER"), [currentWeekEvents]);
  const blockBusterWinner = useMemo(() => contestants.find((hg) => hg.id === blockBuster?.winnerId), [contestants, blockBuster]);

  const eviction = useMemo(() => currentWeekEvents.find((c) => c.type === "EVICTION"), [currentWeekEvents]);
  const evictedPlayer = useMemo(() => contestants.find((hg) => hg.id === eviction?.evictedId), [contestants, eviction]);
  
  const calculateTeamScore = (team: Team, rules: ScoringRule[], teamPicks: Pick[], competitions: Competition[]): number => {
    let score = 0;
    if (!rules.length || !teamPicks.length) return 0;

    const teamContestantIds = teamPicks.map(p => p.contestantId);

    competitions.forEach(comp => {
        const processEvent = (contestantId: string, eventCode: string) => {
            if (teamContestantIds.includes(contestantId)) {
                const rule = rules.find(r => r.code === eventCode);
                if (rule) {
                    score += rule.points;
                }
            }
        };
        
        if (comp.winnerId) {
            let code = '';
            if (comp.type === 'HOH') code = 'HOH_WIN';
            else if (comp.type === 'VETO') code = 'VETO_WIN';
            else if (comp.type === 'BLOCK_BUSTER') code = 'BLOCK_BUSTER_SAFE';
            else if (comp.type === 'SPECIAL_EVENT') code = comp.specialEventCode || '';
            if (code) processEvent(comp.winnerId, code);

            if (comp.type === 'VETO' && comp.used) {
                processEvent(comp.winnerId, 'VETO_USED');
            }
        }

        if (comp.type === 'NOMINATIONS' && comp.nominees) {
            comp.nominees.forEach(nomId => processEvent(nomId, 'NOMINATED'));
        }
        
        if (comp.type === 'EVICTION' && comp.evictedId) {
            const juryStartWeek = league?.settings.juryStartWeek;
            const eventCode = juryStartWeek && comp.week >= juryStartWeek ? 'EVICT_POST' : 'EVICT_PRE';
            processEvent(comp.evictedId, eventCode);
        }
    });
    return score;
  };

  const teamsWithScores = useMemo(() => {
    if (!teams.length || !scoringRules?.rules.length || !picks.length) return [];
    
    return teams.map(team => {
      const teamPicks = picks.filter(p => p.teamId === team.id);
      const total_score = calculateTeamScore(team, scoringRules.rules, teamPicks, competitions);
      return { ...team, total_score };
    });
  }, [teams, scoringRules, picks, competitions, league]);

  const sortedTeams = useMemo(() => {
    return [...teamsWithScores].sort((a, b) => (b.total_score || 0) - (a.total_score || 0) || a.draftOrder - b.draftOrder);
  }, [teamsWithScores]);
  
  const topMovers = useMemo(() => {
    if (!scoringRules?.rules.length || !contestants.length || !currentWeekEvents.length) return [];
    
    const weeklyScores: {[key: string]: { contestant: Contestant, score: number }} = {};
    
    contestants.forEach(c => weeklyScores[c.id] = { contestant: c, score: 0 });

    currentWeekEvents.forEach(comp => {
        const processEvent = (contestantId: string, eventCode: string) => {
            const rule = scoringRules.rules.find(r => r.code === eventCode);
            if (rule && weeklyScores[contestantId] !== undefined) {
                weeklyScores[contestantId].score += rule.points;
            }
        };

        if (comp.winnerId) {
            let code = '';
            if (comp.type === 'HOH') code = 'HOH_WIN';
            else if (comp.type === 'VETO') code = 'VETO_WIN';
            else if (comp.type === 'BLOCK_BUSTER') code = 'BLOCK_BUSTER_SAFE';
            else if (comp.type === 'SPECIAL_EVENT') code = comp.specialEventCode || '';
            if (code) processEvent(comp.winnerId, code);

            if (comp.type === 'VETO' && comp.used) {
                processEvent(comp.winnerId, 'VETO_USED');
            }
        }
        if (comp.type === 'NOMINATIONS' && comp.nominees) {
            comp.nominees.forEach(nomId => processEvent(nomId, 'NOMINATED'));
        }
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
    if (!scoringRules?.rules || !contestants.length) return [];
    
    const activities: any[] = [];
    currentWeekEvents.forEach(event => {
        if (event.type === 'HOH' && event.winnerId) {
            const player = contestants.find(c => c.id === event.winnerId);
            const rule = scoringRules.rules.find(r => r.code === 'HOH_WIN');
            if(player && rule) activities.push({
                player,
                description: `${getContestantDisplayName(player, 'full')} won Head of Household.`,
                points: rule.points,
                type: 'HOH Win'
            });
        }
        if (event.type === 'NOMINATIONS' && event.nominees) {
            event.nominees.forEach(nomId => {
                const player = contestants.find(c => c.id === nomId);
                const rule = scoringRules.rules.find(r => r.code === 'NOMINATED');
                if(player && rule) activities.push({
                    player,
                    description: `${getContestantDisplayName(player, 'full')} was nominated for eviction.`,
                    points: rule.points,
                    type: 'Nomination'
                });
            });
        }
        if (event.type === 'VETO' && event.winnerId) {
            const player = contestants.find(c => c.id === event.winnerId);
            const rule = scoringRules.rules.find(r => r.code === 'VETO_WIN');
            if(player && rule) activities.push({
                player,
                description: `${getContestantDisplayName(player, 'full')} won the Power of Veto.`,
                points: rule.points,
                type: 'Veto Win'
            });
        }
    });
    return activities;
  }, [currentWeekEvents, contestants, scoringRules]);


  if (!league || !contestants.length) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div>Loading Dashboard...</div>
        </div>
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
    <>
      <AppHeader />
      <main className="flex-1 pb-20">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
          <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
            <Home className="h-5 w-5" />
            Dashboard
          </h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Week {activeSeason.currentWeek} Status</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {activeSeason.title}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background col-span-1">
                <h3 className="font-semibold flex items-center gap-1 text-purple-600">
                  <Crown className="h-4 w-4" /> HOH
                </h3>
                {hohWinner ? (
                  <>
                    <Image
                      src={hohWinner.photoUrl || "https://placehold.co/100x100.png"}
                      alt={getContestantDisplayName(hohWinner, 'full')}
                      width={64}
                      height={64}
                      className="rounded-full border-2 border-purple-600"
                      data-ai-hint="portrait person"
                    />
                    <span className="text-sm">{getContestantDisplayName(hohWinner, 'short')}</span>
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

              <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background col-span-2">
                <h3 className="font-semibold flex items-center gap-1 text-red-400">
                  <TriangleAlert className="h-4 w-4" /> Noms
                </h3>
                <div className="flex items-center justify-center gap-2 min-h-[76px]">
                  {nomWinners.length > 0 ? (
                    nomWinners.map((nom) => (
                      <div
                        key={nom.id}
                        className="flex flex-col items-center gap-1"
                      >
                        <Image
                          src={nom.photoUrl || "https://placehold.co/100x100.png"}
                          alt={getContestantDisplayName(nom, 'full')}
                          width={48}
                          height={48}
                          className="rounded-full border-2 border-red-400"
                          data-ai-hint="portrait person"
                        />
                        <span className="text-xs">
                          {getContestantDisplayName(nom, 'short')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50">
                        <HelpCircle className="w-6 h-6 text-muted-foreground" />
                      </div>
                       <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50">
                        <HelpCircle className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </>
                  )}
                </div>
                {nomWinners.length === 0 && (
                  <span className="text-sm text-muted-foreground -mt-2">TBD</span>
                )}
              </div>
              
              <div className="flex items-stretch text-center gap-2 p-4 rounded-lg bg-background col-span-1">
                <div className="flex flex-col items-center flex-grow">
                  <h3 className="font-semibold flex items-center gap-1 text-amber-500">
                    <Ban className="h-4 w-4" /> POV
                  </h3>
                  {povWinner ? (
                    <>
                      <Image
                        src={povWinner.photoUrl || "https://placehold.co/100x100.png"}
                        alt={getContestantDisplayName(povWinner, 'full')}
                        width={64}
                        height={64}
                        className="rounded-full border-2 border-amber-500 mt-2"
                        data-ai-hint="portrait person"
                      />
                      <span className="text-sm mt-1">{getContestantDisplayName(povWinner, 'short')}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50 mt-2">
                        <HelpCircle className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground mt-1">TBD</span>
                    </>
                  )}
                </div>
                <Separator orientation="vertical" className="h-auto"/>
                 <div className="flex flex-col items-center justify-center w-[35%] min-w-fit">
                  {pov?.used === false && (
                      <div className="flex flex-col items-center gap-1">
                        <Ban className="h-8 w-8 text-muted-foreground"/>
                        <span className="text-xs text-muted-foreground">Not Used</span>
                      </div>
                    )}
                    {pov?.used === true && savedPlayer && (
                       <div className="flex flex-col items-center gap-2">
                         <div className="flex flex-col items-center">
                            <span className="text-xs font-semibold flex items-center gap-1"><UserCheck className="h-3 w-3 text-green-500"/> Saved</span>
                            <span className="text-xs">{getContestantDisplayName(savedPlayer, 'short')}</span>
                         </div>
                         <div className="flex flex-col items-center mt-1">
                             <span className="text-xs font-semibold flex items-center gap-1"><RotateCcw className="h-3 w-3 text-orange-500"/> Renom</span>
                             <span className="text-xs">{renomPlayer ? getContestantDisplayName(renomPlayer, 'short') : 'TBD'}</span>
                         </div>
                       </div>
                    )}
                    {pov?.used === undefined && povWinner && (
                       <div className="flex flex-col items-center gap-1">
                        <HelpCircle className="h-8 w-8 text-muted-foreground"/>
                        <span className="text-xs text-muted-foreground">TBD</span>
                      </div>
                    )}
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background col-span-1">
                <h3 className="font-semibold flex items-center gap-1 text-sky-500">
                  <BrickWall className="h-4 w-4" /> Block Buster
                </h3>
                {blockBusterWinner ? (
                  <>
                    <Image
                      src={blockBusterWinner.photoUrl || "https://placehold.co/100x100.png"}
                      alt={getContestantDisplayName(blockBusterWinner, 'full')}
                      width={64}
                      height={64}
                      className="rounded-full border-2 border-sky-500"
                      data-ai-hint="portrait person"
                    />
                    <span className="text-sm">{getContestantDisplayName(blockBusterWinner, 'short')}</span>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50">
                      <HelpCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">None</span>
                  </>
                )}
              </div>


              <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background col-span-1">
                <h3 className="font-semibold flex items-center gap-1 text-muted-foreground">
                  <Skull className="h-4 w-4" /> Evicted
                </h3>
                {evictedPlayer ? (
                  <>
                    <Image
                      src={evictedPlayer.photoUrl || "https://placehold.co/100x100.png"}
                      alt={getContestantDisplayName(evictedPlayer, 'full')}
                      width={64}
                      height={64}
                      className="rounded-full border-2 border-muted-foreground"
                      data-ai-hint="portrait person"
                    />
                    <span className="text-sm">{getContestantDisplayName(evictedPlayer, 'short')}</span>
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
          
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><TrendingUp /> Current Standings</CardTitle>
                      <CardDescription>Team rankings and weekly performance.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="flex justify-between items-center px-4 mb-2">
                          <span className="text-xs font-medium text-muted-foreground">TEAM</span>
                          <span className="text-xs font-medium text-muted-foreground">POINTS</span>
                      </div>
                      <div className="space-y-4">
                          {sortedTeams.map((team, index) => (
                               <div key={team.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                  <div className="flex items-center gap-3">
                                      <span className={cn("text-lg font-bold w-6 text-center", 
                                          index === 0 && "text-amber-400",
                                          index === 1 && "text-slate-300",
                                          index === 2 && "text-orange-400"
                                      )}>{index + 1}</span>
                                      <div>
                                          <p className="font-medium">{team.name}</p>
                                          <p className="text-sm text-muted-foreground">{getOwnerNames(team)}</p>
                                      </div>
                                  </div>
                                  <Badge variant="secondary" className="w-20 justify-center text-base">
                                    <span>{team.total_score || 0}</span>
                                  </Badge>
                              </div>
                          ))}
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
                                      <Image
                                        src={contestants[0].photoUrl || "https://placehold.co/100x100.png"}
                                        alt={getContestantDisplayName(contestants[0], 'full')}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                        data-ai-hint="portrait person"
                                      />
                                      <div className="flex-1">
                                        <p className="font-medium truncate">
                                            {contestants.map(c => getContestantDisplayName(c, 'short')).join(', ')}
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
      <BottomNavBar />
    </>
  );
}

export default withAuth(DashboardPage);
