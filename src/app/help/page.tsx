
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
// Removed HelpForm import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LifeBuoy, BookOpen, MessageCircleQuestion } from 'lucide-react'; // Added MessageCircleQuestion

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

          {/* Info about AI Assistant */}
           <Card className="border-primary/30 bg-muted/30">
             <CardHeader>
               <CardTitle className="text-xl flex items-center gap-2">
                 <MessageCircleQuestion className="h-5 w-5 text-primary"/>
                 Need Quick Answers?
               </CardTitle>
               <CardDescription>
                 Use the floating help button (<LifeBuoy className="inline-block h-4 w-4" />) in the bottom-right corner to ask our AI assistant about LinkSpark features!
               </CardDescription>
             </CardHeader>
          </Card>


          {/* Basic FAQ or Info Section */}
          <Card className="bg-background/50 border-dashed">
             <CardHeader>
               <CardTitle className="text-xl flex items-center gap-2">
                 <BookOpen className="h-5 w-5 text-primary"/>
                 Frequently Asked Questions
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
                <div>
                 <h4 className="font-semibold">How do I customize the colors?</h4>
                 <p className="text-muted-foreground">In the "Styling" section, use the color pickers to change the color of the dots, background, and corner elements.</p>
               </div>
                 <div>
                 <h4 className="font-semibold">What does 'Local History' mean?</h4>
                 <p className="text-muted-foreground">It means your generated QR codes are saved directly in your web browser, not on our servers. Clearing your browser data will remove the history.</p>
               </div>
             </CardContent>
           </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
}

