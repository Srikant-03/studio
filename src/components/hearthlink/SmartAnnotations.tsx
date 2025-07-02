"use client";

import { useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { runSmartAnnotations } from '@/app/actions';
import type { SmartAnnotationOutput } from '@/ai/flows/smart-annotation-placement';
import { useToast } from '@/hooks/use-toast';

interface SmartAnnotationsProps {
  pdfDoc: PDFDocumentProxy;
  currentPage: number;
}

export function SmartAnnotations({ pdfDoc, currentPage }: SmartAnnotationsProps) {
  const [suggestions, setSuggestions] = useState<SmartAnnotationOutput['suggestions']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisPage, setAnalysisPage] = useState<number | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const page = await pdfDoc.getPage(currentPage);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');

      if (!pageText.trim()) {
        setError("This page appears to have no text to analyze.");
        return;
      }
      
      const result = await runSmartAnnotations({ pageText });
      setSuggestions(result.suggestions);
      setAnalysisPage(currentPage);

    } catch (err: any) {
      console.error(err);
      setError("An AI error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: "Smart Annotation Failed",
        description: err.message || "Could not generate suggestions."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
        <h3 className="font-headline text-lg font-bold border-b pb-2 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary"/>
            Smart Annotations
        </h3>
        <Card className="bg-muted/50">
            <CardContent className="pt-6">
                 <p className="text-sm text-muted-foreground mb-4">
                    Let AI suggest interesting talking points for the current page.
                 </p>
                <Button onClick={handleAnalysis} disabled={isLoading} className="w-full">
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Analyze Page {currentPage}
                </Button>

                {error && <p className="text-destructive text-sm mt-4 text-center">{error}</p>}

                {suggestions.length > 0 && analysisPage === currentPage && (
                    <div className="mt-4 space-y-3">
                        <h4 className="font-semibold">Suggestions for Page {currentPage}:</h4>
                        {suggestions.map((suggestion, index) => (
                            <div key={index} className="text-sm p-3 rounded-md border bg-background">
                                <p className="font-bold text-primary">{suggestion.topic}</p>
                                <blockquote className="border-l-2 pl-2 italic my-1">"{suggestion.quote}"</blockquote>
                                <p className="text-muted-foreground">{suggestion.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
                 {suggestions.length === 0 && !isLoading && !error && analysisPage === currentPage &&(
                     <p className="text-muted-foreground text-sm mt-4 text-center">No specific insights found on this page.</p>
                 )}
            </CardContent>
        </Card>
    </div>
  );
}
