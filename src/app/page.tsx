
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CtaButton } from '@/components/CtaButton';
import { QrCodeGenerator } from '@/components/QrCodeGenerator'; // Import the new component
import { Separator } from '@/components/ui/separator'; // Import Separator

export default function Home() {
  const targetUrl = process.env.NEXT_PUBLIC_TARGET_URL || 'https://firebase.google.com'; // Default URL, configurable via env var

  return (
    <>
      <Header />
      <main
        id="home" // ID for navigation link
        className="flex flex-1 flex-col items-center justify-center p-4 text-center"
      >
        <div className="my-auto space-y-8"> {/* Center content vertically and add spacing */}
          {/* Call to Action Button */}
          <div>
            <CtaButton url={targetUrl} text="Visit Firebase" />
            <p className="mt-4 text-sm text-muted-foreground">
              Click the button above to go to our destination!
            </p>
          </div>

           <Separator className="my-8" /> {/* Add a separator */}

          {/* QR Code Generator */}
           <QrCodeGenerator initialUrl={targetUrl} />

        </div>


        {/* Optional: Placeholder sections for About and Contact */}
        <section id="about" className="py-16 hidden"> {/* Hidden for now */}
            <h2 className="text-2xl font-bold mb-4">About Us</h2>
            <p className="text-muted-foreground">This website provides a direct link and a customizable QR code to a target URL.</p>
        </section>
        <section id="contact" className="py-16 hidden"> {/* Hidden for now */}
            <h2 className="text-2xl font-bold mb-4">Contact</h2>
             <p className="text-muted-foreground">Contact information placeholder.</p>
        </section>

      </main>
      <Footer />
    </>
  );
}
