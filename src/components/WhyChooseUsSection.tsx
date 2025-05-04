
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Zap, Paintbrush, Settings, ShieldCheck, DownloadCloud } from 'lucide-react'; // Replaced Lock with ShieldCheck, added DownloadCloud

const benefits = [
  {
    icon: Zap,
    title: 'Instant Generation',
    description: 'Create QR codes in seconds with our user-friendly interface. No account needed to start.',
  },
  {
    icon: Paintbrush,
    title: 'Deep Customization',
    description: 'Brand your codes with custom colors, shapes, logos, gradients, and unique dot styles.',
  },
  {
    icon: DownloadCloud, // Changed from Settings to DownloadCloud
    title: 'High-Quality Exports',
    description: 'Download crisp, high-resolution QR codes in PNG and SVG formats, perfect for digital and print.',
  },
  {
    icon: ShieldCheck, // Changed from Lock to ShieldCheck for privacy
    title: 'Privacy First',
    description: 'Your generated QR data and history stay local to your browser. We don\'t store your information.',
  },
];

export function WhyChooseUsSection() {
  return (
    <section id="why-choose-us" className="w-full max-w-5xl text-center space-y-8 px-4 sm:px-0">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
        Why Choose <span className="text-primary">LinkSpark</span>?
      </h2>
      <p className="text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-3xl mx-auto">
        Experience a powerful, flexible, and privacy-focused QR code generation platform.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pt-4 text-left">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex flex-col items-center text-center sm:items-start sm:text-left animate-fade-in p-2 sm:p-0" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="bg-primary/10 p-3 rounded-full mb-3 sm:mb-4">
               <benefit.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">{benefit.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
