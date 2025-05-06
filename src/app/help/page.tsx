
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HelpForm } from '@/components/HelpForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LifeBuoy, BookOpen } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container flex-1 py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 flex items-center justify-center gap-3">
            <LifeBuoy className="h-8 w-8 text-primary" />
            Help & Support
          </h1>

          {/* AI Help Form Section */}
          <HelpForm />

          {/* Basic FAQ or Info Section */}
          <Card className="bg-background/50 border-dashed">
             <CardHeader>
               <CardTitle className="text-xl flex items-center gap-2">
                 <BookOpen className="h-5 w-5 text-primary"/>
                 Frequently Asked Questions (Placeholder)
                </CardTitle>
               <CardDescription>
                 Common questions about using LinkSpark.
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4 text-sm">
               <div>
                 <h4 className="font-semibold">How do I save my QR code?</h4>
                 <p className="text-muted-foreground">Use the "Save to History" button below the preview to save your current configuration locally in your browser.</p>
               </div>
               <div>
                 <h4 className="font-semibold">What formats can I download?</h4>
                 <p className="text-muted-foreground">You can download your QR code as PNG, JPEG, WEBP, or SVG using the dropdown menu below the preview.</p>
               </div>
               <div>
                 <h4 className="font-semibold">Is my data stored on your servers?</h4>
                 <p className="text-muted-foreground">No, LinkSpark is designed with privacy in mind. Your QR code data and history are stored only in your browser's local storage.</p>
               </div>
               <div>
                 <h4 className="font-semibold">Can I add my company logo?</h4>
                 <p className="text-muted-foreground">Yes! Under the "Logo" customization section, you can upload your logo, adjust its size, shape (square/circle), and opacity.</p>
               </div>
             </CardContent>
           </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
}
