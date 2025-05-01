
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Zap, Paintbrush, Settings, Lock } from 'lucide-react';

const benefits = [
  {
    icon: Zap,
    title: 'Fast & Easy',
    description: 'Generate QR codes instantly with our intuitive interface. No sign-up required.',
  },
  {
    icon: Paintbrush,
    title: 'Highly Customizable',
    description: 'Extensive styling options including colors, shapes, logos, and more to match your brand.',
  },
  {
    icon: Settings, // Represents advanced options/control
    title: 'Advanced Control',
    description: 'Fine-tune logo size, opacity, shape, and dot styles for the perfect look.',
  },
  {
    icon: Lock, // Represents privacy/local storage
    title: 'Privacy Focused',
    description: 'Your data and QR history are stored locally in your browser, not on our servers.',
  },
];

export function WhyChooseUsSection() {
  return (
    <section id="why-choose-us" className="w-full max-w-5xl text-center space-y-8 px-4 sm:px-0"> {/* Responsive padding */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"> {/* Responsive heading size */}
        Why Choose <span className="text-primary">LinkSpark</span>?
      </h2>
      <p className="text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-3xl mx-auto"> {/* Responsive text and max-width */}
        We provide a powerful, flexible, and user-friendly QR code generation experience.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pt-4 text-left"> {/* Adjusted gap */}
        {benefits.map((benefit, index) => (
          <div key={index} className="flex flex-col items-center text-center sm:items-start sm:text-left animate-fade-in p-2 sm:p-0" style={{ animationDelay: `${index * 0.1}s` }}> {/* Responsive padding */}
            <div className="bg-primary/10 p-3 rounded-full mb-3 sm:mb-4"> {/* Adjusted margin */}
               <benefit.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" /> {/* Responsive icon size */}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">{benefit.title}</h3> {/* Responsive title size and margin */}
            <p className="text-xs sm:text-sm text-muted-foreground">{benefit.description}</p> {/* Responsive description size */}
          </div>
        ))}
      </div>
    </section>
  );
}
