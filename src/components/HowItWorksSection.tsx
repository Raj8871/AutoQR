
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ListChecks, Edit, ScanSearch, Download } from 'lucide-react'; // Replaced icons

const steps = [
  {
    icon: ListChecks,
    title: '1. Select Type',
    description: 'Choose what your QR code will do: link to a website, share Wi-Fi, provide contact info, etc.',
  },
  {
    icon: Edit, // Changed from ScanLine to Edit for content input
    title: '2. Enter Content',
    description: 'Fill in the necessary details, like the URL, phone number, or Wi-Fi credentials.',
  },
  {
    icon: ScanSearch, // Changed from Settings to ScanSearch (implies customization and preview)
    title: '3. Customize & Preview',
    description: 'Make it yours! Adjust colors, add a logo, select styles, and see the changes live.',
  },
  {
    icon: Download,
    title: '4. Download',
    description: 'Get your finished QR code in high-resolution PNG or vector SVG format, ready for web or print.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full max-w-5xl text-center space-y-8 px-4 sm:px-0">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
        Create Your QR Code in <span className="text-primary">4 Simple Steps</span>
      </h2>
      <p className="text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-3xl mx-auto">
        Generating a custom QR code with LinkSpark is quick and intuitive.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
        {steps.map((step, index) => (
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
