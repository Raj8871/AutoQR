'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CtaButtonProps {
  url: string;
  text?: string;
  className?: string;
}

export function CtaButton({
  url,
  text = 'Click Here to Visit',
  className,
}: CtaButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Optional: Add analytics tracking here if needed
    console.log(`Redirecting to: ${url}`);
  };

  return (
    <Button
      asChild // Use asChild to render an anchor tag styled as a button
      className={cn(
        'group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-lg bg-primary px-8 py-3 text-lg font-semibold text-primary-foreground shadow-lg',
        'transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
        className
      )}
      size="lg" // Ensure large size
    >
      <a
        href={url}
        target="_blank" // Open in new tab
        rel="noopener noreferrer" // Security best practice
        onClick={handleClick}
        className="z-10 flex items-center gap-2" // Ensure text is above potential pseudo-elements
      >
        {text}
        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
      </a>
    </Button>
  );
}
