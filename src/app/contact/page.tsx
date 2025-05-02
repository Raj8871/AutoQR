
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen"> {/* Ensure full height */}
      <Header />
      <main className="container flex-1 py-10 px-4"> {/* Added container and responsive padding */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We'd love to hear from you! Please use the form below to get in touch.
            </p>

            {/* Placeholder Contact Form - Replace with actual form if needed */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="Your Name" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea id="message" rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="Your Message"></textarea>
              </div>
              <div>
                <button type="submit" className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  Send Message
                </button>
              </div>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Alternatively, you can reach us via email at: <a href="mailto:support@linkspark.com" className="text-primary">support@linkspark.com</a>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
