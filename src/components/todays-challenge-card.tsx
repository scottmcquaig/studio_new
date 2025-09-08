
'use client';

import type { Challenge } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface TodaysChallengeCardProps {
  day: number;
  challenge: Challenge;
}

export default function TodaysChallengeCard({ day, challenge }: TodaysChallengeCardProps) {
  const week = Math.ceil(day / 7);

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="default">Week {week}</Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3"/>
              Day {day} of 30
            </Badge>
             {challenge.track && <Badge style={{ backgroundColor: '#EF4444', color: 'white' }} className="border-none">{challenge.track} Track</Badge>}
          </div>
          <h2 className="text-xl font-bold font-headline text-primary mt-3">Begin Today's Challenge</h2>
          <p className="text-muted-foreground text-sm mt-1">Set your intention and begin today's stoic practice.</p>
        </div>
        <Button asChild className="w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
          <Link href={`/day/${day}`}>
            Continue Journey
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
