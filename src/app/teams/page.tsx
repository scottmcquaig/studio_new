
'use client';

import { useState, useEffect, createElement, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, HelpCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn, getContestantDisplayName } from "@/lib/utils";
import Image from "next/image";
import { getFirestore, collection, onSnapshot, doc, Unsubscribe, query } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Team, League, ScoringRuleSet, ScoringRule, Competition, Contestant, User } from '@/lib/data';
import { AppHeader } from '@/components/app-header';
import { BottomNavBar } from '@/components/bottom-nav-bar';

const calculateKpis = (team: Team, league: League, scoringRules: ScoringRule[], competitions: Competition[], contestants: Contestant[]) => {
    const breakdownCategories = league.settings.scoringBreakdownCategories || [];
    const kpis: { [key: string]: number } = {};
    
    breakdownCategories.forEach(category => {
        kpis[category.displayName] = 0;
    });

    const rules = scoringRules || [];
    if (!rules.length || !breakdownCategories.length) return { ...kpis, total: team.total_score || 0 };

    const teamContestantIds = contestants.filter(c => team.contestantIds?.includes(c.id)).map(c => c.id);

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

        if (comp.winnerId) {
            let eventCode = '';
            if (comp.type === 'HOH') eventCode = 'HOH_WIN';
            else if (comp.type === 'VETO') eventCode = 'VETO_WIN';
            else if (comp.type === 'BLOCK_BUSTER') eventCode = 'BLOCK_BUSTER_SAFE'; // Example, adjust as needed
            else if (comp.type === 'SPECIAL_EVENT') eventCode = comp.specialEventCode || '';
            
            if (eventCode) {
                processEvent(comp.winnerId, eventCode);
            }
        }
        
        if (comp.type === 'NOMINATIONS' && comp.nominees) {
            comp.nominees.forEach(nomId => {
                const isFinalNom = comp.finalNoms?.includes(nomId);
                processEvent(nomId, 'NOMINATED');
                if (isFinalNom) {
                     processEvent(nomId, 'FINAL_NOM');
                }
            });
        }
        
        if (comp.type === 'EVICTION' && comp.evictedId) {
            processEvent(comp.evictedId, 'EVICTED');
        }
    });

    const totalCalculated = Object.values(kpis).reduce((acc, val) => acc + val, 0);

    return { ...kpis, total: totalCalculated };
};


const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (LucideIcons as any)[name];
    if (!IconComponent) {
      return <HelpCircle className={className} />;
    }
    return createElement(IconComponent, { className });
};

const TeamCard = ({ team, league, rules, competitions, contestants, users }: { team: Team, league: League, rules: ScoringRule[], competitions: Competition[], contestants: Contestant[], users: User[] }) => {
    const owners = (team.ownerUserIds || []).map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
    
    const teamContestants = contestants.filter(hg => (team.contestantIds || []).includes(hg.id));
    const breakdownCategories = (league.settings.scoringBreakdownCategories || []).filter(c => c.displayName);

    const kpis = useMemo(() => {
        if (!league || !rules.length || !contestants.length) return { total: team.total_score || 0 };
        return calculateKpis(team, league, rules, competitions, contestants);
    }, [team, league, rules, competitions, contestants]);
    
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
                    <Badge variant="secondary" className="text-lg font-bold">{(kpis.total || 0).toLocaleString()} pts</Badge>
                </div>
            </CardHeader>
            <CardContent>
               <div className="mb-4">
                 <h4 className="text-sm font-semibold text-muted-foreground mb-2">Roster</h4>
                 <div className="flex flex-wrap items-center gap-2">
                    {teamContestants.length > 0 ? teamContestants.map(hg => (
                        <Badge key={hg.id} variant="outline" className={cn("py-1", hg.status !== 'active' && 'bg-muted text-muted-foreground')}>
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
                    )) : (
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


export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [league, setLeague] = useState<League | null>(null);
    const [scoringRules, setScoringRuleSet] = useState<ScoringRuleSet | null>(null);
    const [contestants, setContestants] = useState<Contestant[]>([]);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const db = getFirestore(app);

    useEffect(() => {
        const unsubscribes: Unsubscribe[] = [];

        const leagueDocRef = doc(db, "leagues", "bb27");
        const unsubscribeLeague = onSnapshot(leagueDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const leagueData = { ...docSnap.data(), id: docSnap.id } as League;
                
                if (leagueData.settings.scoringRuleSetId) {
                    const ruleSetDocRef = doc(db, "scoring_rules", leagueData.settings.scoringRuleSetId);
                    const unsubscribeRules = onSnapshot(ruleSetDocRef, (ruleSnap) => {
                        if (ruleSnap.exists()) {
                            setScoringRuleSet({ ...ruleSnap.data(), id: ruleSnap.id } as ScoringRuleSet);
                        }
                    });
                    unsubscribes.push(unsubscribeRules);
                }
                setLeague(leagueData);
            }
        });
        unsubscribes.push(unsubscribeLeague);

        const teamsCol = collection(db, "teams");
        const unsubscribeTeams = onSnapshot(query(teamsCol), (querySnapshot) => {
            const teamsData: Team[] = [];
            querySnapshot.forEach((doc) => {
                teamsData.push({ ...doc.data(), id: doc.id } as Team);
            });
            setTeams(teamsData);
        });
        unsubscribes.push(unsubscribeTeams);

        const contestantsCol = collection(db, "contestants");
        const unsubscribeContestants = onSnapshot(query(contestantsCol), (querySnapshot) => {
            const contestantsData: Contestant[] = [];
            querySnapshot.forEach((doc) => {
                contestantsData.push({ ...doc.data(), id: doc.id } as Contestant);
            });
            setContestants(contestantsData);
        });
        unsubscribes.push(unsubscribeContestants);
        
        const competitionsCol = collection(db, "competitions");
        const unsubscribeCompetitions = onSnapshot(query(competitionsCol), (querySnapshot) => {
            const competitionsData: Competition[] = [];
            querySnapshot.forEach((doc) => {
                competitionsData.push({ ...doc.data(), id: doc.id } as Competition);
            });
            setCompetitions(competitionsData);
        });
        unsubscribes.push(unsubscribeCompetitions);
        
        const usersCol = collection(db, "users");
        const unsubscribeUsers = onSnapshot(query(usersCol), (querySnapshot) => {
            const usersData: User[] = [];
            querySnapshot.forEach((doc) => {
                usersData.push({ ...doc.data(), id: doc.id } as User);
            });
            setUsers(usersData);
        });
        unsubscribes.push(unsubscribeUsers);
        
        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [db]);

    const sortedTeams = useMemo(() => {
        return [...teams].sort((a, b) => (b.total_score || 0) - (a.total_score || 0) || a.draftOrder - b.draftOrder)
    }, [teams]);

    const rules = useMemo(() => scoringRules?.rules || [], [scoringRules]);
    
  if (!league || !contestants.length) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div>Loading Teams...</div>
        </div>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1 pb-20">
        <div className="flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
            <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams & Standings
            </h1>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            
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
                                <p className="text-xs text-muted-foreground">{(team.total_score || 0).toLocaleString()} pts</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {league && sortedTeams.map((team) => (
                    <TeamCard 
                        key={team.id}
                        team={team}
                        league={league}
                        rules={rules}
                        competitions={competitions}
                        contestants={contestants}
                        users={users}
                    />
                ))}
            </div>
          </div>
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}

    