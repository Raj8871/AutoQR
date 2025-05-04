
// src/components/HeroSection.tsx
'use client'; // Mark as Client Component

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function HeroSection() {
  return (
    <section className="text-center py-12 sm:py-16 md:py-24 space-y-6 px-4 sm:px-0">
      <h1 className={cn(
        "text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight animate-fade-in",
         "[animation-delay:0.1s]"
        )}>
        Create Custom <span className="text-primary">QR Codes</span> Instantly
      </h1>
      <p className={cn(
        "text-base sm:text-lg md:text-xl text-muted-foreground max-w-md sm:max-w-xl md:max-w-3xl mx-auto animate-fade-in",
        "[animation-delay:0.3s]"
        )}>
        Effortlessly generate, customize, and download QR codes for websites, Wi-Fi, contacts, payments, and more. Elevate your brand with personalized designs, logos, and colors—all with a live preview.
      </p>
      <div className={cn(
          "animate-fade-in",
          "[animation-delay:0.5s]"
          )}>
          <Button size="lg" asChild className="w-full sm:w-auto shadow-lg hover:shadow-primary/30 transition-shadow duration-300">
            <Link href="/generator">
               <span className="flex items-center"> {/* Ensure single child for asChild */}
                 Start Generating Now
                 <ArrowRight className="ml-2 h-5 w-5" />
               </span>
            </Link>
          </Button>
      </div>
    </section>
  );
}
