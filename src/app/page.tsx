
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
// import { QrCodeGenerator } from '@/components/QrCodeGenerator'; // No longer needed here
// import { Separator } from '@/components/ui/separator'; // No longer needed here
import { HeroSection } from '@/components/HeroSection'; // Import the new client component

// This is now a Server Component again, as interactivity is moved to HeroSection
export default function Home() {

  return (
    <>
      <Header />
      <main
        // id="home" // Removed ID as scroll navigation is being changed
        className="container flex flex-1 flex-col items-center justify-start py-8 md:py-12 animate-fade-in" // Changed justify-center to justify-start
      >
        {/* Use the client component for the hero section */}
        <HeroSection />

        {/* QR Code Generator Section Removed */}
        {/*
        <Separator className="my-12" />
        <section id="qr-generator-section" className="w-full">
             <h2 className="text-3xl font-semibold text-center mb-8">Your QR Code Generator</h2>
             <QrCodeGenerator />
        </section>
        */}

        {/* Optional CTA also removed for cleaner landing page focus */}
        {/*
        <Separator className="my-12" />
        <div className="text-center space-y-4">
           <CtaButton url={targetUrl} text="Visit Our Main Site" />
           <p className="text-sm text-muted-foreground">
             Or create your custom QR code above!
           </p>
        </div>
        */}

      </main>
      <Footer />
    </>
  );
}
