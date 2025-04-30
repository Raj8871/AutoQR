
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/HeroSection'; // Import the hero component
import { FeaturesSection } from '@/components/FeaturesSection'; // Import the features component
import { HowItWorksSection } from '@/components/HowItWorksSection'; // Import the how-it-works component
import { Separator } from '@/components/ui/separator'; // Import Separator for visual breaks

// This remains a Server Component
export default function Home() {
  return (
    <>
      <Header />
      <main
        className="container flex flex-1 flex-col items-center justify-start py-8 md:py-12 animate-fade-in"
      >
        {/* Hero Section */}
        <HeroSection />

        <Separator className="my-12 md:my-16" />

        {/* Features Section */}
        <FeaturesSection />

        <Separator className="my-12 md:my-16" />

        {/* How It Works Section */}
        <HowItWorksSection />

      </main>
      <Footer />
    </>
  );
}
