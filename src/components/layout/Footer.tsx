'use client'; // Mark as client component

import Link from 'next/link';
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    // Set the year only on the client side after hydration
    setCurrentYear(new Date().getFullYear());
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <footer className={cn(
        "mt-auto border-t border-border/40 bg-background/95 py-6 animate-fade-in",
        "backdrop-blur supports-[backdrop-filter]:bg-background/60" // Subtle blur matching header
        )}>
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <Instagram className="h-5 w-5 text-foreground/60 hover:text-foreground/80 transition-colors" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Instagram</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                    <Twitter className="h-5 w-5 text-foreground/60 hover:text-foreground/80 transition-colors" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Twitter</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <Facebook className="h-5 w-5 text-foreground/60 hover:text-foreground/80 transition-colors" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Facebook</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/contact" aria-label="Contact Us">
                    <Mail className="h-5 w-5 text-foreground/60 hover:text-foreground/80 transition-colors" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Contact Us</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-center text-sm text-foreground/60">
          {/* Display year only after it's set on the client */}
          {currentYear !== null && (
              <p>© {currentYear} LinkSpark. All Rights Reserved.</p>
          )}
          <div className="mt-1 flex justify-center gap-4">
            <Link href="/privacy" className="hover:text-foreground/80 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground/80 transition-colors">
              Terms of Service
            </Link>
             <Link href="/contact" className="hover:text-foreground/80 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// These placeholder components likely don't need changes as they are separate
// and not directly related to the footer's hydration issue.
export function PrivacyPage() {
  return <div className="container py-10"><h1>Privacy Policy</h1><p>Details about privacy...</p></div>;
}

export function TermsPage() {
  return <div className="container py-10"><h1>Terms of Service</h1><p>Details about terms...</p></div>;
}
