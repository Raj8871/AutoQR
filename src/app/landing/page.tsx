
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image'; // Use next/image for optimized images
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Instagram, Twitter, Facebook, Phone, Mail } from 'lucide-react';

interface LandingData {
    title: string;
    logo: string; // Assuming URL for logo
    contact: string; // Phone or Email
    social: {
        insta?: string;
        twitter?: string;
        fb?: string;
    };
}

function LandingContent() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<LandingData | null>(null);

    useEffect(() => {
        const encodedData = searchParams.get('data');
        if (encodedData) {
            try {
                const decodedData = decodeURIComponent(encodedData);
                const parsedData: LandingData = JSON.parse(decodedData);
                setData(parsedData);
            } catch (error) {
                console.error("Error parsing landing page data:", error);
                setData({ title: "Error Loading Page", logo: '', contact: '', social: {} });
            }
        } else {
             setData({ title: "Landing Page", logo: '', contact: '', social: {} }); // Default fallback
        }
    }, [searchParams]);

    if (!data) {
        return <div className="text-center p-10">Loading landing page...</div>;
    }

    const isEmail = data.contact?.includes('@');
    const contactLink = isEmail ? `mailto:${data.contact}` : `tel:${data.contact}`;

    return (
        <Card className="w-full max-w-sm mx-auto mt-10 overflow-hidden">
            {/* Optional Header Image/Logo Area */}
             {data.logo && (
                 <div className="relative w-full h-32 bg-muted flex items-center justify-center">
                    <Image
                        src={data.logo || 'https://picsum.photos/150/150'} // Fallback image
                        alt="Logo"
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-background shadow-md"
                        onError={(e) => e.currentTarget.src = 'https://picsum.photos/150/150'} // Handle image load error
                    />
                 </div>
            )}

            <CardHeader className="text-center pt-6">
                <CardTitle>{data.title || "Welcome!"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4 pb-6">
                {data.contact && (
                    <Button asChild className="w-full">
                        <a href={contactLink}>
                            {isEmail ? <Mail className="mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}
                            {data.contact}
                        </a>
                    </Button>
                )}

                <div className="flex gap-4 justify-center pt-2">
                    {data.social.insta && (
                        <Button variant="ghost" size="icon" asChild>
                            <a href={`https://instagram.com/${data.social.insta}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <Instagram className="h-5 w-5 text-foreground/70" />
                            </a>
                        </Button>
                    )}
                    {data.social.twitter && (
                        <Button variant="ghost" size="icon" asChild>
                            <a href={`https://twitter.com/${data.social.twitter}`} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <Twitter className="h-5 w-5 text-foreground/70" />
                            </a>
                        </Button>
                    )}
                    {data.social.fb && (
                        <Button variant="ghost" size="icon" asChild>
                            <a href={`https://facebook.com/${data.social.fb}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <Facebook className="h-5 w-5 text-foreground/70" />
                            </a>
                        </Button>
                    )}
                </div>
                 <p className="text-xs text-muted-foreground mt-4 text-center">This is a simulated landing page generated from QR data.</p>
            </CardContent>
        </Card>
    );
}


export default function LandingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>}>
        <main className="container flex-1 py-10 bg-gradient-to-br from-background to-secondary/30 min-h-screen">
           <LandingContent />
        </main>
     </Suspense>
  );
}
