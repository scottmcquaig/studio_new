import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_COMPETITIONS, MOCK_HOUSEGUESTS, MOCK_SEASONS } from "@/lib/data";
import { Home, Crown, Shield, Users, UserX, HelpCircle } from "lucide-react";

export default function DashboardPage() {
  const activeSeason = MOCK_SEASONS[0];
  const currentWeekEvents = MOCK_COMPETITIONS.filter(
    (c) => c.week === activeSeason.currentWeek
  );

  const hoh = currentWeekEvents.find((c) => c.type === "HOH");
  const hohWinner = MOCK_HOUSEGUESTS.find((hg) => hg.id === hoh?.winnerId);

  const noms = currentWeekEvents.find((c) => c.type === "NOMINATIONS");
  const nomWinners = MOCK_HOUSEGUESTS.filter(
    (hg) => noms?.nominees?.includes(hg.id)
  );

  const pov = currentWeekEvents.find((c) => c.type === "VETO");
  const povWinner = MOCK_HOUSEGUESTS.find((hg) => hg.id === pov?.winnerId);

  const eviction = currentWeekEvents.find((c) => c.type === "EVICTION");
  const evictedPlayer = MOCK_HOUSEGUESTS.find(
    (hg) => hg.id === eviction?.evictedId
  );

  const placeholderImage = "/question-mark.svg";

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <Home className="h-5 w-5" />
          Dashboard
        </h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Week {activeSeason.currentWeek} Status</span>
              <span className="text-sm font-normal text-muted-foreground">
                {activeSeason.title}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background">
              <h3 className="font-semibold flex items-center gap-1 text-primary">
                <Crown className="h-4 w-4" /> HOH
              </h3>
              {hohWinner ? (
                <>
                  <Image
                    src={hohWinner.photoUrl!}
                    alt={hohWinner.fullName}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-primary"
                    data-ai-hint="portrait person"
                  />
                  <span className="text-sm">{hohWinner.fullName}</span>
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

            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background">
              <h3 className="font-semibold flex items-center gap-1 text-red-400">
                <Users className="h-4 w-4" /> Noms
              </h3>
              <div className="flex items-center justify-center gap-2">
              {nomWinners.length > 0 ? (
                nomWinners.map(nom => (
                  <div key={nom.id} className="flex flex-col items-center gap-1">
                    <Image
                      src={nom.photoUrl!}
                      alt={nom.fullName}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-red-400"
                       data-ai-hint="portrait person"
                    />
                    <span className="text-xs">{nom.fullName.split(' ')[0]}</span>
                  </div>
                ))
              ) : (
                 <>
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50">
                     <HelpCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                </>
              )}
              </div>
               {nomWinners.length === 0 && <span className="text-sm text-muted-foreground">TBD</span>}
            </div>

            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background">
              <h3 className="font-semibold flex items-center gap-1 text-accent">
                <Shield className="h-4 w-4" /> POV
              </h3>
              {povWinner ? (
                <>
                  <Image
                    src={povWinner.photoUrl!}
                    alt={povWinner.fullName}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-accent"
                    data-ai-hint="portrait person"
                  />
                  <span className="text-sm">{povWinner.fullName}</span>
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

            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-background">
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
                  <span className="text-sm">{evictedPlayer.fullName}</span>
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
            <CardTitle>Welcome to Your Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The dashboard content will be built here.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
