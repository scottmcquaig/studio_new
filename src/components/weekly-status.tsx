
"use client";

import { useMemo, createElement } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Competition, Contestant, Season, SeasonWeeklyStatusDisplay } from '@/lib/data';
import { Crown, HelpCircle, TriangleAlert, Ban, ShieldOff, UserCheck, RotateCcw, BrickWall, Skull } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn, getContestantDisplayName } from '@/lib/utils';

interface WeeklyStatusProps {
    competitions: Competition[];
    contestants: Contestant[];
    activeSeason: Season;
    displayWeek?: number;
}


const EventCard = ({ card, competitions, contestants }: { card: SeasonWeeklyStatusDisplay, competitions: Competition[], contestants: Contestant[] }) => {
    const { ruleCode, title, icon, color, hasFollowUpFields } = card;
    if (!ruleCode) return null;

    const IconComponent = (LucideIcons as any)[icon] || HelpCircle;
    const safeColor = color || 'text-gray-500';
    const borderColor = safeColor.replace('text-', 'border-');

    const event = competitions.find(c => c.type === ruleCode);
    
    // Logic for single-winner events (HOH, Eviction, simple custom events)
    if (!hasFollowUpFields && !ruleCode.toLowerCase().includes('nom')) {
        const isEviction = ruleCode.includes('EVICT');
        const winner = contestants.find(hg => hg.id === (isEviction ? event?.evictedId : event?.winnerId));
        
        return (
            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background flex-1 min-w-[160px]">
                <h3 className={cn("font-semibold flex items-center gap-1", safeColor)}><IconComponent className="h-4 w-4" /> {title}</h3>
                {winner ? (
                    <>
                        <Image src={winner.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(winner, 'full')} width={64} height={64} className={cn("rounded-full border-2", borderColor)} data-ai-hint="portrait person" />
                        <span className="text-sm">{getContestantDisplayName(winner, 'short')}</span>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50"><HelpCircle className="w-8 h-8 text-muted-foreground" /></div>
                        <span className="text-sm text-muted-foreground">TBD</span>
                    </>
                )}
            </div>
        );
    }
    
    // Logic for nomination-style events (multi-pick)
    if (ruleCode.toLowerCase().includes('nom')) {
        const nominees = contestants.filter(hg => event?.nominees?.includes(hg.id));
        return (
             <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background flex-1 min-w-[160px]">
                <h3 className={cn("font-semibold flex items-center gap-1", safeColor)}><IconComponent className="h-4 w-4" /> {title}</h3>
                <div className="flex items-center justify-center gap-2 min-h-[76px]">
                    {nominees.length > 0 ? (
                        nominees.map(nom => (
                            <div key={nom.id} className="flex flex-col items-center gap-1">
                                <Image src={nom.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(nom, 'full')} width={48} height={48} className={cn("rounded-full border-2", borderColor)} data-ai-hint="portrait person" />
                                <span className="text-xs">{getContestantDisplayName(nom, 'short')}</span>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50"><HelpCircle className="w-6 h-6 text-muted-foreground" /></div>
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50"><HelpCircle className="w-6 h-6 text-muted-foreground" /></div>
                        </>
                    )}
                </div>
                {nominees.length === 0 && <span className="text-sm text-muted-foreground -mt-2">TBD</span>}
            </div>
        );
    }
    
    // Logic for complex events with follow-up fields (like Veto)
    if (hasFollowUpFields) {
        const winner = contestants.find(hg => hg.id === event?.winnerId);
        const savedPlayer = contestants.find(hg => hg.id === event?.usedOnId);
        const renomPlayer = contestants.find(hg => hg.id === event?.replacementNomId);

        return (
            <div className="flex items-center justify-center text-center gap-4 p-4 rounded-lg bg-background flex-1 min-w-[240px]">
                <div className="flex flex-col items-center justify-center w-28">
                    <h3 className={cn("font-semibold flex items-center gap-1", safeColor)}><IconComponent className="h-4 w-4" /> {title}</h3>
                    {winner ? (
                        <>
                            <Image src={winner.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(winner, 'full')} width={64} height={64} className={cn("rounded-full border-2 mt-2", borderColor)} data-ai-hint="portrait person" />
                            <span className="text-sm mt-1">{getContestantDisplayName(winner, 'short')}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50 mt-2"><HelpCircle className="w-8 h-8 text-muted-foreground" /></div>
                            <span className="text-sm text-muted-foreground mt-1">TBD</span>
                        </>
                    )}
                </div>
                {winner && <Separator orientation="vertical" className="h-auto" />}
                {winner && (
                    <div className="flex flex-col items-center justify-center flex-shrink-0 space-y-2 w-24">
                        {event?.used === true && (
                            <div className="flex flex-col items-start gap-2">
                                <div className="flex items-center gap-2">
                                    {savedPlayer ? <Image src={savedPlayer.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(savedPlayer, 'full')} width={24} height={24} className="rounded-full border-2 border-green-500" data-ai-hint="portrait person" /> : <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center"><HelpCircle className="w-3 h-3 text-muted-foreground" /></div>}
                                    <div>
                                        <p className="text-xs font-semibold flex items-center gap-1"><UserCheck className="h-3 w-3 text-green-500" /> Saved</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {renomPlayer ? <Image src={renomPlayer.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(renomPlayer, 'full')} width={24} height={24} className="rounded-full border-2 border-red-500" data-ai-hint="portrait person" /> : <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center"><HelpCircle className="w-3 h-3 text-muted-foreground" /></div>}
                                    <div>
                                        <p className="text-xs font-semibold flex items-center gap-1"><RotateCcw className="h-3 w-3 text-orange-500" /> Renom</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {(event?.used === false || event?.used === undefined) && (
                            <div className="flex flex-col items-center justify-center w-full gap-1">
                                {event?.used === false
                                    ? <ShieldOff className="h-8 w-8 text-muted-foreground" />
                                    : <HelpCircle className="h-8 w-8 text-muted-foreground" />
                                }
                                <span className="text-xs text-muted-foreground text-center">
                                    {event?.used === false ? 'Not Used' : 'TBD'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Fallback for any unhandled card types
    return (
        <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background flex-1 min-w-[160px]">
            <h3 className={cn("font-semibold flex items-center gap-1", safeColor)}><IconComponent className="h-4 w-4" /> {title}</h3>
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50"><HelpCircle className="w-8 h-8 text-muted-foreground" /></div>
            <span className="text-sm text-muted-foreground">TBD</span>
        </div>
    );
};


export function WeeklyStatus({ competitions, contestants, activeSeason, displayWeek }: WeeklyStatusProps) {
    const week = displayWeek || activeSeason.currentWeek;

    const displayConfig = useMemo(() => {
        const weekKey = `week${week}`;
        const config = activeSeason.weeklyStatusDisplay?.[weekKey];
        
        if (config && config.length > 0) {
            return [...config].sort((a,b) => a.order - b.order);
        }
        
        // Default config if none is set for the week
        return [
            { ruleCode: 'HOH_WIN', title: 'HOH', icon: 'Crown', order: 1, color: 'text-purple-500' },
            { ruleCode: 'NOMINATED', title: 'Nominations', icon: 'TriangleAlert', order: 2, color: 'text-red-500' },
            { ruleCode: 'VETO_WIN', title: 'Power of Veto', icon: 'Ban', order: 3, color: 'text-amber-500', hasFollowUpFields: true },
            { ruleCode: 'EVICT_PRE', title: 'Evicted', icon: 'Skull', order: 4, color: 'text-gray-500' }
        ] as SeasonWeeklyStatusDisplay[];
    }, [activeSeason, week]);

    return (
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Week {week} Status</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {activeSeason.title}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap justify-center gap-4">
               {displayConfig.map((item, index) => (
                   <EventCard 
                        key={item.ruleCode ? `${item.ruleCode}-${index}`: index}
                        card={item}
                        competitions={competitions}
                        contestants={contestants}
                   />
               ))}
            </CardContent>
        </Card>
    );
}
