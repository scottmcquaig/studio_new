
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOCK_TEAMS, MOCK_USERS, MOCK_HOUSEGUESTS, MOCK_COMPETITIONS, MOCK_SCORING_RULES } from "@/lib/data";
import { Users, Crown, Shield, UserX, UserCheck, ShieldPlus, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Calculate KPIs for a team
const calculateKpis = (team) => {
    const rules = MOCK_SCORING_RULES.find(rs => rs.id === 'std_bb_rules_v1')?.rules;
    if (!rules) return {};

    const kpis = {
        HOH_WIN: 0,
        VETO_WIN: 0,
        NOMINATED: 0,
        EVICTED: 0, // This is a placeholder; logic would need to be more complex
        SPECIAL_POWER: 0,
    };
    
    let totalPoints = 0;

    MOCK_COMPETITIONS.forEach(comp => {
        if (team.houseguestIds.includes(comp.winnerId)) {
            if (comp.type === 'HOH') {
                const rule = rules.find(r => r.code === 'HOH_WIN');
                if(rule) kpis.HOH_WIN += rule.points;
            } else if (comp.type === 'VETO') {
                const rule = rules.find(r => r.code === 'VETO_WIN');
                if(rule) kpis.VETO_WIN += rule.points;
            } else if (comp.type === 'SPECIAL_EVENT') {
                 const rule = rules.find(r => r.code === comp.specialEventCode);
                 if(rule) kpis.SPECIAL_POWER += rule.points;
            }
        }
        if (comp.type === 'NOMINATIONS' && comp.nominees) {
            const rule = rules.find(r => r.code === 'NOMINATED');
            if(rule){
                const nomCount = comp.nominees.filter(id => team.houseguestIds.includes(id)).length;
                kpis.NOMINATED += nomCount * rule.points;
            }
        }
    });

    totalPoints = Object.values(kpis).reduce((sum, val) => sum + val, 0);

    return { ...kpis, total: team.total_score };
};


export default function TeamsPage() {
    const sortedTeams = [...MOCK_TEAMS].sort((a, b) => b.total_score - a.total_score);

    const getOwner = (userId) => MOCK_USERS.find(u => u.id === userId);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <Users className="h-5 w-5" />
          Teams & Standings
        </h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        
        <Card>
            <CardHeader>
                <CardTitle>Current Standings</CardTitle>
                <CardDescription>Teams are ranked by total points accumulated throughout the season.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {sortedTeams.map((team, index) => (
                    <div key={team.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                         <span className={cn("text-xl font-bold w-6 text-center", 
                            index === 0 && "text-amber-400",
                            index === 1 && "text-slate-400",
                            index === 2 && "text-orange-500"
                        )}>{index + 1}</span>
                        <div>
                            <p className="font-semibold text-sm truncate">{team.name}</p>
                            <p className="text-xs text-muted-foreground">{team.total_score.toLocaleString()} pts</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedTeams.map((team) => {
                const owners = team.ownerUserIds.map(getOwner);
                const kpis = calculateKpis(team);
                const teamHouseguests = MOCK_HOUSEGUESTS.filter(hg => team.houseguestIds.includes(hg.id));

                return (
                    <Card key={team.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{team.name}</CardTitle>
                                    <CardDescription>
                                        Owned by {owners.map(o => o?.displayName).join(' & ')}
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="text-lg font-bold">{kpis.total.toLocaleString()} pts</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                           <div className="mb-4">
                             <h4 className="text-sm font-semibold text-muted-foreground mb-2">Roster</h4>
                             <div className="flex items-center gap-2">
                                {teamHouseguests.map(hg => (
                                    <div key={hg.id} className="flex flex-col items-center">
                                        <Image
                                            src={hg.photoUrl || "https://placehold.co/100x100.png"}
                                            alt={hg.fullName}
                                            width={56}
                                            height={56}
                                            className={cn("rounded-full border-2", hg.status !== 'active' && 'grayscale')}
                                            data-ai-hint="portrait person"
                                        />
                                        <span className="text-xs mt-1 font-medium">{hg.fullName.split(' ')[0]}</span>
                                    </div>
                                ))}
                             </div>
                           </div>

                            <Separator className="my-4"/>
                            
                            <div>
                               <h4 className="text-sm font-semibold text-muted-foreground mb-3">Scoring Breakdown</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5"><Crown className="h-4 w-4 text-primary"/> HOH Wins</span>
                                        <span className="font-mono font-medium">{kpis.HOH_WIN > 0 ? '+':''}{kpis.HOH_WIN}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-accent"/> Veto Wins</span>
                                        <span className="font-mono font-medium">{kpis.VETO_WIN > 0 ? '+':''}{kpis.VETO_WIN}</span>
                                    </div>
                                     <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5"><ShieldPlus className="h-4 w-4 text-green-500"/> Powers</span>
                                        <span className="font-mono font-medium">{kpis.SPECIAL_POWER > 0 ? '+':''}{kpis.SPECIAL_POWER}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5"><UserCheck className="h-4 w-4 text-red-500"/> Noms</span>
                                        <span className="font-mono font-medium">{kpis.NOMINATED}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5"><UserX className="h-4 w-4 text-muted-foreground"/> Evicted</span>
                                        <span className="font-mono font-medium">{kpis.EVICTED}</span>
                                    </div>
                                     <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1.5"><BarChart2 className="h-4 w-4 text-slate-500"/> Other</span>
                                        <span className="font-mono font-medium">+0</span>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                )
            })}
        </div>
      </main>
    </div>
  );
}
