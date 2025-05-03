'use client'; // Add 'use client' directive for interactivity

import Link from 'next/link';
import { Sparkles, QrCode, Menu, X } from 'lucide-react'; // Added Menu, X icons
import { cn } from '@/lib/utils';
import React, { useState } from 'react'; // Import React and useState
import { Button } from '@/components/ui/button'; // Import Button
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet'; // Import Sheet components

export function Header() {
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

   // Close mobile menu handler
   const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between"> {/* Use justify-between */}
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">LinkSpark</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 md:gap-6 text-sm">
           <Link
            href="/generator"
            className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1"
             aria-label="Go to QR Generator page"
          >
            <QrCode className="h-4 w-4" />
            Generator
          </Link>
           {/* Keep About/Contact links but ensure sections exist or hide them */}
           {/* Add other desktop nav links here if needed */}
        </nav>

        {/* Mobile Navigation Trigger (Hamburger Menu) */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left"> {/* Or 'right' */}
              <div className="flex flex-col h-full p-4">
                 {/* Close Button inside Sheet */}
                <div className="flex justify-between items-center mb-6">
                     <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                        <Sparkles className="h-6 w-6 text-primary" />
                        <span className="font-bold">LinkSpark</span>
                    </Link>
                    <SheetClose asChild>
                        <Button variant="ghost" size="icon">
                            <X className="h-6 w-6" />
                            <span className="sr-only">Close menu</span>
                        </Button>
                    </SheetClose>
                </div>

                {/* Mobile Menu Links */}
                <nav className="flex flex-col gap-4 text-lg">
                   <SheetClose asChild>
                       <Link
                        href="/generator"
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted"
                        aria-label="Go to QR Generator page"
                        >
                        <QrCode className="h-5 w-5" />
                        Generator
                       </Link>
                   </SheetClose>
                   {/* Add other mobile nav links here */}
                   {/* Example:
                   <SheetClose asChild>
                        <Link href="/about" className="p-2 rounded hover:bg-muted">About</Link>
                   </SheetClose>
                   <SheetClose asChild>
                        <Link href="/contact" className="p-2 rounded hover:bg-muted">Contact</Link>
                   </SheetClose>
                   */}
                </nav>
                {/* Optional: Add social links or other elements to the bottom */}
                 <div className="mt-auto text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} LinkSpark
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

         {/* Placeholder for potential future elements like user auth (ensure it doesn't interfere with mobile nav trigger) */}
         <div className="hidden md:flex flex-1 items-center justify-end space-x-2">
             {/* User auth button etc. */}
         </div>
      </div>
    </header>
  );
}
