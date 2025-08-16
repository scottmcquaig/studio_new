
"use client";

import { useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Competition, Contestant, Season } from '@/lib/data';
import { Crown, HelpCircle, TriangleAlert, Ban, ShieldOff, UserCheck, RotateCcw, BrickWall, Skull } from "lucide-react";
import { getContestantDisplayName } from '@/lib/utils';

interface WeeklyStatusProps {
    competitions: Competition[];
    contestants: Contestant[];
    activeSeason: Season;
    displayWeek?: number;
}

export function WeeklyStatus({ competitions, contestants, activeSeason, displayWeek }: WeeklyStatusProps) {
    const hoh = useMemo(() => competitions.find((c) => c.type === "HOH"), [competitions]);
    const hohWinner = useMemo(() => contestants.find((hg) => hg.id === hoh?.winnerId), [contestants, hoh]);

    const noms = useMemo(() => competitions.find((c) => c.type === "NOMINATIONS"), [competitions]);
    const nomWinners = useMemo(() => contestants.filter((hg) => noms?.nominees?.includes(hg.id)), [contestants, noms]);

    const pov = useMemo(() => competitions.find((c) => c.type === "VETO"), [competitions]);
    const povWinner = useMemo(() => contestants.find((hg) => hg.id === pov?.winnerId), [contestants, pov]);
    const savedPlayer = useMemo(() => contestants.find((hg) => hg.id === pov?.usedOnId), [contestants, pov]);
    const renomPlayer = useMemo(() => contestants.find((hg) => hg.id === pov?.replacementNomId), [contestants, pov]);

    const blockBuster = useMemo(() => competitions.find((c) => c.type === "BLOCK_BUSTER"), [competitions]);
    const blockBusterWinner = useMemo(() => contestants.find((hg) => hg.id === blockBuster?.winnerId), [contestants, blockBuster]);

    const eviction = useMemo(() => competitions.find((c) => c.type === "EVICTION"), [competitions]);
    const evictedPlayer = useMemo(() => contestants.find((hg) => hg.id === eviction?.evictedId), [contestants, eviction]);

    return (
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Week {displayWeek || activeSeason.currentWeek} Status</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {activeSeason.title}
                    </span>
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
                    <Separator orientation="vertical" className="h-auto" />
                    <div className="flex flex-col items-start justify-center flex-shrink-0 px-2 space-y-2">
                        {pov?.used === false && (
                            <div className="flex flex-col items-center gap-1">
                                <ShieldOff className="h-8 w-8 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground text-center">Not Used</span>
                            </div>
                        )}
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
                                    {renomPlayer ? (
                                        <Image src={renomPlayer.photoUrl || "https://placehold.co/100x100.png"} alt={getContestantDisplayName(renomPlayer, 'full')} width={24} height={24} className="rounded-full" data-ai-hint="portrait person" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center"><HelpCircle className="w-3 h-3 text-muted-foreground" /></div>
                                    )}
                                    <div>
                                        <p className="text-xs font-semibold flex items-center gap-1"><RotateCcw className="h-3 w-3 text-orange-500" /> Renom</p>
                                        <p className="text-xs text-left">{renomPlayer ? getContestantDisplayName(renomPlayer, 'short') : 'TBD'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {pov?.used === undefined && povWinner && (
                            <div className="flex flex-col items-center gap-1">
                                <HelpCircle className="h-8 w-8 text-muted-foreground" />
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
    );
}
