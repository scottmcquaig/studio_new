
"use client";

import { useMemo, createElement } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Competition, Contestant, Season, SeasonWeeklyStatusDisplay } from '@/lib/data';
import { HelpCircle, ShieldOff } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn, getContestantDisplayName } from '@/lib/utils';

interface WeeklyStatusProps {
    competitions: Competition[];
    contestants: Contestant[];
    activeSeason: Season;
    displayWeek?: number;
}

const FollowUpEvent = ({ card, competitions, contestants }: { card: SeasonWeeklyStatusDisplay, competitions: Competition[], contestants: Contestant[] }) => {
    if (!card.ruleCode) return null;

    const IconComponent = (LucideIcons as any)[card.icon] || HelpCircle;
    const safeColor = card.color || 'text-gray-500';
    const action = card.action || 'setWinner';
    const event = competitions.find(c => c.type === card.ruleCode);

    let player: Contestant | undefined;
    switch(action) {
        case 'setEvictee':
            player = contestants.find(c => c.id === event?.evictedId);
            break;
        case 'setSavedByVeto':
            player = contestants.find(c => c.id === event?.usedOnId);
            break;
        case 'setReplacementNom':
            player = contestants.find(c => c.id === event?.replacementNomId);
            break;
        case 'setWinner':
        default:
             player = contestants.find(c => c.id === event?.winnerId);
             break;
    }
    
    return (
        <div className="flex items-start gap-2">
             {player ? <Image src={player.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(player, 'full')} width={24} height={24} className={cn("rounded-full border-2", safeColor.replace('text-','border-'))} data-ai-hint="portrait person" /> : <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center"><HelpCircle className="w-3 h-3 text-muted-foreground" /></div>}
            <div>
                 <p className="text-xs font-semibold flex items-center gap-1"><IconComponent className={cn("h-3 w-3", safeColor)} /> {card.title}</p>
                 <p className="text-xs text-muted-foreground">{player ? getContestantDisplayName(player, 'short') : 'TBD'}</p>
            </div>
        </div>
    );
};


const EventCard = ({ card, competitions, contestants }: { card: SeasonWeeklyStatusDisplay, competitions: Competition[], contestants: Contestant[] }) => {
    const { ruleCode, title, icon, color, action = 'setWinner', hasFollowUp, followUp } = card;
    if (!ruleCode) return null;

    const IconComponent = (LucideIcons as any)[icon] || HelpCircle;
    const safeColor = color || 'text-gray-500';
    const borderColor = safeColor.replace('text-', 'border-');

    const event = competitions.find(c => c.type === ruleCode);
    
    // Renders multi-pick events like nominations
    if (action === 'setNominees') {
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
    
    let mainPlayer: Contestant | undefined;
    switch(action) {
        case 'setEvictee':
            mainPlayer = contestants.find(c => c.id === event?.evictedId);
            break;
        case 'setWinner':
        default:
             mainPlayer = contestants.find(c => c.id === event?.winnerId);
             break;
    }

    // Renders complex events with follow-ups
    if (hasFollowUp && followUp) {
        return (
            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background flex-1 min-w-[240px]">
                <h3 className={cn("font-semibold flex items-center gap-1", safeColor)}><IconComponent className="h-4 w-4" /> {title}</h3>
                <div className="flex items-center justify-center gap-4 w-full mt-2">
                    <div className="flex flex-col items-center justify-center w-28">
                        {mainPlayer ? (
                            <>
                                <Image src={mainPlayer.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(mainPlayer, 'full')} width={64} height={64} className={cn("rounded-full border-2", borderColor)} data-ai-hint="portrait person" />
                                <span className="text-sm mt-1">{getContestantDisplayName(mainPlayer, 'short')}</span>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50"><HelpCircle className="w-8 h-8 text-muted-foreground" /></div>
                                <span className="text-sm text-muted-foreground mt-1">{event?.outcome || 'TBD'}</span>
                            </>
                        )}
                    </div>
                    {(mainPlayer || event?.outcome) && <Separator orientation="vertical" className="h-auto self-stretch" />}
                    {(mainPlayer || event?.outcome) && (
                        <div className="flex flex-col items-start justify-center flex-shrink-0 space-y-2 w-24">
                           <FollowUpEvent card={followUp} competitions={competitions} contestants={contestants} />
                           {followUp.followUp && <FollowUpEvent card={followUp.followUp} competitions={competitions} contestants={contestants} />}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Renders simple, single-player events
    return (
        <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background flex-1 min-w-[160px]">
            <h3 className={cn("font-semibold flex items-center gap-1", safeColor)}><IconComponent className="h-4 w-4" /> {title}</h3>
            {mainPlayer ? (
                <>
                    <Image src={mainPlayer.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(mainPlayer, 'full')} width={64} height={64} className={cn("rounded-full border-2", borderColor)} data-ai-hint="portrait person" />
                    <span className="text-sm">{getContestantDisplayName(mainPlayer, 'short')}</span>
                </>
            ) : (
                <>
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50"><HelpCircle className="w-8 h-8 text-muted-foreground" /></div>
                    <span className="text-sm text-muted-foreground">{event?.outcome || 'TBD'}</span>
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
            { ruleCode: 'HOH_WIN', title: 'HOH', icon: 'Crown', order: 1, color: 'text-purple-500', action: 'setWinner' },
            { ruleCode: 'NOMINATED', title: 'Nominations', icon: 'TriangleAlert', order: 2, color: 'text-red-500', action: 'setNominees' },
            { ruleCode: 'VETO_WIN', title: 'Power of Veto', icon: 'Ban', order: 3, color: 'text-amber-500', hasFollowUp: true, action: 'setWinner' },
            { ruleCode: 'EVICT_PRE', title: 'Evicted', icon: 'Skull', order: 4, color: 'text-gray-500', action: 'setEvictee' }
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
                        key={item._id || item.ruleCode ? `${item.ruleCode}-${index}`: index}
                        card={item}
                        competitions={competitions}
                        contestants={contestants}
                   />
               ))}
            </CardContent>
        </Card>
    );
}
