
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QrCodeGenerator } from '@/components/QrCodeGenerator';

export default function GeneratorPage() {
  return (
    <>
      <Header />
      <main
        className="container flex flex-1 flex-col items-center justify-start py-8 md:py-12 animate-fade-in"
      >
        {/* QR Code Generator Section */}
        <section id="qr-generator-section" className="w-full">
             <h2 className="text-3xl font-semibold text-center mb-8">Your QR Code Generator</h2>
             <QrCodeGenerator />
        </section>
      </main>
      <Footer />
    </>
  );
}
