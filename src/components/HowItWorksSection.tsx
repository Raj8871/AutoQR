
// src/components/HowItWorksSection.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ListChecks, ScanLine, Settings, Download } from 'lucide-react'; // Use relevant icons

const steps = [
  {
    icon: ListChecks,
    title: 'Select Type',
    description: 'Choose the type of QR code you need (URL, vCard, Event, etc.).',
  },
  {
    icon: Settings, // Use Settings icon for customization
    title: 'Enter Data & Customize',
    description: 'Fill in the required information and personalize the look (colors, logo, style).',
  },
  {
    icon: ScanLine, // Use ScanLine icon for previewing
    title: 'Preview Live',
    description: 'Instantly see how your QR code looks as you make changes.',
  },
  {
    icon: Download,
    title: 'Download',
    description: 'Download your high-quality QR code in PNG, SVG, or other formats.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full max-w-5xl scroll-mt-20">
      <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10 md:mb-12">
        How It Works
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {steps.map((step, index) => (
          <Card key={index} className="text-center bg-card/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <div className="bg-primary/10 p-3 rounded-full">
                 <step.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mt-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
