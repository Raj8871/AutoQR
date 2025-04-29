import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="container flex-1 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              This is a placeholder Privacy Policy. You should replace this content with your actual policy.
            </p>
            <p className="mt-4">
              We are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your information when you visit our website.
            </p>
            {/* Add more sections as needed */}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
