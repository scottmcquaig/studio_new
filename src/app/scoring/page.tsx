
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MOCK_COMPETITIONS, MOCK_CONTESTANTS, MOCK_TEAMS, MOCK_SCORING_RULES, MOCK_SEASONS, MOCK_LEAGUES } from "@/lib/data";
import { ClipboardList, Filter, Crown, Users, Shield, UserX, HelpCircle, ShieldCheck, RotateCcw, UserCheck, ShieldOff } from "lucide-react";
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
  const ruleSet = MOCK_SCORING_RULES.find(rs => rs.id === 'std_bb_rules_v1');
  const activeSeason = MOCK_SEASONS[0];
  const league = MOCK_LEAGUES[0];
  const contestantTerm = league.contestantTerm;


  const [selectedWeek, setSelectedWeek] = useState<string>(String(activeSeason.currentWeek));
  const [selectedContestant, setSelectedContestant] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  
  const weekOptions = Array.from({ length: activeSeason.currentWeek }, (_, i) => String(i + 1));
  const displayWeek = selectedWeek === 'all' ? activeSeason.currentWeek : Number(selectedWeek);
  
  const weeklyEvents = MOCK_COMPETITIONS.filter(c => c.week === displayWeek);
  const hoh = weeklyEvents.find((c) => c.type === "HOH");
  const hohWinner = MOCK_CONTESTANTS.find((hg) => hg.id === hoh?.winnerId);
  const noms = weeklyEvents.find((c) => c.type === "NOMINATIONS");
  const nomWinners = MOCK_CONTESTANTS.filter((hg) => noms?.nominees?.includes(hg.id));
  const pov = weeklyEvents.find((c) => c.type === "VETO");
  const povWinner = MOCK_CONTESTANTS.find((hg) => hg.id === pov?.winnerId);
  const savedPlayer = MOCK_CONTESTANTS.find((hg) => hg.id === pov?.usedOnId);
  const renomPlayer = MOCK_CONTESTANTS.find((hg) => hg.id === pov?.replacementNomId);

  const blockBuster = weeklyEvents.find((c) => c.type === "BLOCK_BUSTER");
  const blockBusterWinner = MOCK_CONTESTANTS.find((hg) => hg.id === blockBuster?.winnerId);
  const eviction = weeklyEvents.find((c) => c.type === "EVICTION");
  const evictedPlayer = MOCK_CONTESTANTS.find((hg) => hg.id === eviction?.evictedId);


  // Memoize the creation of the event log to avoid re-computation on every render
  const scoringEvents = useMemo(() => {
    const events: ScoringEvent[] = [];
    if (!ruleSet) return events;

    MOCK_COMPETITIONS.forEach(comp => {
      const team = MOCK_TEAMS.find(t => t.contestantIds.includes(comp.winnerId || ''));
      
      let eventCode = '';
      if (comp.type === 'HOH') eventCode = 'HOH_WIN';
      if (comp.type === 'VETO') eventCode = 'VETO_WIN';
      if (comp.type === 'BLOCK_BUSTER') eventCode = 'BLOCK_BUSTER_SAFE';
      if (comp.type === 'SPECIAL_EVENT') eventCode = comp.specialEventCode || '';
      
      // Handle single-winner events
      if (eventCode && comp.winnerId) {
        const rule = ruleSet.rules.find(r => r.code === eventCode);
        const contestant = MOCK_CONTESTANTS.find(hg => hg.id === comp.winnerId);
        if (rule && contestant) {
          events.push({
            week: comp.week,
            contestantId: contestant.id,
            contestantName: contestant.fullName,
            teamId: team?.id,
            teamName: team?.name,
            eventLabel: rule.label,
            eventCode: rule.code,
            points: rule.points,
          });
        }
      }
      
      // Handle nominations (multiple players)
      if (comp.type === 'NOMINATIONS' && comp.nominees) {
        const rule = ruleSet.rules.find(r => r.code === 'NOMINATED');
        if (rule) {
          comp.nominees.forEach(nomId => {
            const contestant = MOCK_CONTESTANTS.find(hg => hg.id === nomId);
            const nomineeTeam = MOCK_TEAMS.find(t => t.contestantIds.includes(nomId));
            if (contestant) {
              events.push({
                week: comp.week,
                contestantId: contestant.id,
                contestantName: contestant.fullName,
                teamId: nomineeTeam?.id,
                teamName: nomineeTeam?.name,
                eventLabel: rule.label,
                eventCode: rule.code,
                points: rule.points,
              });
            }
          });
        }
      }
    });
    return events.sort((a,b) => b.week - a.week);
  }, [ruleSet]);

  const filteredEvents = useMemo(() => {
    return scoringEvents.filter(event => {
      const weekMatch = selectedWeek === 'all' || event.week === Number(selectedWeek);
      const contestantMatch = selectedContestant === 'all' || event.contestantId === selectedContestant;
      const teamMatch = selectedTeam === 'all' || event.teamId === selectedTeam;
      return weekMatch && contestantMatch && teamMatch;
    });
  }, [scoringEvents, selectedWeek, selectedContestant, selectedTeam]);


  return (
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
              {weekOptions.map(week => <SelectItem key={week} value={week}>Week {week}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">

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
                    src={hohWinner.photoUrl!}
                    alt={hohWinner.fullName}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-purple-600"
                    data-ai-hint="portrait person"
                  />
                  <span className="text-sm">{hohWinner.fullName.split(' ')[0]}</span>
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

            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background col-span-1.5">
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
                        src={nom.photoUrl!}
                        alt={nom.fullName}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-red-400"
                        data-ai-hint="portrait person"
                      />
                      <span className="text-xs">
                        {nom.fullName.split(" ")[0]}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
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

            <div className="flex items-stretch text-center gap-2 p-4 rounded-lg bg-background col-span-1.5">
              <div className="flex flex-col items-center flex-grow w-[65%]">
                <h3 className="font-semibold flex items-center gap-1 text-amber-500">
                  <Shield className="h-4 w-4" /> POV
                </h3>
                {povWinner ? (
                  <>
                    <Image
                      src={povWinner.photoUrl!}
                      alt={povWinner.fullName}
                      width={64}
                      height={64}
                      className="rounded-full border-2 border-amber-500 mt-2"
                      data-ai-hint="portrait person"
                    />
                    <span className="text-sm mt-1">{povWinner.fullName.split(' ')[0]}</span>
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
               <div className="flex flex-col items-center justify-center w-[35%]">
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
                          <span className="text-xs">{savedPlayer.fullName.split(' ')[0]}</span>
                       </div>
                       <div className="flex flex-col items-center mt-1">
                           <span className="text-xs font-semibold flex items-center gap-1"><RotateCcw className="h-3 w-3 text-orange-500"/> Renom</span>
                           <span className="text-xs">{renomPlayer ? renomPlayer.fullName.split(' ')[0] : 'TBD'}</span>
                       </div>
                     </div>
                  )}
                  {pov?.used === undefined && !povWinner && (
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
                    src={blockBusterWinner.photoUrl!}
                    alt={blockBusterWinner.fullName}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-sky-500"
                    data-ai-hint="portrait person"
                  />
                  <span className="text-sm">{blockBusterWinner.fullName.split(' ')[0]}</span>
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
                    src={evictedPlayer.photoUrl!}
                    alt={evictedPlayer.fullName}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-muted-foreground"
                    data-ai-hint="portrait person"
                  />
                  <span className="text-sm">{evictedPlayer.fullName.split(' ')[0]}</span>
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
                    {MOCK_CONTESTANTS.map(hg => <SelectItem key={hg.id} value={hg.id}>{hg.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium">Team</label>
                 <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {MOCK_TEAMS.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
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
            <CardTitle>{ruleSet?.name || 'Scoring Rules'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {ruleSet?.rules.map((rule) => (
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

      </main>
    </div>
  );
}

    
