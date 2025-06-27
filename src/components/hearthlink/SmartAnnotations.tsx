"use client";

import { useState, useTransition } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, Loader2, Info } from 'lucide-react';
import { extractTextFromPdf } from '@/app/actions';

interface SmartAnnotationsProps {
  pdfDoc: PDFDocumentProxy;
}

async function extractText(pdf: PDFDocumentProxy): Promise<string> {
    const numPages = pdf.numPages;
    let fullText = '';
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
}

export function SmartAnnotations({ pdfDoc }: SmartAnnotationsProps) {
  const [isPending, startTransition] = useTransition();
  const [keyPhrases, setKeyPhrases] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSuggestAnnotations = () => {
    startTransition(async () => {
      setError(null);
      setKeyPhrases([]);
      try {
        const pdfText = await extractText(pdfDoc);
        if(!pdfText.trim()){
            setError("Could not extract any text from this PDF. It might be an image-based PDF.");
            return;
        }
        const result = await extractTextFromPdf({ pdfText });
        if (result.keyPhrases) {
          setKeyPhrases(result.keyPhrases);
        } else {
          setError("The AI couldn't find any key phrases. Try a different document.");
        }
      } catch (e) {
        console.error(e);
        setError("An error occurred while getting suggestions.");
      }
    });
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          <span>Annotation Helper</span>
        </CardTitle>
        <CardDescription>Let AI suggest key phrases to annotate.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Button onClick={handleSuggestAnnotations} disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Suggest Annotations"
          )}
        </Button>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        {keyPhrases.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Suggested Phrases:</h4>
            <ScrollArea className="h-48 rounded-md border p-2 bg-muted/50">
              <ul className="space-y-2">
                {keyPhrases.map((phrase, index) => (
                  <li key={index} className="text-sm p-2 rounded-md bg-background hover:bg-primary/10 cursor-pointer">
                    {phrase}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
        {!isPending && keyPhrases.length === 0 && !error && (
            <div className="mt-4 text-sm text-muted-foreground p-2 rounded-md bg-muted/30 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Click the button to scan the document and get suggestions for annotations. This can help you focus on the most important parts of the text.</span>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
