import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QrCodeGenerator } from '@/components/QrCodeGenerator'; // Corrected import path

export default function GeneratorPage() {
  return (
    <div className="flex flex-col min-h-screen"> {/* Ensure full height */}
      <Header />
      {/* Main content area with responsive padding */}
      <main className="container flex-1 flex flex-col items-center justify-start py-8 md:py-12 px-4 animate-fade-in">
        {/* QR Code Generator Section takes full width */}
        <section id="qr-generator-section" className="w-full max-w-6xl"> {/* Limit max width */}
             <QrCodeGenerator />
        </section>
      </main>
      <Footer />
    </div>
  );
}