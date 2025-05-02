
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LinkIcon, Palette, ImageIcon, Shapes, Download, History, Sparkles, CreditCard } from 'lucide-react'; // Added CreditCard

const features = [
  {
    icon: LinkIcon,
    title: 'Multiple QR Types',
    description: 'Generate codes for URLs, text, email, phone, SMS, WhatsApp, Wi-Fi, vCards, events, locations, and UPI payments.', // Added UPI
  },
  {
    icon: Palette,
    title: 'Color Customization',
    description: 'Personalize your QR codes by changing dot and background colors to match your brand.',
  },
  {
    icon: Shapes,
    title: 'Style Options',
    description: 'Choose from various dot styles (square, rounded, dots) and corner styles for unique designs.',
  },
  {
    icon: ImageIcon,
    title: 'Logo Integration',
    description: 'Embed your logo in the center, adjust its size, shape (square/circle), and opacity.',
  },
   {
    icon: CreditCard, // Added UPI Icon
    title: 'UPI Payments',
    description: 'Create QR codes for quick UPI payments with pre-filled amounts and notes.',
  },
  {
    icon: Download,
    title: 'High-Res Downloads',
    description: 'Download your QR codes in PNG, JPEG, WEBP, or SVG formats, suitable for print and web.',
  },
  {
    icon: History,
    title: 'Local History',
    description: 'Your generated QR codes are saved locally in your browser for easy access and reloading.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="w-full max-w-5xl text-center space-y-8 px-4 sm:px-0"> {/* Responsive padding */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"> {/* Responsive heading size */}
        Packed with <span className="text-primary">Powerful Features</span>
      </h2>
      <p className="text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-3xl mx-auto"> {/* Responsive text and max-width */}
        Everything you need to create beautiful and functional QR codes in one place.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-4 text-left"> {/* Adjusted gap */}
        {features.map((feature, index) => (
          <Card key={index} className="bg-card/50 hover:shadow-lg transition-shadow duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center gap-3 sm:gap-4 pb-2 px-4 sm:px-6 pt-4 sm:pt-6"> {/* Responsive padding/gap */}
               <div className="bg-primary/10 p-2 rounded-full">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> {/* Responsive icon size */}
               </div>
              <CardTitle className="text-md sm:text-lg font-semibold">{feature.title}</CardTitle> {/* Responsive title size */}
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6"> {/* Responsive padding */}
              <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p> {/* Responsive description size */}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

