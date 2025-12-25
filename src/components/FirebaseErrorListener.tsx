'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

function formatContextForDisplay(context: FirestorePermissionError['context']) {
  let details = `Operation: ${context.operation.toUpperCase()}\nPath: ${context.path}`;
  if (context.requestResourceData) {
    details += `\nData: ${JSON.stringify(context.requestResourceData, null, 2)}`;
  }
  return details;
}

/**
 * A client component that listens for Firebase permission errors
 * and displays them as toasts. This is intended for development environments.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error("Caught Firestore Permission Error:", error);
      
      // In a production app, you might log this to a service like Sentry.
      // For development, we'll show a detailed toast.
      
      toast({
        variant: "destructive",
        title: "Firestore Security Rule Denied",
        description: (
            <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
              <code className="text-white text-xs">{formatContextForDisplay(error.context)}</code>
            </pre>
          ),
        duration: 20000, // Give user time to read it
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null; // This component doesn't render anything itself.
}
