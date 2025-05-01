
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
     <div className="flex flex-col min-h-screen"> {/* Ensure full height */}
      <Header />
      <main className="container flex-1 py-10 px-4"> {/* Added container and responsive padding */}
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
              By accessing and using this website, you agree to comply with and be bound by the following terms and conditions of use. If you disagree with any part of these terms and conditions, please do not use our website.
            </p>
             {/* Add more sections as needed */}
            <h3 className="font-semibold mt-6 mb-2 text-lg">Use License</h3>
             <ol className="list-decimal list-inside space-y-2 ml-4">
                 <li>Permission is granted to temporarily download one copy of the materials (information or software) on LinkSpark's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                     <ul className="list-disc list-inside ml-6 space-y-1 mt-1">
                        <li>modify or copy the materials;</li>
                        <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                        <li>attempt to decompile or reverse engineer any software contained on LinkSpark's website;</li>
                        <li>remove any copyright or other proprietary notations from the materials; or</li>
                        <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                    </ul>
                 </li>
                 <li>This license shall automatically terminate if you violate any of these restrictions and may be terminated by LinkSpark at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.</li>
             </ol>

            <h3 className="font-semibold mt-6 mb-2 text-lg">Disclaimer</h3>
            <p>The materials on LinkSpark's website are provided on an 'as is' basis. LinkSpark makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

            <h3 className="font-semibold mt-6 mb-2 text-lg">Limitations</h3>
            <p>In no event shall LinkSpark or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on LinkSpark's website, even if LinkSpark or a LinkSpark authorized representative has been notified orally or in writing of the possibility of such damage.</p>

             <h3 className="font-semibold mt-6 mb-2 text-lg">Governing Law</h3>
            <p>These terms and conditions are governed by and construed in accordance with the laws of [Your Jurisdiction] and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
