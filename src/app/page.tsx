
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/HeroSection'; // Import the hero component
import { FeaturesSection } from '@/components/FeaturesSection'; // Import Features
import { HowItWorksSection } from '@/components/HowItWorksSection'; // Import How It Works
import { WhyChooseUsSection } from '@/components/WhyChooseUsSection'; // Import Why Choose Us
import { Separator } from '@/components/ui/separator'; // Import Separator for visual breaks
import { QrTypesShowcase } from '@/components/QrTypesShowcase'; // Import the new showcase component

// This remains a Server Component
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen"> {/* Ensure full height */}
      <Header />
      {/* Main content area with responsive padding */}
      <main className="container flex-1 flex flex-col items-center justify-start py-8 md:py-12 px-4 animate-fade-in">

        {/* Hero Section */}
        <HeroSection />

        <Separator className="my-12 md:my-16" />

        {/* QR Types Showcase Section */}
        <QrTypesShowcase />

        <Separator className="my-12 md:my-16" />

        {/* Features Section */}
        <FeaturesSection />

        <Separator className="my-12 md:my-16" />

        {/* How It Works Section */}
        <HowItWorksSection />

         <Separator className="my-12 md:my-16" />

        {/* Why Choose Us Section */}
        <WhyChooseUsSection />

      </main>
      <Footer />
    </div>
  );
}
