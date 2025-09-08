'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Quote, Target, ShieldCheck } from 'lucide-react';

export default function DailyPracticeCard() {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-start gap-3">
            <Quote className="h-5 w-5 text-[#3498DB] flex-shrink-0" />
            <h3 className="font-headline text-lg font-semibold text-primary">Your Daily Practice</h3>
        </div>
        
        <blockquote className="border-l-4 border-[#3498DB] pl-4 py-2 bg-[#EAF4FB] rounded-r-lg">
          <p className="italic text-primary/90">Every new beginning comes from some other beginning's end.</p>
          <footer className="text-sm text-right mt-2 text-muted-foreground pr-4">&mdash; Seneca</footer>
        </blockquote>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
            <div className="p-2 bg-background rounded-full">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-primary">Morning Intention</h4>
              <p className="text-sm text-muted-foreground mt-1">Start each day with purpose. Set your stoic intention.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
            <div className="p-2 bg-background rounded-full">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-primary">Evening Reflection</h4>
              <p className="text-sm text-muted-foreground mt-1">End with wisdom. Reflect on your growth and control.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
