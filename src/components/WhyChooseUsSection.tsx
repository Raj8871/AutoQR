
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
    <section id="why-choose-us" className="w-full max-w-5xl text-center space-y-8">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
        Why Choose <span className="text-primary">LinkSpark</span>?
      </h2>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        We provide a powerful, flexible, and user-friendly QR code generation experience.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 text-left">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex flex-col items-center sm:items-start text-center sm:text-left animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="bg-primary/10 p-3 rounded-full mb-4">
               <benefit.icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
