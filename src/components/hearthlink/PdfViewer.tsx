"use client";

import { useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import type { Annotation, Highlight, User } from '@/types/hearthlink';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// This is required for react-pdf to work
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  pdfData: ArrayBuffer;
  currentPage: number;
  zoom: number;
  annotations: Annotation[];
  highlights: Highlight[];
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'userId' | 'userName' | 'timestamp' | 'color'>) => void;
  addHighlight: (highlight: Omit<Highlight, 'id' | 'userId' | 'userName' | 'timestamp' | 'color'>) => void;
  currentUser: User | null;
  onDocumentLoadSuccess: (doc: PDFDocumentProxy) => void;
  isDualPage: boolean;
  numPages: number;
}

interface SinglePageViewProps {
  pageNumber: number;
  zoom: number;
  annotations: Annotation[];
  highlights: Highlight[];
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'userId' | 'userName' | 'timestamp' | 'color'>) => void;
  addHighlight: (highlight: Omit<Highlight, 'id' | 'userId' | 'userName' | 'timestamp' | 'color'>) => void;
  currentUser: User | null;
}

function SinglePageView({ pageNumber, zoom, annotations, highlights, addAnnotation, addHighlight, currentUser }: SinglePageViewProps) {
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const [isDrawingHighlight, setIsDrawingHighlight] = useState(false);
  const [highlightStart, setHighlightStart] = useState<{x: number, y: number} | null>(null);
  const [highlightEnd, setHighlightEnd] = useState<{x: number, y: number} | null>(null);
  
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger on direct clicks on the container, not on annotations or other elements.
    // Also, don't trigger if the user just finished drawing a highlight.
    if (e.target !== e.currentTarget || isDrawingHighlight) return;
    if (!pageWrapperRef.current) return;
    
    // Check if the click was part of a drag (for text selection)
    if (Math.abs(e.clientX - (e.currentTarget.dataset.mouseDownX ? parseFloat(e.currentTarget.dataset.mouseDownX) : e.clientX)) > 5 ||
        Math.abs(e.clientY - (e.currentTarget.dataset.mouseDownY ? parseFloat(e.currentTarget.dataset.mouseDownY) : e.clientY)) > 5) {
        return;
    }
    
    const rect = pageWrapperRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const content = prompt("Enter annotation text:");
    if (content) {
      addAnnotation({
        pageNumber,
        x,
        y,
        content,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
     // Store mouse down position to differentiate click from drag
    e.currentTarget.dataset.mouseDownX = `${e.clientX}`;
    e.currentTarget.dataset.mouseDownY = `${e.clientY}`;

    if (!e.altKey || !pageWrapperRef.current) return;
    e.preventDefault();
    setIsDrawingHighlight(true);
    const rect = pageWrapperRef.current.getBoundingClientRect();
    setHighlightStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHighlightEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingHighlight || !pageWrapperRef.current) return;
    const rect = pageWrapperRef.current.getBoundingClientRect();
    setHighlightEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    if (!isDrawingHighlight || !highlightStart || !highlightEnd || !pageWrapperRef.current) return;
    
    const { width, height } = pageWrapperRef.current.getBoundingClientRect();
    
    // Prevent creating tiny highlights from mis-clicks
    if (Math.abs(highlightEnd.x - highlightStart.x) < 5 || Math.abs(highlightEnd.y - highlightStart.y) < 5) {
        setIsDrawingHighlight(false);
        setHighlightStart(null);
        setHighlightEnd(null);
        return;
    }

    const newHighlight = {
        pageNumber,
        rects: [{
            x: (Math.min(highlightStart.x, highlightEnd.x) / width) * 100,
            y: (Math.min(highlightStart.y, highlightEnd.y) / height) * 100,
            width: (Math.abs(highlightEnd.x - highlightStart.x) / width) * 100,
            height: (Math.abs(highlightEnd.y - highlightStart.y) / height) * 100
        }]
    };
    addHighlight(newHighlight);

    // Set a timeout to reset isDrawingHighlight to false, to prevent click event from firing.
    setTimeout(() => {
        setIsDrawingHighlight(false);
    }, 100);

    setHighlightStart(null);
    setHighlightEnd(null);
  };
  
  return (
    <div 
        className="relative shadow-lg page-turn-animation"
        style={{ transform: `scale(${zoom})` }}
      >
        <div 
            ref={pageWrapperRef} 
            onClick={handleContainerClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            title="Click to add an annotation. Hold Alt and drag to highlight."
        >
            <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
            />
        </div>

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

            <TooltipProvider>
                {annotations.map(annotation => (
                <Tooltip key={annotation.id}>
                    <TooltipTrigger asChild>
                    <div
                        className="ember-dot absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer pointer-events-auto"
                        style={{ left: `${annotation.x}%`, top: `${annotation.y}%`, backgroundColor: annotation.color }}
                    />
                    </TooltipTrigger>
                    <TooltipContent className="bg-card text-card-foreground shadow-lg max-w-xs">
                    <p className="font-bold text-sm" style={{color: annotation.color}}>{annotation.userName}</p>
                    <p className="text-base break-words">{annotation.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(annotation.timestamp).toLocaleString()}</p>
                    </TooltipContent>
                </Tooltip>
                ))}
            </TooltipProvider>
        </div>
      </div>
  );
}


export function PdfViewer({ pdfData, currentPage, zoom, annotations, highlights, addAnnotation, addHighlight, currentUser, onDocumentLoadSuccess, isDualPage, numPages }: PdfViewerProps) {
  
  return (
    <div className="w-full h-full overflow-auto flex justify-center items-start p-4 bg-muted/50">
      <Document
          file={pdfData}
          loading={<div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          error="Failed to load PDF file."
          onLoadSuccess={onDocumentLoadSuccess}
      >
        <div className="flex justify-center items-start gap-8">
            {currentPage <= numPages && (
                <SinglePageView 
                    pageNumber={currentPage}
                    zoom={zoom}
                    annotations={annotations.filter(a => a.pageNumber === currentPage)}
                    highlights={highlights.filter(h => h.pageNumber === currentPage)}
                    addAnnotation={addAnnotation}
                    addHighlight={addHighlight}
                    currentUser={currentUser}
                />
            )}
            {isDualPage && currentPage + 1 <= numPages && (
                <SinglePageView 
                    pageNumber={currentPage + 1}
                    zoom={zoom}
                    annotations={annotations.filter(a => a.pageNumber === currentPage + 1)}
                    highlights={highlights.filter(h => h.pageNumber === currentPage + 1)}
                    addAnnotation={addAnnotation}
                    addHighlight={addHighlight}
                    currentUser={currentUser}
                />
            )}
        </div>
      </Document>
    </div>
  );
}
