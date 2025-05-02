
// src/components/HeroSection.tsx
'use client'; // Mark as Client Component

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react'; // Changed icon to ArrowRight for navigation
import Link from 'next/link'; // Import Link for navigation
import { cn } from '@/lib/utils'; // Import cn for conditional classes


export function HeroSection() {
  return (
    <section className="text-center py-12 sm:py-16 md:py-24 space-y-6 px-4 sm:px-0"> {/* Added responsive padding */}
      <h1 className={cn(
        "text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight animate-fade-in", // Responsive text size
         "[animation-delay:0.1s]" // Slight delay for title
        )}>
        Create Stunning <span className="text-primary">QR Codes</span> Instantly
      </h1>
      <p className={cn(
        "text-base sm:text-lg md:text-xl text-muted-foreground max-w-md sm:max-w-xl md:max-w-2xl mx-auto animate-fade-in", // Responsive text size and max-width
        "[animation-delay:0.3s]" // Slightly more delay for paragraph
        )}>
        Generate dynamic and customizable QR codes for URLs, contact info, events, WiFi, UPI payments, and more. Add logos, change colors, and choose styles with a live preview.
      </p>
      {/* Use Link component wrapped in Button for navigation */}
      <div className={cn(
          "animate-fade-in",
          "[animation-delay:0.5s]" // Even more delay for button
          )}>
          {/* Ensure the Link component is the single child when using asChild */}
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/generator">
               {/* Wrap content in a single element to satisfy React.Children.only from Slot */}
               <span>
                 Start Generating
                 <ArrowRight className="ml-2 h-5 w-5" />
               </span>
            </Link>
          </Button>
      </div>
    </section>
  );
}

