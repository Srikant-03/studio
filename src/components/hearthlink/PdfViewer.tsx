"use client";

import { useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import type { Annotation, Highlight, User } from '@/types/hearthlink';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

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
}

export function PdfViewer({ pdfData, currentPage, zoom, annotations, highlights, addAnnotation, addHighlight, currentUser, onDocumentLoadSuccess }: PdfViewerProps) {
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const [isDrawingHighlight, setIsDrawingHighlight] = useState(false);
  const [highlightStart, setHighlightStart] = useState<{x: number, y: number} | null>(null);
  const [highlightEnd, setHighlightEnd] = useState<{x: number, y: number} | null>(null);
  
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click was on the page background, not on an existing annotation dot
    if (e.target !== e.currentTarget) return;

    if (!pageWrapperRef.current) return;
    
    const rect = pageWrapperRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
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
    <div 
        className="w-full h-full overflow-auto flex justify-center items-start p-4 bg-muted/50"
    >
      <div 
        className="relative shadow-lg page-turn-animation"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        title={isDrawingHighlight ? "" : "Click to add an annotation. Hold Alt and drag to highlight."}
      >
        <div ref={pageWrapperRef} onClick={handleContainerClick}>
            <Document
                file={pdfData}
                loading={<div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                error="Failed to load PDF file."
                onLoadSuccess={onDocumentLoadSuccess}
            >
                <Page
                    pageNumber={currentPage}
                    scale={zoom}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                />
            </Document>
        </div>

        {/* This div is the overlay, absolutely positioned to the pageWrapperRef's parent */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {/* Highlights Layer */}
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

            {/* Annotations Layer */}
            <TooltipProvider>
                {annotations.map(annotation => (
                <Tooltip key={annotation.id}>
                    <TooltipTrigger asChild>
                    <div
                        className="ember-dot absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer pointer-events-auto"
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
            </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
