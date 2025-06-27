'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { FireplaceIcon, GoogleIcon } from '@/components/icons';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (error) {
      console.error('Sign in failed', error);
      // You might want to show a toast message here
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 font-body">
      <div className="flex flex-col items-center text-center mb-8">
        <FireplaceIcon className="h-20 w-20 text-primary mb-4" />
        <h1 className="text-5xl font-headline font-bold text-foreground">
          Welcome to HearthLink
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
          Sign in to join the digital fireside and start reading with friends.
        </p>
      </div>
      <Card className="w-full max-w-sm shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Sign In</CardTitle>
          <CardDescription>Use your Google account to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignIn} className="w-full font-bold">
            <GoogleIcon className="mr-2 h-5 w-5" />
            Sign In with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
