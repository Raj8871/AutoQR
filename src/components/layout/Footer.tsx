import Link from 'next/link';
import { Instagram, Twitter, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn(
        "mt-auto border-t border-border/40 bg-background/95 py-6",
        "backdrop-blur supports-[backdrop-filter]:bg-background/60" // Subtle blur matching header
        )}>
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex gap-4">
          <Button variant="ghost" size="icon" asChild>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="h-5 w-5 text-foreground/60 hover:text-foreground/80 transition-colors" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter className="h-5 w-5 text-foreground/60 hover:text-foreground/80 transition-colors" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook className="h-5 w-5 text-foreground/60 hover:text-foreground/80 transition-colors" />
            </a>
          </Button>
        </div>
        <div className="text-center text-sm text-foreground/60">
          <p>© {currentYear} LinkSpark. All Rights Reserved.</p>
          <div className="mt-1 flex justify-center gap-4">
            <Link href="/privacy" className="hover:text-foreground/80 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground/80 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Placeholder pages for Privacy and Terms
// You would create actual pages at src/app/privacy/page.tsx and src/app/terms/page.tsx
export function PrivacyPage() {
  return <div className="container py-10"><h1>Privacy Policy</h1><p>Details about privacy...</p></div>;
}

export function TermsPage() {
  return <div className="container py-10"><h1>Terms of Service</h1><p>Details about terms...</p></div>;
}
