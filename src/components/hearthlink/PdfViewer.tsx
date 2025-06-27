"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { Annotation, Highlight, User } from '@/types/hearthlink';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PdfViewerProps {
  pdfDoc: PDFDocumentProxy;
  currentPage: number;
  zoom: number;
  annotations: Annotation[];
  highlights: Highlight[];
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'userId' | 'userName' | 'timestamp' | 'color'>) => void;
  addHighlight: (highlight: Omit<Highlight, 'id' | 'userId' | 'userName' | 'timestamp' | 'color'>) => void;
  currentUser: User | null;
}

export function PdfViewer({ pdfDoc, currentPage, zoom, annotations, highlights, addAnnotation, addHighlight, currentUser }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawingHighlight, setIsDrawingHighlight] = useState(false);
  const [highlightStart, setHighlightStart] = useState<{x: number, y: number} | null>(null);
  const [highlightEnd, setHighlightEnd] = useState<{x: number, y: number} | null>(null);
  const { toast } = useToast();

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      containerRef.current.style.height = `${viewport.height}px`;
      containerRef.current.style.width = `${viewport.width}px`;
      
      if(context){
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      toast({ variant: "destructive", title: "Render Error", description: `Could not render page ${currentPage}.` });
    }
  }, [pdfDoc, currentPage, zoom, toast]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // ignore clicks on annotations
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Simple popover to add annotation
    // In a real app this would be a more complex modal or inline form
    const content = prompt("Enter annotation text:");
    if (content) {
      addAnnotation({
        pageNumber: currentPage,
        x,
        y,
        content,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!e.altKey || !containerRef.current) return; // Use Alt key to start highlighting
    e.preventDefault();
    setIsDrawingHighlight(true);
    const rect = containerRef.current.getBoundingClientRect();
    setHighlightStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHighlightEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingHighlight || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHighlightEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    if (!isDrawingHighlight || !highlightStart || !highlightEnd || !containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    const newHighlight = {
        pageNumber: currentPage,
        rects: [{
            x: (Math.min(highlightStart.x, highlightEnd.x) / width) * 100,
            y: (Math.min(highlightStart.y, highlightEnd.y) / height) * 100,
            width: (Math.abs(highlightEnd.x - highlightStart.x) / width) * 100,
            height: (Math.abs(highlightEnd.y - highlightStart.y) / height) * 100
        }]
    };
    addHighlight(newHighlight);

    setIsDrawingHighlight(false);
    setHighlightStart(null);
    setHighlightEnd(null);
  };
  
  return (
    <div className="w-full h-full overflow-auto flex justify-center items-start p-4 bg-muted/50">
      <div 
        ref={containerRef} 
        className="relative shadow-lg page-turn-animation"
        onClick={handleContainerClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        title={isDrawingHighlight ? "" : "Click to add an annotation. Hold Alt and drag to highlight."}
      >
        <canvas ref={canvasRef} />
        {/* Highlights Layer */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {highlights.map(h => h.rects.map((rect, i) => (
             <div 
                key={`${h.id}-${i}`}
                className="highlight-area"
                style={{
                    left: `${rect.x}%`,
                    top: `${rect.y}%`,
                    width: `${rect.width}%`,
                    height: `${rect.height}%`,
                    backgroundColor: h.color
                }}
             />
          )))}
          {isDrawingHighlight && highlightStart && highlightEnd && (
            <div
                className="highlight-area"
                style={{
                    left: Math.min(highlightStart.x, highlightEnd.x),
                    top: Math.min(highlightStart.y, highlightEnd.y),
                    width: Math.abs(highlightEnd.x - highlightStart.x),
                    height: Math.abs(highlightEnd.y - highlightStart.y),
                    backgroundColor: currentUser ? `${currentUser.color.replace('hsl', 'hsla').replace(')', ', 0.3)')}` : 'rgba(255, 215, 0, 0.3)',
                    border: `1px dashed ${currentUser?.color}`
                }}
            />
          )}
        </div>
        {/* Annotations Layer */}
        <TooltipProvider>
        <div className="absolute top-0 left-0 w-full h-full">
          {annotations.map(annotation => (
            <Tooltip key={annotation.id}>
              <TooltipTrigger asChild>
                <div
                  className="ember-dot absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer"
                  style={{ left: `${annotation.x}%`, top: `${annotation.y}%`, backgroundColor: annotation.color }}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-card text-card-foreground shadow-lg">
                <p className="font-bold text-sm" style={{color: annotation.color}}>{annotation.userName}</p>
                <p className="text-base">{annotation.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(annotation.timestamp).toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
