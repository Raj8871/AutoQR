
// src/components/FeaturesSection.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { QrCode, Palette, Image as ImageIcon, Link as LinkIcon, Type, Settings, Download } from 'lucide-react';

const features = [
  {
    icon: Type,
    title: 'Multiple QR Types',
    description: 'Generate codes for URLs, text, email, phone, WhatsApp, locations, events, and vCards.',
  },
  {
    icon: Palette,
    title: 'Color Customization',
    description: 'Personalize QR codes with custom foreground and background colors.',
  },
    {
    icon: QrCode, // Using QrCode icon for dot style customization
    title: 'Dot & Corner Styles',
    description: 'Choose from various dot and corner styles like square, rounded, or dots.',
  },
  {
    icon: ImageIcon,
    title: 'Logo Integration',
    description: 'Embed your logo in the center with size, shape, and opacity controls.',
  },
  {
    icon: Settings,
    title: 'Live Preview',
    description: 'See your customizations in real-time before downloading.',
  },
  {
    icon: Download,
    title: 'Multiple Download Formats',
    description: 'Download your final QR code as PNG, JPEG, WEBP, or SVG.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="w-full max-w-5xl scroll-mt-20">
      <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10 md:mb-12">
        Powerful Features
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <feature.icon className="w-8 h-8 text-primary" />
              <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
