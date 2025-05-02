
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ListChecks, ScanLine, Settings, Download } from 'lucide-react';

const steps = [
  {
    icon: ListChecks,
    title: '1. Select Type',
    description: 'Choose the type of content you want your QR code to link to (URL, Text, Wi-Fi, etc.).',
  },
  {
    icon: ScanLine, // Using ScanLine as a metaphor for input/content
    title: '2. Enter Content',
    description: 'Fill in the required information based on the selected QR type, like the website URL or contact details.',
  },
  {
    icon: Settings,
    title: '3. Customize',
    description: 'Personalize the look! Change colors, add your logo, and select different dot or corner styles.',
  },
  {
    icon: Download,
    title: '4. Preview & Download',
    description: 'See a live preview of your QR code. When ready, download it in your preferred format (PNG, SVG, etc.).',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full max-w-5xl text-center space-y-8 px-4 sm:px-0"> {/* Responsive padding */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"> {/* Responsive heading size */}
        How It <span className="text-primary">Works</span>
      </h2>
      <p className="text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-3xl mx-auto"> {/* Responsive text and max-width */}
        Creating your custom QR code is simple and takes just a few seconds.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4"> {/* Adjusted gap */}
        {steps.map((step, index) => (
          <Card key={index} className="border-dashed border-primary/30 bg-transparent shadow-none hover:bg-muted/30 transition-colors duration-300 animate-fade-in p-4 sm:p-6" style={{ animationDelay: `${index * 0.1}s` }}> {/* Responsive padding */}
             <CardHeader className="items-center text-center pb-3"> {/* Adjusted padding */}
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                   <step.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" /> {/* Responsive icon size */}
                </div>
              <CardTitle className="text-lg sm:text-xl font-semibold">{step.title}</CardTitle> {/* Responsive title size */}
            </CardHeader>
            <CardContent className="text-center pt-0"> {/* Adjusted padding */}
              <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p> {/* Responsive description size */}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

