
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CtaButton } from '@/components/CtaButton';
import { QrCodeGenerator } from '@/components/QrCodeGenerator';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  // The target URL for the main CTA can still be configured if needed elsewhere
  // const targetUrl = process.env.NEXT_PUBLIC_TARGET_URL || 'https://firebase.google.com';

  return (
    <>
      <Header />
      <main
        id="home" // ID for navigation link
        className="container flex flex-1 flex-col items-center justify-center py-8 md:py-12"
      >
        {/* Enhanced QR Code Generator Takes Center Stage */}
        <QrCodeGenerator />

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
