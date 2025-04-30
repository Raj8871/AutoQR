

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/HeroSection'; // Import the hero component
// import { FeaturesSection } from '@/components/FeaturesSection'; // Removed Features
// import { HowItWorksSection } from '@/components/HowItWorksSection'; // Removed How It Works
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

        {/* Removed Separator and other sections */}
        {/*
        <Separator className="my-12 md:my-16" />

        <FeaturesSection />

        <Separator className="my-12 md:my-16" />

        <HowItWorksSection />
        */}

      </main>
      <Footer />
    </>
  );
}
