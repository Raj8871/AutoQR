'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ListChecks, ScanLine, Settings, Download } from 'lucide-react';

const howToUseSteps = [
  {
    icon: ListChecks,
    title: '1. Select QR Type',
    description: 'Choose the type of QR code you want to generate (URL, Text, etc.).',
  },
  {
    icon: ScanLine,
    title: '2. Enter Information',
    description: 'Fill in the required fields depending on the QR type you selected.',
  },
  {
    icon: Settings,
    title: '3. Customize Your QR Code',
    description: 'Personalize your QR code by adding colors, a logo, and choosing styles.',
  },
  {
    icon: Download,
    title: '4. Download',
    description: 'Download your customized QR code in the desired format (PNG, SVG, etc.).',
  },
];

export function HowToUseSection() {
  return (
    <section id="how-to-use" className="w-full max-w-5xl text-center space-y-8 px-4 sm:px-0">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
        How to Use
      </h2>
      <p className="text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-3xl mx-auto">
        Follow these simple steps to create your QR code:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
        {howToUseSteps.map((step, index) => (
          <Card key={index} className="border-dashed border-primary/30 bg-transparent shadow-none hover:bg-muted/30 transition-colors duration-300 animate-fade-in p-4 sm:p-6" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="items-center text-center pb-3">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <step.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-semibold">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
