
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Home, Users, UserSquare, ClipboardList, Settings, Database, Share2, Link as LinkIcon, KeyRound } from "lucide-react";
import withAuth from "@/components/withAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function DataModelPage() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Admin</span>
                    </Link>
                </Button>
                <h1 className="flex-1 text-lg font-semibold text-center">App Wireframe & Data Model</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Share2 /> Static App Wireframe</CardTitle>
                        <CardDescription>A simplified view of the main application pages and their core components.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 bg-gray-100 rounded-lg">
                        <div className="border-2 border-gray-400 rounded-lg p-2 bg-white">
                            <div className="flex justify-between items-center p-2 border-b">
                                <span className="font-bold text-sm">App Header</span>
                                <div className="flex gap-2">
                                    <Settings className="h-4 w-4" />
                                    <Users className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                <Card>
                                    <CardHeader className="p-2">
                                        <CardTitle className="text-base">Dashboard Page</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-2 text-xs">
                                        <p>- Weekly Status Component</p>
                                        <p>- Current Standings Table</p>
                                        <p>- Top Movers Card</p>
                                        <p>- Weekly Activity Log</p>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="p-2">
                                        <CardTitle className="text-base">Teams Page</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-2 text-xs">
                                        <p>- Team Card (Roster, Scoring Breakdown)</p>
                                        <p>- Contestant Profile Pop-up</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="flex justify-around p-2 border-t mt-4 text-xs">
                                <div className="flex flex-col items-center"><Home className="h-4 w-4"/><span>Dashboard</span></div>
                                <div className="flex flex-col items-center"><Users className="h-4 w-4"/><span>Teams</span></div>
                                <div className="flex flex-col items-center"><UserSquare className="h-4 w-4"/><span>Players</span></div>
                                <div className="flex flex-col items-center"><ClipboardList className="h-4 w-4"/><span>Scoring</span></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Database /> Firestore Data Tree</CardTitle>
                        <CardDescription>How the main data collections in Firestore are structured and linked.</CardDescription>
                    </CardHeader>
                    <CardContent className="font-mono text-xs space-y-2">
                        <div className="p-2 rounded bg-muted">
                            <p className="font-bold">/seasons/{'{seasonId}'}</p>
                            <p className="pl-4">Contains info about a specific season (e.g., BB26).</p>
                        </div>
                         <div className="p-2 rounded bg-muted">
                            <p className="font-bold">/contestants/{'{contestantId}'}</p>
                            <p className="pl-4">Details for each player in a season.</p>
                            <p className="pl-4 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> links to <span className="font-semibold">/seasons</span> via `seasonId`</p>
                        </div>
                         <div className="p-2 rounded bg-muted">
                            <p className="font-bold">/scoring_rules/{'{ruleSetId}'}</p>
                            <p className="pl-4">Defines the point values for all game events.</p>
                        </div>
                         <div className="p-2 rounded bg-muted">
                            <p className="font-bold">/leagues/{'{leagueId}'}</p>
                            <p className="pl-4">Core league settings and configuration.</p>
                            <p className="pl-4 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> links to <span className="font-semibold">/seasons</span> via `seasonId`</p>
                            <p className="pl-4 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> links to <span className="font-semibold">/scoring_rules</span> via `settings.scoringRuleSetId`</p>
                        </div>
                         <div className="p-2 rounded bg-muted">
                            <p className="font-bold">/teams/{'{teamId}'}</p>
                            <p className="pl-4">Represents a user's team within a league.</p>
                             <p className="pl-4 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> links to <span className="font-semibold">/leagues</span> via `leagueId`</p>
                             <p className="pl-4 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> links to <span className="font-semibold">/users</span> via `ownerUserIds` array</p>
                        </div>
                         <div className="p-2 rounded bg-muted">
                            <p className="font-bold">/picks/{'{pickId}'}</p>
                            <p className="pl-4">A draft pick, connecting a player to a team.</p>
                             <p className="pl-4 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> links to <span className="font-semibold">/teams</span> via `teamId`</p>
                             <p className="pl-4 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> links to <span className="font-semibold">/contestants</span> via `contestantId`</p>
                        </div>
                        <div className="p-2 rounded bg-muted">
                            <p className="font-bold">/competitions/{'{competitionId}'}</p>
                            <p className="pl-4">Log of every scoring event that occurs in a season.</p>
                            <p className="pl-4 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> links to <span className="font-semibold">/seasons</span> via `seasonId`</p>
                            <p className="pl-4 flex items-center gap-1"><LinkIcon className="h-3 w-3"/> references <span className="font-semibold">/contestants</span> via `winnerId`, `evictedId`, etc.</p>
                        </div>
                         <div className="p-2 rounded bg-muted">
                            <p className="font-bold">/users/{'{userId}'}</p>
                            <p className="pl-4">Stores user profile data and app role.</p>
                            <p className="pl-4 flex items-center gap-1"><KeyRound className="h-3 w-3"/> ID matches Firebase Auth UID.</p>
                        </div>

                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default withAuth(DataModelPage, ['site_admin']);
