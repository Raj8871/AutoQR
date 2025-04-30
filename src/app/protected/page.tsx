
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

function ProtectedContent() {
    const searchParams = useSearchParams();
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const encodedContent = searchParams.get('content');
    const passCheck = searchParams.get('pass_check'); // This is NOT secure, just for simulation

    const content = encodedContent ? decodeURIComponent(encodedContent) : 'No content provided.';
    const correctPassword = passCheck ? decodeURIComponent(passCheck) : null;

    useEffect(() => {
        // Reset on param change
        setIsAuthenticated(false);
        setError(null);
        setPassword('');
    }, [searchParams]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!correctPassword) {
            setError("No password set for this content (simulation error).");
            return;
        }

        if (password === correctPassword) {
            setIsAuthenticated(true);
        } else {
            setError('Incorrect password.');
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto mt-10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" /> Protected Content
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isAuthenticated ? (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Content Unlocked:</h3>
                        {/* Render content - handle potential HTML/scripts carefully in real app */}
                        <div className="p-4 border rounded bg-muted/30 whitespace-pre-wrap break-words">
                             {content.startsWith('http') ? (
                                <a href={content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{content}</a>
                            ) : (
                                <p>{content}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <p className="text-sm text-muted-foreground">This content is password protected. Enter the password to view.</p>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full">
                            Unlock Content
                        </Button>
                    </form>
                )}
                 <p className="text-xs text-muted-foreground mt-4 text-center">Password check is simulated on the client-side for this demo.</p>
            </CardContent>
        </Card>
    );
}


export default function ProtectedPage() {
  return (
    // Wrap with Suspense because useSearchParams() needs it
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>}>
        <main className="container flex-1 py-10">
           <ProtectedContent />
        </main>
    </Suspense>
  );
}
