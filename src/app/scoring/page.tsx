import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_SCORING_RULES } from "@/lib/data";
import { ClipboardList } from "lucide-react";

export default function ScoringPage() {
  const ruleSet = MOCK_SCORING_RULES.find(rs => rs.id === 'std_bb_rules_v1');

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <h1 className="text-lg font-semibold md:text-xl flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Scoring
        </h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>{ruleSet?.name || 'Scoring Rules'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Description</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ruleSet?.rules.map((rule) => (
                  <TableRow key={rule.code}>
                    <TableCell>{rule.label}</TableCell>
                    <TableCell className="text-right font-mono">{rule.points > 0 ? `+${rule.points}` : rule.points}</TableCell>
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
