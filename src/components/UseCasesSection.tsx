
import { Card, CardContent } from '@/components/ui/card';
import { Share2, Wifi, Contact, Briefcase, Utensils, Calendar } from 'lucide-react'; // Replaced VCard with Contact
import Image from 'next/image';

const useCases = [
  {
    icon: Share2,
    title: 'Share Links Instantly',
    description: 'Direct users to your website, social media profiles, or promotional landing pages with a simple scan.',
    image: 'https://picsum.photos/400/300?random=1',
    alt: 'Person sharing a link via QR code',
    aiHint: 'website link sharing'
  },
  {
    icon: Wifi,
    title: 'Easy Wi-Fi Access',
    description: 'Let guests connect to your Wi-Fi network without typing complex passwords. Ideal for cafes, homes, and offices.',
    image: 'https://picsum.photos/400/300?random=2',
    alt: 'Smartphone scanning Wi-Fi QR code',
    aiHint: 'wifi connection'
  },
  {
    icon: Contact, // Replaced VCard with Contact
    title: 'Digital Business Cards',
    description: 'Share your contact details seamlessly. Generate a vCard QR code for easy saving to contacts.',
    image: 'https://picsum.photos/400/300?random=3',
    alt: 'Digital business card QR code',
    aiHint: 'business card contact'
  },
   {
    icon: Utensils,
    title: 'Restaurant Menus',
    description: 'Provide contactless access to your menu. Link directly to your online menu page.',
    image: 'https://picsum.photos/400/300?random=4',
    alt: 'Restaurant menu QR code on table',
    aiHint: 'restaurant menu'
  },
   {
    icon: Calendar,
    title: 'Event Invitations',
    description: 'Link to event details, RSVP forms, or add events directly to calendars with an ICS file QR code.',
    image: 'https://picsum.photos/400/300?random=5',
    alt: 'Event invitation QR code',
    aiHint: 'event calendar'
  },
    {
    icon: Briefcase,
    title: 'Product Information',
    description: 'Link physical products to online manuals, setup guides, reviews, or purchase pages.',
    image: 'https://picsum.photos/400/300?random=6',
    alt: 'Product packaging with QR code',
    aiHint: 'product information'
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="w-full max-w-6xl text-center space-y-8 px-4 sm:px-0">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
        Unlock Potential with <span className="text-primary">Versatile QR Codes</span>
      </h2>
      <p className="text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-3xl mx-auto">
        QR codes are more than just links. Discover how LinkSpark can power your interactions.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
        {useCases.map((useCase, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-fade-in group rounded-lg" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="relative h-48 w-full">
              <Image
                src={useCase.image}
                alt={useCase.alt}
                fill // Use fill for responsive images within fixed container
                style={{ objectFit: 'cover' }} // Ensure image covers the area
                className="transition-transform duration-500 group-hover:scale-105"
                data-ai-hint={useCase.aiHint}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Add responsive sizes
              />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div> {/* Gradient overlay */}
            </div>
            <CardContent className="p-4 sm:p-6 text-left space-y-2 relative z-10 bg-card"> {/* Ensure content is above overlay */}
               <div className="flex items-center gap-2 mb-2">
                 <useCase.icon className="h-5 w-5 text-primary shrink-0" />
                 <h3 className="text-lg font-semibold">{useCase.title}</h3>
               </div>
              <p className="text-sm text-muted-foreground">{useCase.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
