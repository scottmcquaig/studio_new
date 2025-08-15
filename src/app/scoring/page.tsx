
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Contestant, Competition, Season, League, ScoringRuleSet, Team, Pick, User } from '@/lib/data';
import { ClipboardList, Filter, Crown, Users, Shield, UserX, HelpCircle, ShieldCheck, RotateCcw, UserCheck, ShieldOff, TriangleAlert, Ban, BrickWall, Skull } from "lucide-react";
import { cn, getContestantDisplayName } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { AppHeader } from '@/components/app-header';
import { getFirestore, collection, onSnapshot, query, doc, Unsubscribe, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import withAuth from '@/components/withAuth';
import { PageLayout } from '@/components/page-layout';

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
    const unsubLeagues = onSnapshot(doc(db, "leagues", "bb27"), (docSnap) => {
        if (docSnap.exists()) {
            setActiveLeague({ ...docSnap.data(), id: docSnap.id } as League);
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
  
  const hoh = useMemo(() => weeklyEvents.find((c) => c.type === "HOH"), [weeklyEvents]);
  const hohWinner = useMemo(() => contestants.find((hg) => hg.id === hoh?.winnerId), [contestants, hoh]);

  const noms = useMemo(() => weeklyEvents.find((c) => c.type === "NOMINATIONS"), [weeklyEvents]);
  const nomWinners = useMemo(() => contestants.filter((hg) => noms?.nominees?.includes(hg.id)), [contestants, noms]);
  
  const pov = useMemo(() => weeklyEvents.find((c) => c.type === "VETO"), [weeklyEvents]);
  const povWinner = useMemo(() => contestants.find((hg) => hg.id === pov?.winnerId), [contestants, pov]);
  const savedPlayer = useMemo(() => contestants.find((hg) => hg.id === pov?.usedOnId), [contestants, pov]);
  const renomPlayer = useMemo(() => contestants.find((hg) => hg.id === pov?.replacementNomId), [contestants, pov]);

  const blockBuster = useMemo(() => weeklyEvents.find((c) => c.type === "BLOCK_BUSTER"), [weeklyEvents]);
  const blockBusterWinner = useMemo(() => contestants.find((hg) => hg.id === blockBuster?.winnerId), [contestants, blockBuster]);
  
  const eviction = useMemo(() => weeklyEvents.find((c) => c.type === "EVICTION"), [weeklyEvents]);
  const evictedPlayer = useMemo(() => contestants.find((hg) => hg.id === eviction?.evictedId), [contestants, eviction]);

  type ScoringEvent = {
    week: number;
    contestantId: string;
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
      const processEvent = (contestantId: string, eventCode: string) => {
        const rule = scoringRules.rules.find(r => r.code === eventCode);
        const contestant = contestants.find(hg => hg.id === contestantId);
        const pick = picks.find(p => p.contestantId === contestantId);
        const team = teams.find(t => t.id === pick?.teamId);
        
        if (rule && contestant) {
          events.push({
            week: comp.week,
            contestantId: contestant.id,
            contestantName: getContestantDisplayName(contestant, 'full'),
            teamId: team?.id,
            teamName: team?.name,
            eventLabel: rule.label,
            eventCode: rule.code,
            points: rule.points,
          });
        }
      };

      if (comp.winnerId) {
        let eventCode = '';
        if (comp.type === 'HOH') eventCode = 'HOH_WIN';
        else if (comp.type === 'VETO') eventCode = 'VETO_WIN';
        else if (comp.type === 'BLOCK_BUSTER') eventCode = 'BLOCK_BUSTER_SAFE';
        else if (comp.type === 'SPECIAL_EVENT') eventCode = comp.specialEventCode || '';
        if (eventCode) processEvent(comp.winnerId, eventCode);
      }
      
      if (comp.type === 'NOMINATIONS' && comp.nominees) {
        comp.nominees.forEach(nomId => processEvent(nomId, 'NOMINATED'));
      }
       if (comp.type === 'EVICTION' && comp.evictedId) {
          const juryStartWeek = activeLeague?.settings.juryStartWeek;
          const eventCode = juryStartWeek && comp.week >= juryStartWeek ? 'EVICT_POST' : 'EVICT_PRE';
          processEvent(comp.evictedId, eventCode);
      }
    });
    return events.sort((a,b) => b.week - a.week);
  }, [scoringRules, competitions, contestants, teams, picks, activeLeague]);

  const filteredEvents = useMemo(() => {
    return scoringEvents.filter(event => {
      const weekMatch = selectedWeek === 'all' || event.week === Number(selectedWeek);
      const contestantMatch = selectedContestant === 'all' || event.contestantId === selectedContestant;
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
          
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Week {displayWeek} Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap justify-center gap-4">
              <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(33.33%-1rem)] xl:basis-[calc(20%-1rem)]">
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

              <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(33.33%-1rem)] xl:basis-[calc(20%-1rem)]">
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

              <div className="flex items-center text-center gap-2 p-4 rounded-lg bg-background basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(33.33%-1rem)] xl:basis-[calc(20%-1rem)]">
                <div className="flex flex-col items-center justify-center flex-grow">
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
                <div className="flex flex-col items-start justify-center flex-shrink-0 px-2 space-y-2">
                  {pov?.used === false && (
                      <div className="flex flex-col items-center gap-1">
                        <ShieldOff className="h-8 w-8 text-muted-foreground"/>
                        <span className="text-xs text-muted-foreground text-center">Not Used</span>
                      </div>
                    )}
                    {pov?.used === true && savedPlayer && (
                      <div className="flex flex-col items-start gap-2">
                        <div className="flex items-center gap-2">
                           <Image src={savedPlayer.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(savedPlayer, 'full')} width={24} height={24} className="rounded-full" data-ai-hint="portrait person"/>
                           <div>
                               <p className="text-xs font-semibold flex items-center gap-1"><UserCheck className="h-3 w-3 text-green-500"/> Saved</p>
                               <p className="text-xs text-left">{getContestantDisplayName(savedPlayer, 'short')}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {renomPlayer ? (
                               <Image src={renomPlayer.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(renomPlayer, 'full')} width={24} height={24} className="rounded-full" data-ai-hint="portrait person"/>
                            ) : (
                               <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center"><HelpCircle className="w-3 h-3 text-muted-foreground"/></div>
                            )}
                            <div>
                               <p className="text-xs font-semibold flex items-center gap-1"><RotateCcw className="h-3 w-3 text-orange-500"/> Renom</p>
                               <p className="text-xs text-left">{renomPlayer ? getContestantDisplayName(renomPlayer, 'short') : 'TBD'}</p>
                            </div>
                        </div>
                      </div>
                    )}
                    {pov?.used === undefined && povWinner && (
                      <div className="flex flex-col items-center gap-1">
                        <HelpCircle className="h-8 w-8 text-muted-foreground"/>
                        <span className="text-xs text-muted-foreground text-center">TBD</span>
                      </div>
                    )}
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(33.33%-1rem)] xl:basis-[calc(20%-1rem)]">
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

              <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(33.33%-1rem)] xl:basis-[calc(20%-1rem)]">
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
