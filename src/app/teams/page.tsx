
'use client';

import { useState, useEffect, createElement, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, HelpCircle } from "lucide-react";
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


const TeamCard = ({ team, league, rules, competitions, contestants, users, picks, totalScore, weeklyEvents, weeklyStatusDisplay }: { 
    team: Team, 
    league: League, 
    rules: ScoringRule[], 
    competitions: Competition[], 
    contestants: Contestant[], 
    users: User[], 
    picks: Pick[], 
    totalScore: number,
    weeklyEvents: Competition[],
    weeklyStatusDisplay: any[]
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
                                kpis[category.displayName] = (kpis[category.displayName] || 0) + rule.points;
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
                            <Badge key={hg.id} variant="outline" className={cn(
                                "py-1", 
                                hg.status !== 'active' && 'bg-muted text-muted-foreground',
                                status && `${status.className} border-none`
                            )}>
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
                                    <span className="font-mono font-medium">{value > 0 ? '+':''}{value}</span>
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

  return (
    <PageLayout>
      <AppHeader pageTitle="Teams & Standings" pageIcon={Users}/>
      <main className="flex-1 p-4 md:p-8">
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
                  />
              ))}
          </div>
        </div>
      </main>
    </PageLayout>
  );
}

export default withAuth(TeamsPage);

    
