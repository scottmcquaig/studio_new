
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, CheckCircle2, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';

interface ProgressCardProps {
  streak: number;
  daysCompleted: number;
  daysRemaining: number;
  progress: number;
  track?: string;
}

export default function ProgressCard({ streak, daysCompleted, daysRemaining, progress, track }: ProgressCardProps) {
  return (
    <Card className="bg-secondary/30 border-none shadow-sm">
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className="flex flex-col items-center">
            <Flame className="h-8 w-8 text-destructive mb-2" />
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold">{daysCompleted}/30</p>
            <p className="text-xs text-muted-foreground">Days Completed</p>
          </div>
          <div className="flex flex-col items-center">
            <Calendar className="h-8 w-8 text-accent mb-2" />
            <p className="text-2xl font-bold">{daysRemaining}</p>
            <p className="text-xs text-muted-foreground">Days Remaining</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="font-medium text-muted-foreground">Overall Progress</span>
            <div className="flex items-center gap-2">
              {track && <Badge style={{ backgroundColor: '#EF4444', color: 'white' }} className="border-none">{track} Track</Badge>}
              <Badge variant="outline" className="font-normal">
                <span className="font-bold text-foreground">{daysCompleted}</span>
                <span className="text-muted-foreground">/30 days complete</span>
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
