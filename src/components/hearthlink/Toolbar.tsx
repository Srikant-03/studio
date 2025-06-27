"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Lamp, PanelLeft, PanelsLeftRight } from 'lucide-react';

interface ToolbarProps {
  currentPage: number;
  numPages: number;
  setCurrentPage: (page: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  isDualPage: boolean;
  setIsDualPage: (isDual: boolean) => void;
}

export function Toolbar({ currentPage, numPages, setCurrentPage, zoom, setZoom, isDualPage, setIsDualPage }: ToolbarProps) {
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
    <div className="flex-shrink-0 flex items-center justify-center gap-4 p-2 border-t bg-card/80">
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
      </TooltipProvider>
    </div>
  );
}
