
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MOCK_CONTESTANTS, MOCK_COMPETITIONS, MOCK_TEAMS, MOCK_SEASONS, MOCK_SCORING_RULES, MOCK_LEAGUES } from "@/lib/data";
import type { Contestant } from '@/lib/data';
import { UserSquare, Crown, Shield, Users, BarChart2, TrendingUp, TrendingDown, Star, Trophy } from "lucide-react";
import { cn } from '@/lib/utils';

type ContestantWithStats = Contestant & {
  teamName: string;
  totalWins: number;
  totalNoms: number;
  totalPoints: number;
};

export default function ContestantsPage() {
  const [selectedContestant, setSelectedContestant] = useState<ContestantWithStats | null>(null);
  const activeSeason = MOCK_SEASONS[0];
  const league = MOCK_LEAGUES[0];
  const contestantTerm = league.contestantTerm;

  const contestantStats = MOCK_CONTESTANTS.map(hg => {
    const team = MOCK_TEAMS.find(t => t.contestantIds.includes(hg.id));
    
    // Aggregate points from all teams' weekly breakdowns
    let totalPoints = 0;
    MOCK_TEAMS.forEach(team => {
        const weeklyData = team.weekly_score_breakdown.week4;
        const playerData = weeklyData.find(d => d.contestantId === hg.id);
        if (playerData) {
            totalPoints += playerData.points;
        }
    });
    
    // Add points from other events not directly in weekly breakdown for a more complete picture
    const hohWins = MOCK_COMPETITIONS.filter(c => c.type === 'HOH' && c.winnerId === hg.id).length;
    const vetoWins = MOCK_COMPETITIONS.filter(c => c.type === 'VETO' && c.winnerId === hg.id).length;
    const nomCount = MOCK_COMPETITIONS.filter(c => c.type === 'NOMINATIONS' && c.nominees?.includes(hg.id)).length;
    
    const scoringRules = MOCK_SCORING_RULES.find(rs => rs.id === 'std_bb_rules_v1')?.rules;
    if (scoringRules) {
        totalPoints += hohWins * (scoringRules.find(r => r.code === 'HOH_WIN')?.points || 0);
        totalPoints += vetoWins * (scoringRules.find(r => r.code === 'VETO_WIN')?.points || 0);
        totalPoints += nomCount * (scoringRules.find(r => r.code === 'NOMINATED')?.points || 0);
    }

    return {
      ...hg,
      teamName: team?.name || 'Unassigned',
      totalWins: hohWins + vetoWins,
      totalNoms: nomCount,
      totalPoints: totalPoints
    };
  });

  const hoh = MOCK_COMPETITIONS.find(c => c.week === activeSeason.currentWeek && c.type === 'HOH');
  const pov = MOCK_COMPETITIONS.find(c => c.week === activeSeason.currentWeek && c.type === 'VETO');
  const noms = MOCK_COMPETITIONS.find(c => c.week === activeSeason.currentWeek && c.type === 'NOMINATIONS');

  const sortedContestants = [...contestantStats].sort((a, b) => {
    // Evicted players to the bottom
    if (a.status !== 'active' && b.status === 'active') return 1;
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status !== 'active') {
      return (b.evictedDay || 0) - (a.evictedDay || 0); // most recent evicted first
    }

    // Active players sorting logic
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

    // Alphabetical for the rest
    return a.fullName.localeCompare(b.fullName);
  });


  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <UserSquare className="h-5 w-5" />
          {contestantTerm.plural}
        </h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedContestant(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedContestants.map(hg => (
              <DialogTrigger key={hg.id} asChild onClick={() => setSelectedContestant(hg)}>
                <Card className="flex flex-col cursor-pointer hover:border-primary transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Image
                      src={hg.photoUrl || "https://placehold.co/100x100.png"}
                      alt={hg.fullName}
                      width={64}
                      height={64}
                      className="rounded-full border-2"
                      data-ai-hint="portrait person"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-xl">{hg.fullName}</CardTitle>
                      <p className="text-xs text-muted-foreground">{hg.teamName}</p>
                    </div>
                    <Badge 
                      variant={hg.status === 'active' ? 'default' : 'destructive'} 
                      className={cn(hg.status === 'active' && 'bg-green-600 text-white')}>
                      {hg.status === 'active' ? 'Active' : 'Evicted'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-center justify-around text-center gap-2 text-sm">
                      <div className="flex flex-col items-center">
                          <Trophy className="h-5 w-5 text-accent" />
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
            ))}
          </div>

          {selectedContestant && (
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{selectedContestant.fullName}</DialogTitle>
                 <p className="text-sm text-muted-foreground">Season Stats & History</p>
              </DialogHeader>
              <div className="py-4">
                <p>Detailed information about {selectedContestant.fullName}'s game will be displayed here, including a timeline of their wins, nominations, and other significant events.</p>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </main>
    </div>
  );
}
