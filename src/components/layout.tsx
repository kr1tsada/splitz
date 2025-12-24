import { ThemeToggle } from "@/components/theme-toggle";
import { Scissors } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-lg items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            <span className="font-semibold">Splitz</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 container max-w-screen-lg px-4 py-6 mx-auto">
        {children}
      </main>
    </div>
  );
}
