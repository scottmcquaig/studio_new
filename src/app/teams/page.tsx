
'use client';

import { useState, useEffect, createElement, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, HelpCircle, TrendingUp, Trophy } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn, getContestantDisplayName } from "@/lib/utils";
import Image from "next/image";
import { getFirestore, collection, onSnapshot, doc, Unsubscribe, query, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Team, League, ScoringRuleSet, ScoringRule, Competition, Contestant, User, Pick, Season } from '@/lib/data';
import { AppHeader } from '@/components/app-header';
import withAuth from '@/components/withAuth';
import { PageLayout } from '@/components/page-layout';
import { Crown, Ban, ShieldCheck, TriangleAlert, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const ContestantProfileDialog = ({ contestant, team, rules, weeklyEvents, totalWins, totalNoms, totalPoints }: {
    contestant: Contestant,
    team: Team,
    rules: ScoringRule[],
    weeklyEvents: Competition[],
    totalWins: number,
    totalNoms: number,
    totalPoints: number,
}) => {
    const contestantWeeklyEvents = useMemo(() => {
        const events = [];
        for (const event of weeklyEvents) {
            const rule = rules.find(r => r.code === event.type);
            if (!rule) continue;

            if (event.winnerId === contestant.id || event.evictedId === contestant.id || event.nominees?.includes(contestant.id)) {
                events.push({ label: rule.label, points: rule.points });
            }
        }
        return events;
    }, [weeklyEvents, rules, contestant]);

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{getContestantDisplayName(contestant, 'full')}</DialogTitle>
                <p className="text-sm text-muted-foreground">{team.name}</p>
            </DialogHeader>
            <div className="py-4">
                <div className="flex flex-col items-center text-center gap-4">
                    <Image
                        src={contestant.photoUrl || "https://placehold.co/100x100.png"}
                        alt={getContestantDisplayName(contestant, 'full')}
                        width={96}
                        height={96}
                        className="rounded-full border-4"
                        data-ai-hint="portrait person"
                    />
                    <div className="flex items-center justify-around w-full text-center gap-2 text-sm pt-2">
                        <div className="flex flex-col items-center">
                            <Trophy className="h-5 w-5 text-amber-400" />
                            <span className="font-bold">{totalWins}</span>
                            <span className="text-xs text-muted-foreground">Wins</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <Users className="h-5 w-5 text-red-400" />
                            <span className="font-bold">{totalNoms}</span>
                            <span className="text-xs text-muted-foreground">Noms</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <span className="font-bold">{totalPoints}</span>
                            <span className="text-xs text-muted-foreground">Points</span>
                        </div>
                    </div>
                </div>
                <Separator className="my-4" />
                <h4 className="font-semibold mb-2">Current Week Scoring</h4>
                {contestantWeeklyEvents.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead className="text-right">Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contestantWeeklyEvents.map((event, index) => (
                                <TableRow key={index}>
                                    <TableCell>{event.label}</TableCell>
                                    <TableCell className={cn(
                                        "text-right font-mono font-bold",
                                        event.points >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        {event.points > 0 ? `+${event.points}` : event.points}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">No scoring events this week.</p>
                )}
            </div>
        </DialogContent>
    );
};


const TeamCard = ({ team, league, rules, competitions, contestants, users, picks, totalScore, weeklyEvents, weeklyStatusDisplay, onContestantClick }: { 
    team: Team, 
    league: League, 
    rules: ScoringRule[], 
    competitions: Competition[], 
    contestants: Contestant[], 
    users: User[], 
    picks: Pick[], 
    totalScore: number,
    weeklyEvents: Competition[],
    weeklyStatusDisplay: any[],
    onContestantClick: (contestant: Contestant) => void
}) => {
    const owners = (team.ownerUserIds || []).map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
    const teamPicks = picks.filter(p => p.teamId === team.id);
    const teamContestantIds = teamPicks.map(p => p.contestantId);
    const teamContestants = contestants.filter(hg => teamContestantIds.includes(hg.id));
    const breakdownCategories = (league.settings.scoringBreakdownCategories || []).filter(c => c.displayName);

    const hohEvent = useMemo(() => {
        const hohCard = weeklyStatusDisplay.find(c => c.ruleCode && c.ruleCode.includes('HOH'));
        return hohCard ? weeklyEvents.find(e => e.type === hohCard.ruleCode) : undefined;
    }, [weeklyEvents, weeklyStatusDisplay]);
    
    const povEvent = useMemo(() => {
        const povCard = weeklyStatusDisplay.find(c => c.ruleCode && c.ruleCode.includes('VETO'));
        return povCard ? weeklyEvents.find(e => e.type === povCard.ruleCode) : undefined;
    }, [weeklyEvents, weeklyStatusDisplay]);

    const nomEvent = useMemo(() => {
        const nomCard = weeklyStatusDisplay.find(c => c.isMultiPick);
        return nomCard ? weeklyEvents.find(e => e.type === nomCard.ruleCode) : undefined;
    }, [weeklyEvents, weeklyStatusDisplay]);

    const getContestantStatus = (hg: Contestant) => {
        if (hg.status !== 'active') return null;
        if (hg.id === hohEvent?.winnerId) return { label: 'HOH', className: 'bg-purple-600 text-white hover:bg-purple-700', icon: Crown };
        if (hg.id === povEvent?.winnerId) return { label: 'Veto', className: 'bg-amber-500 text-white hover:bg-amber-600', icon: Ban };
        if (hg.id === povEvent?.usedOnId) return { label: 'Saved', className: 'bg-sky-500 text-white hover:bg-sky-600', icon: ShieldCheck };
        if (nomEvent?.nominees?.includes(hg.id)) return { label: 'Nominee', className: 'bg-red-500 text-white hover:bg-red-600', icon: TriangleAlert };
        if (hg.id === povEvent?.replacementNomId) return { label: 'Renom', className: 'bg-orange-500 text-white hover:bg-orange-600', icon: RotateCcw };
        return null;
    };


    const calculateKpis = (teamPicks: Pick[], league: League, scoringRules: ScoringRule[], competitions: Competition[]) => {
        const breakdownCategories = league.settings.scoringBreakdownCategories || [];
        const kpis: { [key: string]: number } = {};
        
        breakdownCategories.forEach(category => {
            kpis[category.displayName] = 0;
        });

        const rules = scoringRules || [];
        if (!rules.length || !breakdownCategories.length) return { ...kpis };

        const teamContestantIds = teamPicks.map(p => p.contestantId);

        competitions.forEach(comp => {
            const processEvent = (contestantId: string, eventCode: string) => {
                if (teamContestantIds.includes(contestantId)) {
                    const rule = rules.find(r => r.code === eventCode);
                    if (rule) {
                        breakdownCategories.forEach(category => {
                            if (category.ruleCodes.includes(rule.code)) {
                                kpis[category.displayName] = (kpis[category.displayName] || 0) + 1;
                            }
                        });
                    }
                }
            };

            const rule = rules.find(r => r.code === comp.type);
            if (!rule) return;

            if (comp.winnerId) processEvent(comp.winnerId, comp.type);
            if (comp.evictedId) processEvent(comp.evictedId, comp.type);
            if (comp.nominees) comp.nominees.forEach(nomId => processEvent(nomId, comp.type));
        });

        return { ...kpis };
    };

    const kpis = useMemo(() => {
        if (!league || !rules.length || !contestants.length) return {};
        return calculateKpis(teamPicks, league, rules, competitions);
    }, [teamPicks, league, rules, competitions, contestants]);

    const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
        const IconComponent = (LucideIcons as any)[name];
        if (!IconComponent) {
        return <HelpCircle className={className} />;
        }
        return createElement(IconComponent, { className });
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{team.name}</CardTitle>
                        <CardDescription>
                            Owned by {owners.length > 0 ? owners.map(o => o.displayName).join(' & ') : 'Unassigned'}
                        </CardDescription>
                    </div>
                    <Badge 
                        variant="secondary" 
                        className={cn(
                            "text-lg font-bold",
                            totalScore > 0 && "bg-green-100 text-green-800 hover:bg-green-200",
                            totalScore < 0 && "bg-red-100 text-red-800 hover:bg-red-200",
                            totalScore === 0 && "bg-gray-100 text-gray-800"
                        )}
                    >
                        {totalScore.toLocaleString()} pts
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
               <div className="mb-4">
                 <h4 className="text-sm font-semibold text-muted-foreground mb-2">Roster</h4>
                 <div className="flex flex-wrap items-center gap-2">
                    {teamContestants.length > 0 ? teamContestants.map(hg => {
                        const status = getContestantStatus(hg);
                        return (
                            <DialogTrigger asChild key={hg.id}>
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                        "py-1 cursor-pointer", 
                                        hg.status !== 'active' && 'bg-muted text-muted-foreground',
                                        status && `${status.className} border-none`
                                    )}
                                    onClick={() => onContestantClick(hg)}
                                >
                                  <Image
                                      src={hg.photoUrl || "https://placehold.co/100x100.png"}
                                      alt={getContestantDisplayName(hg, 'full')}
                                      width={20}
                                      height={20}
                                      className={cn("rounded-full mr-2", hg.status !== 'active' && 'grayscale')}
                                      data-ai-hint="portrait person"
                                  />
                                  {getContestantDisplayName(hg, 'short')}
                                </Badge>
                            </DialogTrigger>
                        );
                    }) : (
                        <p className="text-xs text-muted-foreground">No contestants drafted yet.</p>
                    )}
                 </div>
               </div>

                <Separator className="my-4"/>
                
                <div>
                   <h4 className="text-sm font-semibold text-muted-foreground mb-3">Scoring Breakdown</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                        {breakdownCategories.map((category) => {
                            const value = (kpis as any)[category.displayName] || 0;
                            if (!category.displayName) return null;
                            return (
                                <div key={category.displayName} className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5">
                                      <DynamicIcon name={category.icon} className={cn("h-4 w-4", category.color)} />
                                      {category.displayName}
                                    </span>
                                    <span className="font-mono font-medium">{value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
};


function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeLeague, setActiveLeague] = useState<League | null>(null);
    const [scoringRules, setScoringRuleSet] = useState<ScoringRuleSet | null>(null);
    const [contestants, setContestants] = useState<Contestant[]>([]);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [picks, setPicks] = useState<Pick[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [activeSeason, setActiveSeason] = useState<Season | null>(null);
    const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);


    const db = getFirestore(app);

    useEffect(() => {
    const unsubLeagues = onSnapshot(collection(db, "leagues"), (snap) => {
        if (!snap.empty) {
            const leagues = snap.docs.map(d => ({...d.data(), id: d.id} as League));
            const currentLeague = leagues.length > 0 ? leagues[0] : null;
            setActiveLeague(currentLeague);
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
        }
    }, [activeLeague, seasons]);

    useEffect(() => {
        if (!activeLeague || !activeSeason) return;
        
        const unsubscribes: Unsubscribe[] = [];

        if (activeLeague.settings.scoringRuleSetId) {
            unsubscribes.push(onSnapshot(doc(db, "scoring_rules", activeLeague.settings.scoringRuleSetId), (ruleSnap) => {
                if (ruleSnap.exists()) setScoringRuleSet({ ...ruleSnap.data(), id: ruleSnap.id } as ScoringRuleSet);
            }));
        }
        
        const qTeams = query(collection(db, "teams"), where("leagueId", "==", activeLeague.id));
        unsubscribes.push(onSnapshot(qTeams, (snap) => setTeams(snap.docs.map(d => ({...d.data(), id: d.id } as Team)))));

        const qContestants = query(collection(db, "contestants"), where("seasonId", "==", activeSeason.id));
        unsubscribes.push(onSnapshot(qContestants, (snap) => setContestants(snap.docs.map(d => ({...d.data(), id: d.id } as Contestant)))));
        
        const qCompetitions = query(collection(db, "competitions"), where("seasonId", "==", activeSeason.id));
        unsubscribes.push(onSnapshot(qCompetitions, (snap) => setCompetitions(snap.docs.map(d => ({...d.data(), id: d.id } as Competition)))));
        
        unsubscribes.push(onSnapshot(query(collection(db, "users")), (snap) => setUsers(snap.docs.map(d => ({...d.data(), id: d.id } as User)))));
        
        const qPicks = query(collection(db, "picks"), where("leagueId", "==", activeLeague.id));
        unsubscribes.push(onSnapshot(qPicks, (snap) => setPicks(snap.docs.map(d => ({...d.data(), id: d.id } as Pick)))));
        
        return () => unsubscribes.forEach(unsub => unsub());
    }, [db, activeLeague, activeSeason]);
    
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
            
            const rule = rules.find(r => r.code === comp.type);
            if (!rule) return;

            if (comp.winnerId) processEvent(comp.winnerId, comp.type);
            if (comp.evictedId) processEvent(comp.evictedId, comp.type);
            if (comp.nominees) comp.nominees.forEach(nomId => processEvent(nomId, comp.type));
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
    }, [teams, scoringRules, picks, competitions]);


    const sortedTeams = useMemo(() => {
        return [...teamsWithScores].sort((a, b) => (b.total_score || 0) - (a.total_score || 0) || a.draftOrder - b.draftOrder)
    }, [teamsWithScores]);

    const rules = useMemo(() => scoringRules?.rules || [], [scoringRules]);
    
    const weeklyEvents = useMemo(() => {
        if (!activeSeason) return [];
        return competitions.filter(c => c.week === activeSeason.currentWeek);
    }, [competitions, activeSeason]);

    const weeklyStatusDisplay = useMemo(() => {
        if (!activeSeason) return [];
        const weekKey = `week${activeSeason.currentWeek}`;
        return activeSeason.weeklyStatusDisplay?.[weekKey] || [];
    }, [activeSeason]);

    const contestantStats = useMemo(() => {
        if (!selectedContestant) return { totalWins: 0, totalNoms: 0, totalPoints: 0 };
        
        let totalPoints = 0;
        let totalWins = 0;
        let totalNoms = 0;

        if (rules.length) {
            competitions.forEach(comp => {
                const rule = rules.find(r => r.code === comp.type);
                if (!rule) return;

                if (comp.winnerId === selectedContestant.id) {
                    if (rule.points > 0) totalWins += 1;
                    totalPoints += rule.points;
                }
                if (comp.nominees?.includes(selectedContestant.id)) {
                    if (rule.points < 0) totalNoms += 1;
                    totalPoints += rule.points;
                }
                if (comp.evictedId === selectedContestant.id) {
                    totalPoints += rule.points;
                }
            });
        }
        return { totalWins, totalNoms, totalPoints };
    }, [selectedContestant, competitions, rules]);


  if (!activeLeague || !contestants.length || !activeSeason) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div>Loading Teams...</div>
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
  
  const selectedTeam = selectedContestant ? teams.find(t => picks.some(p => p.teamId === t.id && p.contestantId === selectedContestant.id)) : null;

  return (
    <PageLayout>
      <AppHeader pageTitle="Teams & Standings" pageIcon={Users}/>
      <main className="flex-1 p-4 md:p-8">
        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedContestant(null)}>
            <div className="flex flex-1 flex-col gap-4 md:gap-8">
              
              <Card>
                  <CardHeader>
                      <CardTitle>Current Standings</CardTitle>
                      <CardDescription>Teams are ranked by total points accumulated throughout the season.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {sortedTeams.map((team, index) => (
                          <div key={team.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                              <span className={cn("text-xl font-bold w-6 text-center", 
                                  index === 0 && "text-amber-400",
                                  index === 1 && "text-slate-400",
                                  index === 2 && "text-orange-500"
                              )}>{index + 1}</span>
                              <div>
                                  <p className="font-semibold text-sm truncate">{team.name}</p>
                                  <p className="text-xs text-muted-foreground">{team.total_score.toLocaleString()} pts</p>
                              </div>
                          </div>
                      ))}
                  </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeLeague && sortedTeams.map((team) => (
                      <TeamCard 
                          key={team.id}
                          team={team}
                          league={activeLeague}
                          rules={rules}
                          competitions={competitions}
                          contestants={contestants}
                          users={users}
                          picks={picks}
                          totalScore={team.total_score}
                          weeklyEvents={weeklyEvents}
                          weeklyStatusDisplay={weeklyStatusDisplay}
                          onContestantClick={setSelectedContestant}
                      />
                  ))}
              </div>
            </div>
            
            {selectedContestant && selectedTeam && (
                <ContestantProfileDialog 
                    contestant={selectedContestant}
                    team={selectedTeam}
                    rules={rules}
                    weeklyEvents={weeklyEvents}
                    totalWins={contestantStats.totalWins}
                    totalNoms={contestantStats.totalNoms}
                    totalPoints={contestantStats.totalPoints}
                />
            )}
        </Dialog>
      </main>
    </PageLayout>
  );
}

export default withAuth(TeamsPage);
