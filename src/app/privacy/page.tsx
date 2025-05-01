
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen"> {/* Ensure full height */}
      <Header />
      <main className="container flex-1 py-10 px-4"> {/* Added container and responsive padding */}
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
            <h3 className="font-semibold mt-6 mb-2 text-lg">Information Collection</h3>
            <p>We may collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.</p>
            <h3 className="font-semibold mt-6 mb-2 text-lg">Use of Your Information</h3>
            <p>We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
            <h3 className="font-semibold mt-6 mb-2 text-lg">Sharing Your Information</h3>
            <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
             <h3 className="font-semibold mt-6 mb-2 text-lg">Cookies and Tracking Technologies</h3>
             <p>We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy (if applicable).</p>
             <h3 className="font-semibold mt-6 mb-2 text-lg">Contact Us</h3>
             <p>If you have questions or comments about this policy, you may email us at [Your Contact Email] or by post to:</p>
             <p className="mt-2">[Your Company Name]<br/>[Your Address]<br/>[Your City, State, Zip Code]</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
