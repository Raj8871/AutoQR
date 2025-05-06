import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { FloatingHelpButton } from '@/components/FloatingHelpButton'; // Import the new component

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LinkSpark - Your Link Destination',
  description: 'Click the button to visit the linked destination.',
  keywords: ['link', 'url', 'redirect', 'cta', 'button', 'qr code', 'generator'], // Added keywords
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Apply 'dark' class to html for default dark mode
    <html lang="en" className="dark">
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased`,
          'flex min-h-screen flex-col' // Ensure footer stays at bottom
        )}
      >
        {children}
        <Toaster /> {/* Add Toaster for potential notifications */}
        <FloatingHelpButton /> {/* Add the floating help button here */}
      </body>
    </html>
  );
}
