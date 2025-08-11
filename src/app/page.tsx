import Link from "next/link";
import { ArrowRight, Trophy, Users, Edit3, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const features = [
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: "Multiple Game Modes",
      description: "Supports Big Brother, Survivor, and custom game modes to fit your style.",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Team Management",
      description: "Easily create teams, add owners, and manage rosters before the draft.",
    },
    {
      icon: <Edit3 className="h-8 w-8 text-primary" />,
      title: "Customizable Rules",
      description: "Use default scoring for BB/Survivor or create your own with the inline editor.",
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      title: "Live Scoring",
      description: "Enter weekly events and watch the standings update in real-time.",
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "AI-Powered Fun",
      description: "Generate fun, engaging league descriptions with the power of AI.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-headline text-lg font-bold">YAC Fantasy</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild>
              <Link href="/create">
                Create a League
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container grid place-items-center gap-8 px-4 py-16 text-center md:py-24">
          <div className="flex flex-col items-center gap-4">
            <Logo className="h-24 w-24" />
            <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-6xl lg:text-7xl">
              The Last Fantasy League You'll Ever Need.
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Tired of boring fantasy platforms? YAC offers a fresh, modern experience for your Big Brother and Survivor fantasy leagues. Customizable, engaging, and built for true fans.
            </p>
          </div>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/create">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="features" className="container py-16 md:py-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Everything You Need, Nothing You Don't
            </h2>
            <p className="text-muted-foreground md:text-xl">
              YAC is packed with features designed to make your fantasy league more fun and competitive.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    {feature.icon}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <h3 className="font-headline text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-secondary">
          <div className="container py-16 text-center md:py-24">
             <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Start Your League?
                </h2>
                <p className="text-muted-foreground md:text-xl">
                  Create your league in minutes and invite your friends. It's time to prove who's the ultimate super-fan.
                </p>
                <Button size="lg" asChild className="mt-4">
                  <Link href="/create">
                    Create Your League Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
          </div>
        </section>

      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} YAC Fantasy League. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
