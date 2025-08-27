
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Contestant, Competition, Season, League, ScoringRuleSet, Team, Pick, User } from '@/lib/data';
import { ClipboardList, Filter } from "lucide-react";
import { cn, getContestantDisplayName } from '@/lib/utils';
import { AppHeader } from '@/components/app-header';
import { getFirestore, collection, onSnapshot, query, doc, Unsubscribe, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import withAuth from '@/components/withAuth';
import { PageLayout } from '@/components/page-layout';
import { WeeklyStatus } from '@/components/weekly-status';

function ScoringPage() {
  const db = getFirestore(app);

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRuleSet | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedContestant, setSelectedContestant] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  
  useEffect(() => {
    // This logic should be enhanced with a league switcher
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
  
  const weekOptions = useMemo(() => {
    if (!activeSeason) return [];
    return Array.from({ length: activeSeason.currentWeek }, (_, i) => String(i + 1)).reverse();
  }, [activeSeason]);
  
  const displayWeek = useMemo(() => {
      if (!activeSeason) return 1;
      return selectedWeek === 'all' ? activeSeason.currentWeek : Number(selectedWeek);
  }, [selectedWeek, activeSeason]);
  
  useEffect(() => {
    if (activeSeason && selectedWeek === 'all') {
        setSelectedWeek(String(activeSeason.currentWeek));
    }
  }, [activeSeason, selectedWeek]);
  
  useEffect(() => {
        if (!activeLeague || !activeSeason) return;

        const unsubscribes: Unsubscribe[] = [];
        
        if (activeLeague.settings.scoringRuleSetId) {
            unsubscribes.push(onSnapshot(doc(db, "scoring_rules", activeLeague.settings.scoringRuleSetId), (ruleSnap) => {
                if (ruleSnap.exists()) setScoringRules({ ...ruleSnap.data(), id: ruleSnap.id } as ScoringRuleSet);
            }));
        }

        const qContestants = query(collection(db, "contestants"), where("seasonId", "==", activeSeason.id));
        unsubscribes.push(onSnapshot(qContestants, (snap) => setContestants(snap.docs.map(d => ({...d.data(), id: d.id } as Contestant)))));
        
        const qCompetitions = query(collection(db, "competitions"), where("seasonId", "==", activeSeason.id));
        unsubscribes.push(onSnapshot(qCompetitions, (snap) => setCompetitions(snap.docs.map(d => ({...d.data(), id: d.id } as Competition)))));
        
        const qTeams = query(collection(db, "teams"), where("leagueId", "==", activeLeague.id));
        unsubscribes.push(onSnapshot(qTeams, (snap) => setTeams(snap.docs.map(d => ({...d.data(), id: d.id } as Team)))));
        
        const qPicks = query(collection(db, "picks"), where("leagueId", "==", activeLeague.id));
        unsubscribes.push(onSnapshot(qPicks, (snap) => setPicks(snap.docs.map(d => ({...d.data(), id: d.id } as Pick)))));

        return () => unsubscribes.forEach(unsub => unsub());
  }, [db, activeLeague, activeSeason]);


  const weeklyEvents = useMemo(() => competitions.filter(c => c.week === displayWeek), [competitions, displayWeek]);
  
  type ScoringEvent = {
    week: number;
    contestantIds: string[];
    contestantName: string;
    teamId?: string;
    teamName?: string;
    eventLabel: string;
    eventCode: string;
    points: number;
  };

  const scoringEvents = useMemo(() => {
    const events: ScoringEvent[] = [];
    if (!scoringRules?.rules) return events;

    competitions.forEach(comp => {
      const mainRule = scoringRules.rules.find(r => r.code === comp.type);
      
      if (mainRule) {
          if (comp.nominees && comp.nominees.length > 0) {
              const nominees = comp.nominees.map(id => contestants.find(c => c.id === id)).filter(Boolean) as Contestant[];
              if (nominees.length > 0) {
                  const firstPick = picks.find(p => p.contestantId === nominees[0].id);
                  const team = teams.find(t => t.id === firstPick?.teamId);
                  events.push({
                      week: comp.week,
                      contestantIds: nominees.map(n => n.id),
                      contestantName: nominees.map(n => getContestantDisplayName(n, 'short')).join(', '),
                      teamId: team?.id,
                      teamName: team?.name,
                      eventLabel: mainRule.label,
                      eventCode: mainRule.code,
                      points: mainRule.points,
                  });
              }
          } else {
              const playerId = comp.winnerId || comp.evictedId;
              if (playerId) {
                  const contestant = contestants.find(hg => hg.id === playerId);
                  const pick = picks.find(p => p.contestantId === playerId);
                  const team = teams.find(t => t.id === pick?.teamId);
                  if (contestant) {
                      events.push({
                          week: comp.week,
                          contestantIds: [contestant.id],
                          contestantName: getContestantDisplayName(contestant, 'full'),
                          teamId: team?.id,
                          teamName: team?.name,
                          eventLabel: mainRule.label,
                          eventCode: mainRule.code,
                          points: mainRule.points,
                      });
                  }
              }
          }
      }

      if (comp.usedOnId) {
          const vetoUsedRule = scoringRules.rules.find(r => r.code === 'VETO_USED');
          if(vetoUsedRule) {
            const contestant = contestants.find(hg => hg.id === comp.usedOnId);
            const pick = picks.find(p => p.contestantId === comp.usedOnId);
            const team = teams.find(t => t.id === pick?.teamId);
            if (contestant) {
                events.push({
                    week: comp.week,
                    contestantIds: [contestant.id],
                    contestantName: getContestantDisplayName(contestant, 'full'),
                    teamId: team?.id,
                    teamName: team?.name,
                    eventLabel: vetoUsedRule.label,
                    eventCode: 'VETO_USED',
                    points: vetoUsedRule.points,
                });
            }
          }
      }

      if (comp.replacementNomId) {
          const finalNomRule = scoringRules.rules.find(r => r.code === 'FINAL_NOM');
          if(finalNomRule) {
            const contestant = contestants.find(hg => hg.id === comp.replacementNomId);
            const pick = picks.find(p => p.contestantId === comp.replacementNomId);
            const team = teams.find(t => t.id === pick?.teamId);
            if (contestant) {
                events.push({
                    week: comp.week,
                    contestantIds: [contestant.id],
                    contestantName: getContestantDisplayName(contestant, 'full'),
                    teamId: team?.id,
                    teamName: team?.name,
                    eventLabel: finalNomRule.label,
                    eventCode: 'FINAL_NOM',
                    points: finalNomRule.points,
                });
            }
          }
      }
    });
    
    return events.sort((a,b) => b.week - a.week);
  }, [scoringRules, competitions, contestants, teams, picks]);

  const filteredEvents = useMemo(() => {
    return scoringEvents.filter(event => {
      const weekMatch = selectedWeek === 'all' || event.week === Number(selectedWeek);
      const contestantMatch = selectedContestant === 'all' || event.contestantIds.includes(selectedContestant);
      const teamMatch = selectedTeam === 'all' || event.teamId === selectedTeam;
      const eventMatch = selectedEvent === 'all' || event.eventCode === selectedEvent;
      return weekMatch && contestantMatch && teamMatch && eventMatch;
    });
  }, [scoringEvents, selectedWeek, selectedContestant, selectedTeam, selectedEvent]);
  
  const eventCodeOptions = useMemo(() => {
    if (!scoringRules?.rules) return [];
    return scoringRules.rules.map(rule => ({
        value: rule.code,
        label: rule.label
    }));
  }, [scoringRules]);

  if (!activeLeague || !contestants.length || !activeSeason) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div>Loading Scoring...</div>
        </div>
    );
  }
  
  const contestantTerm = activeLeague.contestantTerm;

  return (
    <PageLayout>
      <AppHeader pageTitle="Scoring" pageIcon={ClipboardList} />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
          <div className="absolute top-16 right-4">
              <div className="w-40">
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Weeks</SelectItem>
                          {weekOptions.map(week => <SelectItem key={week} value={week}>Week {week}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
          </div>
          
            <WeeklyStatus 
                competitions={weeklyEvents} 
                contestants={contestants} 
                activeSeason={activeSeason}
                displayWeek={displayWeek} 
            />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter/>Scoring Event Log</CardTitle>
              <CardDescription>A log of all point-scoring events from the season. Use the filters to narrow your search.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex-1 min-w-[120px]">
                  <label className="text-sm font-medium">Filter Week</label>
                  <Select value={selectedWeek} onValueChange={val => setSelectedWeek(val)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Weeks</SelectItem>
                      {weekOptions.map(week => <SelectItem key={week} value={week}>Week {week}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="flex-1 min-w-[120px]">
                  <label className="text-sm font-medium">Event</label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {eventCodeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="text-sm font-medium">{contestantTerm.plural}</label>
                  <Select value={selectedContestant} onValueChange={setSelectedContestant}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {contestantTerm.plural}</SelectItem>
                      {contestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="text-sm font-medium">Team</label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>{contestantTerm.singular}</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.length > 0 ? filteredEvents.map((event, index) => (
                    <TableRow key={index}>
                      <TableCell>{event.week}</TableCell>
                      <TableCell>{event.contestantName}</TableCell>
                      <TableCell>{event.teamName || 'N/A'}</TableCell>
                      <TableCell>{event.eventLabel}</TableCell>
                      <TableCell className={cn(
                          "text-right font-mono font-bold",
                          event.points >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                          {event.points > 0 ? `+${event.points}` : event.points}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No matching events found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{scoringRules?.name || 'Scoring Rules'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {scoringRules?.rules.map((rule) => (
                    <div key={rule.code} className="flex justify-between items-center text-sm border-b py-2">
                      <span>{rule.label}</span>
                      <span className={cn(
                          "font-mono font-bold",
                          rule.points >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                          {rule.points > 0 ? `+${rule.points}` : rule.points}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </PageLayout>
  );
}

export default withAuth(ScoringPage);

    
