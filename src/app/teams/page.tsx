
'use client';

import { useState, useEffect, createElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOCK_USERS, MOCK_CONTESTANTS, MOCK_COMPETITIONS, MOCK_SCORING_RULES, MOCK_TEAMS, MOCK_LEAGUES } from "@/lib/data";
import { Users, Crown, Shield, UserX, UserCheck, ShieldPlus, BarChart2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getFirestore, collection, onSnapshot, doc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Team, League, ScoringRuleSet, LeagueScoringBreakdownCategory } from '@/lib/data';

// Calculate KPIs for a team
const calculateKpis = (team: Team, league: League | null, scoringRules: ScoringRuleSet | null) => {
    if (!league) return { total: team.total_score || 0 };

    const breakdownCategories = league.settings.scoringBreakdownCategories || [];
    const rules = scoringRules?.rules || [];
    
    const kpis: { [key: string]: number } = {};
    
    breakdownCategories.forEach(category => {
        kpis[category.displayName] = 0;
    });

    if (!rules.length || !breakdownCategories.length) return { ...kpis, total: team.total_score || 0 };

    const teamContestantIds = team.contestantIds || [];

    MOCK_COMPETITIONS.forEach(comp => {
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
            else if (comp.type === 'BLOCK_BUSTER') eventCode = 'BLOCK_BUSTER_SAFE';
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

    return { ...kpis, total: team.total_score || 0 };
};


export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [league, setLeague] = useState<League | null>(null);
    const [scoringRules, setScoringRules] = useState<ScoringRuleSet | null>(null);
    const db = getFirestore(app);

    useEffect(() => {
        // Assume one league for now, in a real app you'd select this
        const leagueDocRef = doc(db, "leagues", "bb27");
        const unsubscribeLeague = onSnapshot(leagueDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const leagueData = { ...docSnap.data(), id: docSnap.id } as League;
                setLeague(leagueData);
                
                if (leagueData.settings.scoringRuleSetId) {
                    const ruleSetDocRef = doc(db, "scoring_rules", leagueData.settings.scoringRuleSetId);
                    const unsubscribeRules = onSnapshot(ruleSetDocRef, (ruleSnap) => {
                        if (ruleSnap.exists()) {
                            setScoringRules({ ...ruleSnap.data(), id: ruleSnap.id } as ScoringRuleSet);
                        }
                    });
                    // In a real app, manage this unsubscribe properly
                }
            } else {
                setLeague(MOCK_LEAGUES[0]);
                const ruleset = MOCK_SCORING_RULES.find(rs => rs.id === MOCK_LEAGUES[0].settings.scoringRuleSetId);
                if (ruleset) setScoringRules(ruleset);
            }
        });

        const teamsCol = collection(db, "teams");
        const unsubscribeTeams = onSnapshot(teamsCol, (querySnapshot) => {
            if (!querySnapshot.empty) {
                const teamsData: Team[] = [];
                querySnapshot.forEach((doc) => {
                    teamsData.push({ ...doc.data(), id: doc.id } as Team);
                });
                setTeams(teamsData);
            } else {
                setTeams(MOCK_TEAMS);
            }
        });
        
        return () => {
            unsubscribeLeague();
            unsubscribeTeams();
        };
    }, [db]);

    const sortedTeams = [...teams].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    const breakdownCategories = league?.settings.scoringBreakdownCategories || [];
    
    const getOwner = (userId: string) => MOCK_USERS.find(u => u.id === userId);
    
    const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
      const IconComponent = (LucideIcons as any)[name];
      if (!IconComponent) {
        return <LucideIcons.HelpCircle className={className} />;
      }
      return createElement(IconComponent, { className });
    };

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <Users className="h-5 w-5" />
          Teams & Standings
        </h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        
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
            {sortedTeams.map((team) => {
                const owners = team.ownerUserIds.map(getOwner);
                const kpis = calculateKpis(team, league, scoringRules);
                const teamContestants = MOCK_CONTESTANTS.filter(hg => (team.contestantIds || []).includes(hg.id));

                return (
                    <Card key={team.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{team.name}</CardTitle>
                                    <CardDescription>
                                        Owned by {owners.map(o => o?.displayName).join(' & ')}
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="text-lg font-bold">{(kpis.total || 0).toLocaleString()} pts</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                           <div className="mb-4">
                             <h4 className="text-sm font-semibold text-muted-foreground mb-2">Roster</h4>
                             <div className="flex items-center gap-2">
                                {teamContestants.map(hg => (
                                    <div key={hg.id} className="flex flex-col items-center">
                                        <Image
                                            src={hg.photoUrl || "https://placehold.co/100x100.png"}
                                            alt={hg.fullName}
                                            width={56}
                                            height={56}
                                            className={cn("rounded-full border-2", hg.status !== 'active' && 'grayscale')}
                                            data-ai-hint="portrait person"
                                        />
                                        <span className="text-xs mt-1 font-medium">{hg.fullName.split(' ')[0]}</span>
                                    </div>
                                ))}
                             </div>
                           </div>

                            <Separator className="my-4"/>
                            
                            <div>
                               <h4 className="text-sm font-semibold text-muted-foreground mb-3">Scoring Breakdown</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                                    {breakdownCategories.map((category) => {
                                        const value = kpis[category.displayName] || 0;
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
                )
            })}
        </div>
      </main>
    </div>
  );
}
