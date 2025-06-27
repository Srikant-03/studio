"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Lamp, PanelLeft, PanelsLeftRight, Highlighter, MessageSquarePlus, Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const HIGHLIGHT_COLORS = [
    { name: 'Yellow', color: 'hsla(50, 100%, 50%, 0.4)' },
    { name: 'Pink', color: 'hsla(320, 100%, 70%, 0.4)' },
    { name: 'Cyan', color: 'hsla(180, 100%, 60%, 0.4)' },
    { name: 'Green', color: 'hsla(120, 100%, 50%, 0.4)' },
    { name: 'Orange', color: 'hsla(25, 100%, 60%, 0.4)' },
];

interface ToolbarProps {
  currentPage: number;
  numPages: number;
  setCurrentPage: (page: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  isDualPage: boolean;
  setIsDualPage: (isDual: boolean) => void;
  interactionMode: 'annotate' | 'highlight' | 'none';
  setInteractionMode: (mode: 'annotate' | 'highlight' | 'none') => void;
  toggleBookmark: () => void;
  isPageBookmarked: boolean;
  highlightColor: string;
  setHighlightColor: (color: string) => void;
}

export function Toolbar({ 
  currentPage, 
  numPages, 
  setCurrentPage, 
  zoom, 
  setZoom, 
  isDualPage, 
  setIsDualPage,
  interactionMode,
  setInteractionMode,
  toggleBookmark,
  isPageBookmarked,
  highlightColor,
  setHighlightColor
}: ToolbarProps) {
  const handlePageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newPage = parseInt(e.target.value, 10);
    if (newPage >= 1 && newPage <= numPages) {
      if (isDualPage && newPage % 2 === 0) {
        newPage -= 1; // In dual page view, always land on an odd page number
      }
      setCurrentPage(newPage);
    }
  };

  const pageIncrement = isDualPage ? 2 : 1;

  return (
    <div className="flex-shrink-0 flex items-center justify-center gap-4 p-2 border-t bg-card/80 flex-wrap">
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage(Math.max(1, currentPage - pageIncrement))} disabled={currentPage <= 1}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous Page</TooltipContent>
          </Tooltip>

          <div className="flex items-baseline gap-1">
            <Input
              type="number"
              value={currentPage}
              onChange={handlePageChange}
              onBlur={(e) => !e.target.value && setCurrentPage(1)}
              className="w-16 h-8 text-center"
            />
            <span className="text-sm text-muted-foreground">/ {numPages}</span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage(Math.min(numPages, currentPage + pageIncrement))} disabled={currentPage >= numPages}>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next Page</TooltipContent>
          </Tooltip>
        </div>
        
        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}>
                        <ZoomOut className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
            
            <span className="text-sm font-semibold w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
            
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(3, zoom + 0.25))}>
                        <ZoomIn className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Tooltip>
              <TooltipTrigger asChild>
                  <Button 
                    variant={interactionMode === 'highlight' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => setInteractionMode(interactionMode === 'highlight' ? 'none' : 'highlight')}>
                      <Highlighter className="h-5 w-5" />
                  </Button>
              </TooltipTrigger>
              <TooltipContent>Highlight Mode</TooltipContent>
          </Tooltip>
          <Tooltip>
              <TooltipTrigger asChild>
                  <Button 
                    variant={interactionMode === 'annotate' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => setInteractionMode(interactionMode === 'annotate' ? 'none' : 'annotate')}>
                      <MessageSquarePlus className="h-5 w-5" />
                  </Button>
              </TooltipTrigger>
              <TooltipContent>Annotation Mode</TooltipContent>
          </Tooltip>
           <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleBookmark}>
                      {isPageBookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                  </Button>
              </TooltipTrigger>
              <TooltipContent>{isPageBookmarked ? 'Remove Bookmark' : 'Bookmark Page'}</TooltipContent>
          </Tooltip>
        </div>
        
        {interactionMode === 'highlight' && (
          <div className="flex items-center gap-2">
              <Separator orientation="vertical" className="h-6" />
              {HIGHLIGHT_COLORS.map(c => (
                  <Tooltip key={c.name}>
                      <TooltipTrigger asChild>
                          <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn("w-6 h-6 rounded-full p-0 border-2", highlightColor === c.color ? 'border-primary' : 'border-transparent')}
                              onClick={() => setHighlightColor(c.color)}
                          >
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color.replace('0.4', '1') }}></div>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>{c.name}</TooltipContent>
                  </Tooltip>
              ))}
          </div>
        )}

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsDualPage(!isDualPage)}>
                      {isDualPage ? <PanelLeft className="h-5 w-5" /> : <PanelsLeftRight className="h-5 w-5" />}
                  </Button>
              </TooltipTrigger>
              <TooltipContent>{isDualPage ? 'Single Page View' : 'Dual Page View'}</TooltipContent>
          </Tooltip>

          <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => document.body.requestFullscreen()}>
                      <Lamp className="h-5 w-5" />
                  </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen Reading</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
