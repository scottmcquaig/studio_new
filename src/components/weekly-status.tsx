
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


const EventCard = ({ type, title, icon, color, competitions, contestants }: { type: SeasonWeeklyStatusDisplay['type'], title: string, icon: string, color: string, competitions: Competition[], contestants: Contestant[] }) => {
    const IconComponent = (LucideIcons as any)[icon] || HelpCircle;

    if (type === 'HOH') {
        const hoh = competitions.find(c => c.type === 'HOH');
        const hohWinner = contestants.find(hg => hg.id === hoh?.winnerId);
        return (
            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background flex-1 min-w-[160px]">
                <h3 className={cn("font-semibold flex items-center gap-1", color)}><IconComponent className="h-4 w-4" /> {title}</h3>
                {hohWinner ? (
                    <>
                        <Image src={hohWinner.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(hohWinner, 'full')} width={64} height={64} className={cn("rounded-full border-2", color.replace('text-', 'border-'))} data-ai-hint="portrait person" />
                        <span className="text-sm">{getContestantDisplayName(hohWinner, 'short')}</span>
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
    
    if (type === 'NOMINATIONS') {
        const noms = competitions.find(c => c.type === 'NOMINATIONS');
        const nomWinners = contestants.filter(hg => noms?.nominees?.includes(hg.id));
        return (
             <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background flex-1 min-w-[160px]">
                <h3 className={cn("font-semibold flex items-center gap-1", color)}><IconComponent className="h-4 w-4" /> {title}</h3>
                <div className="flex items-center justify-center gap-2 min-h-[76px]">
                    {nomWinners.length > 0 ? (
                        nomWinners.map(nom => (
                            <div key={nom.id} className="flex flex-col items-center gap-1">
                                <Image src={nom.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(nom, 'full')} width={48} height={48} className={cn("rounded-full border-2", color.replace('text-','border-'))} data-ai-hint="portrait person" />
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
                {nomWinners.length === 0 && <span className="text-sm text-muted-foreground -mt-2">TBD</span>}
            </div>
        );
    }
    
    if (type === 'VETO') {
        const pov = competitions.find(c => c.type === 'VETO');
        const povWinner = contestants.find(hg => hg.id === pov?.winnerId);
        const savedPlayer = contestants.find(hg => hg.id === pov?.usedOnId);
        const renomPlayer = contestants.find(hg => hg.id === pov?.replacementNomId);

        return (
            <div className="flex items-center text-center gap-2 p-4 rounded-lg bg-background flex-1 min-w-[240px]">
                <div className="flex flex-col items-center justify-center flex-grow">
                    <h3 className={cn("font-semibold flex items-center gap-1", color)}><IconComponent className="h-4 w-4" /> {title}</h3>
                    {povWinner ? (
                        <>
                            <Image src={povWinner.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(povWinner, 'full')} width={64} height={64} className={cn("rounded-full border-2 mt-2", color.replace('text-', 'border-'))} data-ai-hint="portrait person" />
                            <span className="text-sm mt-1">{getContestantDisplayName(povWinner, 'short')}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50 mt-2"><HelpCircle className="w-8 h-8 text-muted-foreground" /></div>
                            <span className="text-sm text-muted-foreground mt-1">TBD</span>
                        </>
                    )}
                </div>
                <Separator orientation="vertical" className="h-auto" />
                <div className="flex flex-col items-start justify-center flex-shrink-0 px-2 space-y-2">
                    {pov?.used === false && <div className="flex flex-col items-center gap-1"><ShieldOff className="h-8 w-8 text-muted-foreground" /><span className="text-xs text-muted-foreground text-center">Not Used</span></div>}
                    {pov?.used === true && savedPlayer && (
                        <div className="flex flex-col items-start gap-2">
                            <div className="flex items-center gap-2">
                                <Image src={savedPlayer.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(savedPlayer, 'full')} width={24} height={24} className="rounded-full" data-ai-hint="portrait person" />
                                <div>
                                    <p className="text-xs font-semibold flex items-center gap-1"><UserCheck className="h-3 w-3 text-green-500" /> Saved</p>
                                    <p className="text-xs text-left">{getContestantDisplayName(savedPlayer, 'short')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {renomPlayer ? <Image src={renomPlayer.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(renomPlayer, 'full')} width={24} height={24} className="rounded-full" data-ai-hint="portrait person" /> : <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center"><HelpCircle className="w-3 h-3 text-muted-foreground" /></div>}
                                <div>
                                    <p className="text-xs font-semibold flex items-center gap-1"><RotateCcw className="h-3 w-3 text-orange-500" /> Renom</p>
                                    <p className="text-xs text-left">{renomPlayer ? getContestantDisplayName(renomPlayer, 'short') : 'TBD'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {pov?.used === undefined && povWinner && <div className="flex flex-col items-center gap-1"><HelpCircle className="h-8 w-8 text-muted-foreground" /><span className="text-xs text-muted-foreground text-center">TBD</span></div>}
                </div>
            </div>
        );
    }
    
    if (type === 'EVICTION') {
        const eviction = competitions.find(c => c.type === 'EVICTION');
        const evictedPlayer = contestants.find(hg => hg.id === eviction?.evictedId);
        return (
            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background flex-1 min-w-[160px]">
                <h3 className={cn("font-semibold flex items-center gap-1", color)}><IconComponent className="h-4 w-4" /> {title}</h3>
                {evictedPlayer ? (
                    <>
                        <Image src={evictedPlayer.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(evictedPlayer, 'full')} width={64} height={64} className={cn("rounded-full border-2", color.replace('text-', 'border-'))} data-ai-hint="portrait person" />
                        <span className="text-sm">{getContestantDisplayName(evictedPlayer, 'short')}</span>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50"><HelpCircle className="w-8 h-8 text-muted-foreground" /></div>
                        <span className="text-sm text-muted-foreground">TBD</span>
                    </>
                )}
            </div>
        )
    }

    // Default card for Block Buster and other custom types
    const event = competitions.find(c => c.type === type);
    const winner = contestants.find(hg => hg.id === event?.winnerId);
    return (
        <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background flex-1 min-w-[160px]">
            <h3 className={cn("font-semibold flex items-center gap-1", color)}><IconComponent className="h-4 w-4" /> {title}</h3>
            {winner ? (
                <>
                    <Image src={winner.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(winner, 'full')} width={64} height={64} className={cn("rounded-full border-2", color.replace('text-', 'border-'))} data-ai-hint="portrait person" />
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
            { type: 'HOH', title: 'HOH', icon: 'Crown', order: 1, color: 'text-purple-500' },
            { type: 'NOMINATIONS', title: 'Nominations', icon: 'TriangleAlert', order: 2, color: 'text-red-500' },
            { type: 'VETO', title: 'Power of Veto', icon: 'Ban', order: 3, color: 'text-amber-500' },
            { type: 'EVICTION', title: 'Evicted', icon: 'Skull', order: 4, color: 'text-gray-500' }
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
               {displayConfig.map(item => (
                   <EventCard 
                        key={item.order}
                        type={item.type}
                        title={item.title}
                        icon={item.icon}
                        color={item.color}
                        competitions={competitions}
                        contestants={contestants}
                   />
               ))}
            </CardContent>
        </Card>
    );
}
