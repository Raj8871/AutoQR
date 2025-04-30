
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QrCodeGenerator } from '@/components/QrCodeGenerator';
import { Separator } from '@/components/ui/separator';
import { HeroSection } from '@/components/HeroSection'; // Import the new client component

// This is now a Server Component again, as interactivity is moved to HeroSection
export default function Home() {

  return (
    <>
      <Header />
      <main
        id="home" // ID for navigation link
        className="container flex flex-1 flex-col items-center justify-start py-8 md:py-12 animate-fade-in" // Changed justify-center to justify-start
      >
        {/* Use the client component for the hero section */}
        <HeroSection />

        <Separator className="my-12" />

        {/* QR Code Generator Section */}
        <section id="qr-generator-section" className="w-full">
             <h2 className="text-3xl font-semibold text-center mb-8">Your QR Code Generator</h2>
             <QrCodeGenerator />
        </section>


        {/* Optional: Keep a simple CTA if desired, or remove */}
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
