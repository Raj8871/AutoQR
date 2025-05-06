
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { LifeBuoy, X } from 'lucide-react';
import { HelpForm } from '@/components/HelpForm';
import { cn } from '@/lib/utils';

export function FloatingHelpButton() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default" // Use default (primary) variant
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50",
            "animate-fade-in [animation-delay:0.5s]" // Add subtle animation
          )}
          aria-label="Open Help Assistant"
        >
          <LifeBuoy className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[90vw] max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
             <LifeBuoy className="h-5 w-5 text-primary" />
             <SheetTitle>Help Assistant</SheetTitle>
          </div>
          <SheetClose asChild>
             <Button variant="ghost" size="icon" className="h-7 w-7">
               <X className="h-4 w-4" />
               <span className="sr-only">Close Help Assistant</span>
             </Button>
          </SheetClose>
        </SheetHeader>
         <SheetDescription className="sr-only">Ask questions about LinkSpark and get AI-powered answers.</SheetDescription> {/* Hidden descriptive label */}

        {/* Embed the HelpForm inside the Sheet */}
        <div className="flex-grow overflow-y-auto p-4">
          <HelpForm />
        </div>
      </SheetContent>
    </Sheet>
  );
}
