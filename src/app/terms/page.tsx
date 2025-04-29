import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <main className="container flex-1 py-10">
         <Card>
          <CardHeader>
            <CardTitle>Terms of Service</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              This is a placeholder Terms of Service. You should replace this content with your actual terms.
            </p>
            <p className="mt-4">
              By accessing and using this website, you agree to comply with and be bound by the following terms and conditions of use.
            </p>
            {/* Add more sections as needed */}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
