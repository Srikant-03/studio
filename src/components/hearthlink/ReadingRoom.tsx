"use client";

import { useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, Loader2, Copy } from 'lucide-react';
import { PdfViewer } from './PdfViewer';
import { Toolbar } from './Toolbar';
import { ChatPanel } from './ChatPanel';
import { SmartAnnotations } from './SmartAnnotations';
import type { Annotation, Highlight, ChatMessage, User, Room } from '@/types/hearthlink';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getRoom, getPdfUrl } from '@/lib/rooms';

// Setup PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export function ReadingRoom({ roomId }: { roomId: string }) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<Room | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);

  // For now, collaboration data is local. A real-time db would be next.
  const [users, setUsers] = useState<User[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
        // Redirect or handle non-authed user
        return;
    }

    setUsers([currentUser]);

    getRoom(roomId)
      .then(roomData => {
        if (roomData) {
          setRoom(roomData);
          return getPdfUrl(roomData.pdfPath);
        } else {
          throw new Error("Room not found. It might have been deleted or the code is incorrect.");
        }
      })
      .then(async (url) => {
        // pdf.js needs cors enabled on the storage bucket
        const doc = await pdfjsLib.getDocument(url).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      })
      .catch(err => {
        console.error("Error loading room or PDF:", err);
        setError(err.message || "Failed to load reading room.");
        toast({ variant: "destructive", title: "Error", description: err.message });
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [roomId, currentUser, authLoading, toast]);


  const addAnnotation = (annotation: Omit<Annotation, 'id' | 'userId' | 'userName' | 'timestamp' | 'color'>) => {
    if (!currentUser) return;
    const newAnnotation: Annotation = {
      ...annotation,
      id: `anno-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: Date.now(),
      color: currentUser.color,
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    addMessage({type: 'system', message: `${currentUser.name} added an annotation on page ${annotation.pageNumber}.`})
  };

  const addHighlight = (highlight: Omit<Highlight, 'id' | 'userId' | 'userName' | 'timestamp' | 'color'>) => {
    if (!currentUser) return;
    const newHighlight: Highlight = {
        ...highlight,
        id: `high-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: Date.now(),
        color: `${currentUser.color.replace('hsl', 'hsla').replace(')', ', 0.3)')}`,
    };
    setHighlights(prev => [...prev, newHighlight]);
  }

  const addMessage = (message: { type: 'text' | 'system', message: string }) => {
    if (!currentUser) return;
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: message.type,
      userId: message.type === 'system' ? 'system' : currentUser.id,
      userName: message.type === 'system' ? 'System' : currentUser.name,
      message: message.message,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast({ title: "Copied!", description: "Room code copied to clipboard." });
  }
  
  if (isLoading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-headline">Warming up the reading space...</p>
      </div>
    );
  }

  if (error || !pdfDoc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Card className="w-full max-w-lg shadow-xl text-center">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-destructive">Error Loading Room</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Could not load the book for this room."}</p>
            <Button onClick={() => window.location.href = '/'} className="mt-4">Back to Welcome Page</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background font-body text-foreground overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-card/80 p-4 border-r overflow-y-auto hidden md:flex flex-col">
        <h2 className="font-headline text-xl font-bold border-b pb-2 mb-4">Smart Tools</h2>
        <SmartAnnotations pdfDoc={pdfDoc} />
        <div className="mt-auto space-y-4">
            <div className="space-y-2">
                <h3 className="font-headline text-lg font-bold border-b pb-2">Invite Friends</h3>
                <p className="text-sm text-muted-foreground">Share this code to invite others:</p>
                <div className="flex items-center gap-2">
                    <Input readOnly value={roomId} className="bg-muted"/>
                    <Button size="icon" variant="ghost" onClick={copyRoomId}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <h3 className="font-headline text-lg font-bold border-b pb-2">Readers by the Fire</h3>
            <ul className="space-y-2">
                {users.map(user => (
                    <li key={user.id} className="flex items-center">
                        <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: user.color }}></span>
                        <span>{user.name}</span>
                    </li>
                ))}
            </ul>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="flex-shrink-0 border-b p-2 text-center bg-card/80">
          <h1 className="font-headline text-2xl font-bold">{room?.name}</h1>
          <p className="text-sm text-muted-foreground">Page {currentPage} of {numPages}</p>
        </header>
        <div className="flex-1 relative overflow-hidden">
            <PdfViewer
                pdfDoc={pdfDoc}
                currentPage={currentPage}
                zoom={zoom}
                annotations={annotations.filter(a => a.pageNumber === currentPage)}
                highlights={highlights.filter(h => h.pageNumber === currentPage)}
                addAnnotation={addAnnotation}
                addHighlight={addHighlight}
                currentUser={currentUser}
            />
        </div>
        <Toolbar
          currentPage={currentPage}
          numPages={numPages}
          setCurrentPage={setCurrentPage}
          zoom={zoom}
          setZoom={setZoom}
        />
      </main>
      <ChatPanel messages={messages} addMessage={addMessage} currentUser={currentUser} />
    </div>
  );
}
