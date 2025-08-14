
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Contestant, Competition, Season, League, ScoringRuleSet, Team, Pick, User } from '@/lib/data';
import { ClipboardList, Filter, Crown, Users, Shield, UserX, HelpCircle, ShieldCheck, RotateCcw, UserCheck, ShieldOff } from "lucide-react";
import { cn, getContestantDisplayName } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { AppHeader } from '@/components/app-header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { getFirestore, collection, onSnapshot, query, doc, Unsubscribe } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { MOCK_SEASONS } from "@/lib/data";


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

export default function ScoringPage() {
  const db = getFirestore(app);

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRuleSet | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  
  const activeSeason = useMemo(() => MOCK_SEASONS[0], []);
  const contestantTerm = league?.contestantTerm || { singular: 'Contestant', plural: 'Contestants' };

  const [selectedWeek, setSelectedWeek] = useState<string>(String(activeSeason.currentWeek));
  const [selectedContestant, setSelectedContestant] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  
  const weekOptions = useMemo(() => Array.from({ length: activeSeason.currentWeek }, (_, i) => String(i + 1)).reverse(), [activeSeason.currentWeek]);
  const displayWeek = selectedWeek === 'all' ? activeSeason.currentWeek : Number(selectedWeek);
  
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
          const juryStartWeek = league?.settings.juryStartWeek;
          const eventCode = juryStartWeek && comp.week >= juryStartWeek ? 'EVICT_POST' : 'EVICT_PRE';
          processEvent(comp.evictedId, eventCode);
      }
    });
    return events.sort((a,b) => b.week - a.week);
  }, [scoringRules, competitions, contestants, teams, picks, league]);

  const filteredEvents = useMemo(() => {
    return scoringEvents.filter(event => {
      const weekMatch = selectedWeek === 'all' || event.week === Number(selectedWeek);
      const contestantMatch = selectedContestant === 'all' || event.contestantId === selectedContestant;
      const teamMatch = selectedTeam === 'all' || event.teamId === selectedTeam;
      return weekMatch && contestantMatch && teamMatch;
    });
  }, [scoringEvents, selectedWeek, selectedContestant, selectedTeam]);

  if (!league || !contestants.length) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div>Loading Scoring...</div>
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
              <ClipboardList className="h-5 w-5" />
              Scoring
            </h1>
            <div className="w-40">
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Weeks</SelectItem>
                  {weekOptions.map(week => <SelectItem key={week} value={week}>Week {week}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">

            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Week {displayWeek} Status</span>
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
                    <Users className="h-4 w-4" /> Noms
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
                      <Shield className="h-4 w-4" /> POV
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
                          <ShieldOff className="h-8 w-8 text-muted-foreground"/>
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
                    <ShieldCheck className="h-4 w-4" /> Block Buster
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
                    <UserX className="h-4 w-4" /> Evicted
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
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm font-medium">Filter Week</label>
                    <Select value={selectedWeek} onValueChange={val => setSelectedWeek(val)}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Weeks</SelectItem>
                        {weekOptions.map(week => <SelectItem key={week} value={week}>Week {week}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm font-medium">{contestantTerm.plural}</label>
                    <Select value={selectedContestant} onValueChange={setSelectedContestant}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All {contestantTerm.plural}</SelectItem>
                        {contestants.map(hg => <SelectItem key={hg.id} value={hg.id}>{getContestantDisplayName(hg, 'full')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
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
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}

    