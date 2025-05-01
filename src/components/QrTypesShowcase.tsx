
// src/components/QrTypesShowcase.tsx

import { Card, CardContent } from '@/components/ui/card';
import { LinkIcon, Phone, Mail, MessageSquare, MapPin, Calendar, User, Wifi, CreditCard } from 'lucide-react';

const qrTypes = [
  { icon: LinkIcon, label: 'Website URL' },
  { icon: Phone, label: 'Phone Number' },
  { icon: Mail, label: 'Email Address' },
  { icon: MessageSquare, label: 'Plain Text' },
  { icon: MapPin, label: 'Location' },
  { icon: Calendar, label: 'Event' },
  { icon: User, label: 'Contact (vCard)' },
  { icon: Wifi, label: 'Wi-Fi Network' },
  { icon: CreditCard, label: 'UPI Payment' },
  // Add more types if needed
];

export function QrTypesShowcase() {
  return (
    <section id="qr-types" className="w-full max-w-5xl text-center space-y-8 px-4 sm:px-0"> {/* Responsive padding */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"> {/* Responsive heading size */}
        Generate QR Codes for <span className="text-primary">Everything</span>
      </h2>
      <p className="text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-3xl mx-auto"> {/* Responsive text and max-width */}
        From simple links to complex contact cards and secure Wi-Fi access.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 pt-4"> {/* Responsive grid columns and gap */}
        {qrTypes.map((type, index) => (
          <Card key={index} className="bg-muted/30 hover:bg-muted/60 transition-colors duration-200 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 space-y-2"> {/* Responsive padding */}
              <type.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-1" /> {/* Responsive icon size */}
              <p className="text-xs sm:text-sm font-medium text-center">{type.label}</p> {/* Responsive text size */}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
