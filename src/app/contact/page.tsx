
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ContactForm } from '@/components/ContactForm'; // Import the new form component
import { Mail, Phone, MapPin } from 'lucide-react'; // Import icons

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen"> {/* Ensure full height */}
      <Header />
      <main className="container flex-1 py-10 px-4"> {/* Added container and responsive padding */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"> {/* Grid layout */}
          {/* Contact Information Section */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl">Get in Touch</CardTitle>
              <CardDescription>
                We're here to help and answer any question you might have. We look forward to hearing from you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Email Us</h3>
                  <a href="mailto:support@linkspark.com" className="text-muted-foreground hover:text-primary transition-colors">
                    support@linkspark.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Call Us (Placeholder)</h3>
                  <p className="text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start gap-4"> {/* Use items-start for multi-line address */}
                <MapPin className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <h3 className="font-semibold">Visit Us (Placeholder)</h3>
                  <p className="text-muted-foreground">
                    123 Innovation Drive<br />
                    Tech City, CA 94000<br />
                    United States
                  </p>
                </div>
              </div>
               {/* Optional: Placeholder Map */}
              <div className="mt-6 border rounded-lg overflow-hidden">
                 <img
                    src="https://picsum.photos/600/300"
                    alt="Placeholder map"
                    className="w-full h-48 object-cover"
                    data-ai-hint="map location"
                 />
              </div>
            </CardContent>
          </Card>

          {/* Contact Form Section */}
          <Card className="animate-fade-in [animation-delay:0.1s]">
            <CardHeader>
              <CardTitle className="text-2xl">Send Us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm /> {/* Use the dedicated form component */}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
