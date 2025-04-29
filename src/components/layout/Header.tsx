'use client'; // Add 'use client' directive for interactivity

import Link from 'next/link';
import { Sparkles } from 'lucide-react'; // Using Sparkles as a placeholder logo icon
import { cn } from '@/lib/utils';
import React from 'react'; // Import React

export function Header() {

   // Define scrollToSection within the client component
   const scrollToSection = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.warn(`Element with ID "${id}" not found for scrolling.`);
    }
  };


  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">LinkSpark</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="#home"
            onClick={scrollToSection('home')} // onClick is now allowed
            className="transition-colors hover:text-foreground/80 text-foreground/60"
            aria-label="Scroll to Home section" // Accessibility improvement
          >
            Home
          </Link>
           {/* Keep About/Contact links but ensure sections exist or hide them */}
          {/* Example of how About/Contact would work if sections existed */}
          {/* <Link
            href="#about"
            onClick={scrollToSection('about')}
            className="transition-colors hover:text-foreground/80 text-foreground/60 hidden md:inline-block" // Hide on small screens if sections aren't prominent
             aria-label="Scroll to About section"
          >
            About
          </Link>
          <Link
            href="#contact"
             onClick={scrollToSection('contact')}
            className="transition-colors hover:text-foreground/80 text-foreground/60 hidden md:inline-block" // Hide on small screens if sections aren't prominent
             aria-label="Scroll to Contact section"
          >
            Contact
          </Link> */}
        </nav>
        {/* Placeholder for potential future elements like user auth */}
        <div className="flex flex-1 items-center justify-end space-x-2">
        </div>
      </div>
    </header>
  );
}
