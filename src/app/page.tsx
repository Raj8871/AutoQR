import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CtaButton } from '@/components/CtaButton';

export default function Home() {
  const targetUrl = process.env.NEXT_PUBLIC_TARGET_URL || 'https://firebase.google.com'; // Default URL, configurable via env var

  return (
    <>
      <Header />
      <main
        id="home" // ID for navigation link
        className="flex flex-1 flex-col items-center justify-center p-4 text-center"
      >
        {/* Optional: Add sections for About and Contact if needed */}
        {/* <section id="about" className="py-16">...</section> */}
        {/* <section id="contact" className="py-16">...</section> */}

        <div className="my-auto"> {/* Center the button vertically */}
          <CtaButton url={targetUrl} text="Visit Firebase" />
          <p className="mt-4 text-sm text-muted-foreground">
            Click the button above to go to our destination!
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
