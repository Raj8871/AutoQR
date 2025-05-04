
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { WhyChooseUsSection } from '@/components/WhyChooseUsSection';
import { UseCasesSection } from '@/components/UseCasesSection'; // Import Use Cases
import { TestimonialsSection } from '@/components/TestimonialsSection'; // Import Testimonials
import { Separator } from '@/components/ui/separator';

// This remains a Server Component
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-muted/10"> {/* Subtle gradient */}
      <Header />
      {/* Main content area with responsive padding and animation */}
      <main className="container flex-1 flex flex-col items-center justify-start py-8 md:py-16 px-4 animate-fade-in space-y-16 md:space-y-24"> {/* Increased spacing */}

        {/* Hero Section */}
        <HeroSection />

        <Separator className="w-1/2 mx-auto" /> {/* Centered separator */}

        {/* How It Works Section (Moved up for better flow) */}
        <HowItWorksSection />

        <Separator className="w-1/2 mx-auto" />

        {/* Features Section */}
        <FeaturesSection />

         <Separator className="w-1/2 mx-auto" />

         {/* Use Cases Section */}
         <UseCasesSection />

         <Separator className="w-1/2 mx-auto" />

        {/* Why Choose Us Section */}
        <WhyChooseUsSection />

         <Separator className="w-1/2 mx-auto" />

         {/* Testimonials Section (Placeholder) */}
         <TestimonialsSection />

      </main>
      <Footer />
    </div>
  );
}
