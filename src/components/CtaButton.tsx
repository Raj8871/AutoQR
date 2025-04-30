// src/components/CtaButton.tsx
'use client'; // Mark as client component if using event handlers like onClick

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react'; // Example icon

interface CtaButtonProps {
  url?: string; // URL for navigation
  text: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; // Optional onClick handler
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function CtaButton({ url, text, onClick, className, variant = "default", size = "lg" }: CtaButtonProps) {
  const commonProps = {
    className,
    variant,
    size,
  };

  if (url && !onClick) {
    // If URL is provided and no onClick, use an anchor tag styled as a button
    return (
      <Button {...commonProps} asChild>
        <a href={url}>
          {text}
          <ArrowRight className="ml-2 h-5 w-5" />
        </a>
      </Button>
    );
  }

  // Otherwise, use a button tag, potentially with an onClick handler
  return (
    <Button {...commonProps} onClick={onClick}>
      {text}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  );
}
