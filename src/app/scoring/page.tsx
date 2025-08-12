
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_SCORING_RULES } from "@/lib/data";
import { ClipboardList, TrendingDown, TrendingUp } from "lucide-react";

export default function ScoringPage() {
  const rules = MOCK_SCORING_RULES[0].rules;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Scoring Rules
        </h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Big Brother Standard Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.code}>
                    <TableCell className="font-medium">{rule.label}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                         {rule.points > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={rule.points > 0 ? 'text-green-500' : 'text-red-500'}>
                            {rule.points > 0 ? `+${rule.points}` : rule.points}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
