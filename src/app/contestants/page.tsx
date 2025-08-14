
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Contestant, Competition, Season, League, ScoringRuleSet, Team, Pick } from '@/lib/data';
import { UserSquare, Crown, Shield, Users, BarChart2, TrendingUp, TrendingDown, Star, Trophy, Minus, ShieldCheck, TriangleAlert, Ban, Blocks, Skull } from "lucide-react";
import { cn, getContestantDisplayName } from '@/lib/utils';
import { AppHeader } from '@/components/app-header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { getFirestore, collection, onSnapshot, query, doc, Unsubscribe } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { MOCK_SEASONS } from "@/lib/data";
import withAuth from '@/components/withAuth';

type ContestantWithStats = Contestant & {
  teamName: string;
  totalWins: number;
  totalNoms: number;
  totalPoints: number;
  evictionWeek?: number;
};

function ContestantsPage() {
  const [selectedContestant, setSelectedContestant] = useState<ContestantWithStats | null>(null);
  
  const db = getFirestore(app);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRuleSet | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  
  const activeSeason = useMemo(() => MOCK_SEASONS[0], []);
  
  useEffect(() => {
        const unsubscribes: Unsubscribe[] = [];
        
        const leagueDocRef = doc(db, "leagues", "bb27");
        unsubscribes.push(onSnapshot(leagueDocRef, (docSnap) => {
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

        unsubscribes.push(onSnapshot(query(collection(db, "contestants")), (snap) => setContestants(snap.docs.map(d => ({...d.data(), id: d.id } as Contestant)))));
        unsubscribes.push(onSnapshot(query(collection(db, "competitions")), (snap) => setCompetitions(snap.docs.map(d => ({...d.data(), id: d.id } as Competition)))));
        unsubscribes.push(onSnapshot(query(collection(db, "teams")), (snap) => setTeams(snap.docs.map(d => ({...d.data(), id: d.id } as Team)))));
        unsubscribes.push(onSnapshot(query(collection(db, "picks")), (snap) => setPicks(snap.docs.map(d => ({...d.data(), id: d.id } as Pick)))));

        return () => unsubscribes.forEach(unsub => unsub());
  }, [db]);

  const weekEvents = useMemo(() => competitions.filter(c => c.week === activeSeason.currentWeek), [competitions, activeSeason.currentWeek]);
  
  const hoh = useMemo(() => weekEvents.find(c => c.type === 'HOH'), [weekEvents]);
  const pov = useMemo(() => weekEvents.find(c => c.type === 'VETO'), [weekEvents]);
  const noms = useMemo(() => weekEvents.find(c => c.type === 'NOMINATIONS'), [weekEvents]);
  const blockBuster = useMemo(() => weekEvents.find(c => c.type === 'BLOCK_BUSTER'), [weekEvents]);

  const contestantStats: ContestantWithStats[] = useMemo(() => {
    return contestants.map(hg => {
      const pick = picks.find(p => p.contestantId === hg.id);
      const team = teams.find(t => t.id === pick?.teamId);
      
      let totalPoints = 0;
      const hohWins = competitions.filter(c => c.type === 'HOH' && c.winnerId === hg.id).length;
      const vetoWins = competitions.filter(c => c.type === 'VETO' && c.winnerId === hg.id).length;
      const nomCount = competitions.filter(c => c.type === 'NOMINATIONS' && c.nominees?.includes(hg.id)).length;
      
      if (scoringRules?.rules.length) {
          totalPoints += hohWins * (scoringRules.rules.find(r => r.code === 'HOH_WIN')?.points || 0);
          totalPoints += vetoWins * (scoringRules.rules.find(r => r.code === 'VETO_WIN')?.points || 0);
          totalPoints += nomCount * (scoringRules.rules.find(r => r.code === 'NOMINATED')?.points || 0);
      }

      return {
        ...hg,
        teamName: team?.name || 'Unassigned',
        totalWins: hohWins + vetoWins,
        totalNoms: nomCount,
        totalPoints: totalPoints,
        evictionWeek: hg.evictedDay ? Math.ceil(hg.evictedDay / 7) : undefined,
      };
    });
  }, [contestants, competitions, teams, scoringRules, picks]);

  const sortedContestants = useMemo(() => {
    return [...contestantStats].sort((a, b) => {
      if (a.status !== 'active' && b.status === 'active') return 1;
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status !== 'active') {
        return (b.evictedDay || 0) - (a.evictedDay || 0); 
      }

      const aIsHoh = a.id === hoh?.winnerId;
      const bIsHoh = b.id === hoh?.winnerId;
      if (aIsHoh) return -1;
      if (bIsHoh) return 1;

      const aIsPov = a.id === pov?.winnerId;
      const bIsPov = b.id === pov?.winnerId;
      if (aIsPov) return -1;
      if (bIsPov) return 1;

      const aIsNom = noms?.nominees?.includes(a.id);
      const bIsNom = noms?.nominees?.includes(b.id);
      if (aIsNom && !bIsNom) return -1;
      if (!aIsNom && bIsNom) return 1;

      return getContestantDisplayName(a, 'full').localeCompare(getContestantDisplayName(b, 'full'));
    });
  }, [contestantStats, hoh, pov, noms]);

  if (!league || !contestants.length) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div>Loading Contestants...</div>
        </div>
    );
  }

  const contestantTerm = league.contestantTerm;

  return (
    <>
      <AppHeader />
      <main className="flex-1 pb-20">
        <div className="flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
            <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
              <UserSquare className="h-5 w-5" />
              {contestantTerm.plural}
            </h1>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedContestant(null)}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedContestants.map(hg => {
                  const isHoh = hg.id === hoh?.winnerId;
                  const isPov = hg.id === pov?.winnerId;
                  const isNom = noms?.nominees?.includes(hg.id);
                  const isBlockBuster = hg.id === blockBuster?.winnerId;
                  
                  return (
                  <DialogTrigger key={hg.id} asChild onClick={() => setSelectedContestant(hg)}>
                    <Card className="flex flex-col cursor-pointer hover:border-primary transition-colors">
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <Image
                          src={hg.photoUrl || "https://placehold.co/100x100.png"}
                          alt={getContestantDisplayName(hg, 'full')}
                          width={64}
                          height={64}
                          className="rounded-full border-2"
                          data-ai-hint="portrait person"
                        />
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {getContestantDisplayName(hg, 'full')}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">{hg.teamName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant={hg.status === 'active' ? 'default' : 'destructive'} 
                            className={cn('h-fit', hg.status === 'active' && 'bg-green-600 text-white')}>
                            {hg.status === 'active' ? 'Active' : 'Evicted'}
                          </Badge>
                          {hg.status === 'evicted' && hg.evictionWeek && (
                              <Badge variant="secondary" className="bg-gray-700 text-white">
                                Week {hg.evictionWeek}
                              </Badge>
                            )}
                            <div className="flex flex-wrap justify-end gap-1 mt-1">
                                {hg.status === 'active' && isHoh && <Badge className="bg-purple-600 text-white hover:bg-purple-700">HOH</Badge>}
                                {hg.status === 'active' && isPov && !isHoh && <Badge className="bg-amber-500 text-white hover:bg-amber-600">Veto</Badge>}
                                {hg.status === 'active' && isBlockBuster && <Badge className="bg-sky-500 text-white hover:bg-sky-600">BB Winner</Badge>}
                                {hg.status === 'active' && isNom && <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">Nominee</Badge>}
                            </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow flex items-center justify-around text-center gap-2 text-sm pt-2">
                          <div className="flex flex-col items-center">
                              <Trophy className="h-5 w-5 text-amber-400" />
                              <span className="font-bold">{hg.totalWins}</span>
                              <span className="text-xs text-muted-foreground">Wins</span>
                          </div>
                          <div className="flex flex-col items-center">
                              <Users className="h-5 w-5 text-red-400" />
                              <span className="font-bold">{hg.totalNoms}</span>
                              <span className="text-xs text-muted-foreground">Noms</span>
                          </div>
                          <div className="flex flex-col items-center">
                              <TrendingUp className="h-5 w-5 text-green-500" />
                              <span className="font-bold">{hg.totalPoints}</span>
                              <span className="text-xs text-muted-foreground">Points</span>
                          </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                )})}
              </div>

              {selectedContestant && (
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{getContestantDisplayName(selectedContestant, 'full')}</DialogTitle>
                    <p className="text-sm text-muted-foreground">Season Stats & History</p>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Detailed information about {getContestantDisplayName(selectedContestant, 'full')}'s game will be displayed here, including a timeline of their wins, nominations, and other significant events.</p>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </div>
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}

export default withAuth(ContestantsPage);
