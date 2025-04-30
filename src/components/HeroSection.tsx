
// src/components/HeroSection.tsx
'use client'; // Mark as Client Component

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react'; // Changed icon to ArrowRight for navigation
import Link from 'next/link'; // Import Link for navigation

// Client-side scroll function - No longer needed for this button
// const scrollToGenerator = (e: React.MouseEvent<HTMLButtonElement>) => {
//   e.preventDefault();
//   const element = document.getElementById('qr-generator-section');
//   if (element) {
//     element.scrollIntoView({ behavior: 'smooth' });
//   } else {
//     console.warn('Element with ID "qr-generator-section" not found for scrolling.');
//   }
// };

export function HeroSection() {
  return (
    <section className="text-center py-16 md:py-24 space-y-6">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Create Stunning <span className="text-primary">QR Codes</span> Instantly
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
        Generate dynamic and customizable QR codes for URLs, contact info, events, WiFi, and more. Add logos, change colors, and choose styles with a live preview.
      </p>
      {/* Use Link component wrapped in Button for navigation */}
      <Button size="lg" asChild>
        <Link href="/generator">
           Start Generating
           <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    </section>
  );
}
