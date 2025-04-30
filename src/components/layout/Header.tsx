'use client'; // Add 'use client' directive for interactivity

import Link from 'next/link';
import { Sparkles, QrCode } from 'lucide-react'; // Using Sparkles as a placeholder logo icon, added QrCode
import { cn } from '@/lib/utils';
import React from 'react'; // Import React

export function Header() {

   // Define scrollToSection within the client component - Keep for potential future use or remove if no scroll links remain
   const scrollToSection = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.warn(`Element with ID "${id}" not found for scrolling.`);
        // If on a different page, navigate first, then try scrolling (more complex)
        // For now, we assume links are for the current page.
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
        <nav className="flex items-center gap-4 md:gap-6 text-sm">
          {/* Removed Home link as logo links to home */}
          {/*
          <Link
            href="#home"
            onClick={scrollToSection('home')} // onClick is now allowed
            className="transition-colors hover:text-foreground/80 text-foreground/60"
            aria-label="Scroll to Top section" // Accessibility improvement
          >
            Home
          </Link>
          */}
           <Link
            href="/generator" // Changed to navigate to /generator page
            // onClick={scrollToSection('qr-generator-section')} // Removed onClick scroll handler
            className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1"
             aria-label="Go to QR Generator page" // Updated aria-label
          >
            <QrCode className="h-4 w-4 hidden sm:inline-block" /> {/* Show icon on larger screens */}
            Generator
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
