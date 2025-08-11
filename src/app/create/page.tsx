import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateLeagueForm } from "@/components/create-league-form";
import { Logo } from "@/components/logo";

export default function CreateLeaguePage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
         <Link href="/" className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Home</span>
            </Button>
          </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="w-full max-w-4xl">
            <div className="mx-auto grid flex-1 auto-rows-max gap-4">
                <CreateLeagueForm />
            </div>
        </div>
      </main>
    </div>
  );
}
