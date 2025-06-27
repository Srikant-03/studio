"use client";

import { useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, Loader2 } from 'lucide-react';
import { PdfViewer } from './PdfViewer';
import { Toolbar } from './Toolbar';
import { ChatPanel } from './ChatPanel';
import { SmartAnnotations } from './SmartAnnotations';
import type { Annotation, Highlight, ChatMessage, User } from '@/types/hearthlink';
import { useToast } from '@/components/ui/use-toast';

// Setup PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

// Mock data
const MOCK_USERS: User[] = [
    { id: 'user-2', name: 'Jane Doe', color: 'hsl(var(--accent))' },
    { id: 'user-3', name: 'Sam Smith', color: 'hsl(var(--chart-2))' },
];

const MOCK_ANNOTATIONS: Annotation[] = [
    { id: 'anno-1', userId: 'user-2', userName: 'Jane Doe', pageNumber: 1, x: 50, y: 20, content: "This is a great opening line!", timestamp: Date.now() - 100000, color: MOCK_USERS[0].color },
    { id: 'anno-2', userId: 'user-3', userName: 'Sam Smith', pageNumber: 1, x: 70, y: 45, content: "I wonder what this symbolises.", timestamp: Date.now() - 50000, color: MOCK_USERS[1].color },
];

const MOCK_HIGHLIGHTS: Highlight[] = [
    { id: 'high-1', userId: 'user-2', userName: 'Jane Doe', pageNumber: 1, rects: [{ x: 48, y: 18, width: 20, height: 2 }], color: 'hsla(var(--accent), 0.3)', timestamp: Date.now() - 90000 },
];

const MOCK_MESSAGES: ChatMessage[] = [
    { id: 'msg-1', type: 'system', userId: 'system', userName: 'System', message: 'Jane Doe has joined the room.', timestamp: Date.now() - 200000 },
    { id: 'msg-2', type: 'text', userId: 'user-2', userName: 'Jane Doe', message: 'Hey everyone! Ready to read?', timestamp: Date.now() - 180000 },
    { id: 'msg-3', type: 'system', userId: 'system', userName: 'System', message: 'Sam Smith has joined the room.', timestamp: Date.now() - 170000 },
];

export function ReadingRoom({ roomId }: { roomId: string }) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [expectedPdfName, setExpectedPdfName] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [annotations, setAnnotations] = useState<Annotation[]>(MOCK_ANNOTATIONS);
  const [highlights, setHighlights] = useState<Highlight[]>(MOCK_HIGHLIGHTS);
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching room data and setting up user
    const storedPdfUrl = sessionStorage.getItem(`pdf_${roomId}`);
    const storedPdfName = sessionStorage.getItem(`pdf_name_${roomId}`);
    const storedRoomName = sessionStorage.getItem(`room_name_${roomId}`);
    
    setExpectedPdfName(storedPdfName || `a specific PDF for room ${roomId}`);
    setRoomName(storedRoomName || `Room ${roomId}`);
    
    if (storedPdfUrl && storedPdfName) {
      fetch(storedPdfUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], storedPdfName, { type: 'application/pdf' });
          handlePdfLoad(file);
        });
    } else {
      setIsLoading(false);
    }

    const user: User = { id: 'user-1', name: 'You', color: 'hsl(var(--primary))' };
    setCurrentUser(user);
    setUsers(prev => [user, ...prev]);

  }, [roomId]);


  const handlePdfLoad = useCallback(async (file: File) => {
    if (expectedPdfName && file.name !== expectedPdfName) {
        toast({
            variant: "destructive",
            title: "Incorrect PDF File",
            description: `Please upload "${expectedPdfName}". The uploaded file was "${file.name}".`,
        });
        return;
    }
    
    setIsLoading(true);
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      if (!e.target?.result) return;
      const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
      try {
        const doc = await pdfjsLib.getDocument({ data: typedArray }).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setPdfFile(file);
        toast({ title: "Book opened!", description: `"${file.name}" is ready for reading.` });
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast({ variant: "destructive", title: "PDF Load Error", description: "Could not load the PDF file. It might be corrupted." });
      } finally {
        setIsLoading(false);
      }
    };
    fileReader.readAsArrayBuffer(file);
  }, [expectedPdfName, toast]);

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
    // Simulate system message
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
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-headline">Warming up the reading space...</p>
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Open Your Book</CardTitle>
            <p className="text-sm text-muted-foreground">To join the "{roomName}" reading session, please select the correct PDF file.</p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="font-semibold text-primary">Please upload: <span className="font-bold text-foreground">{expectedPdfName || "the designated book"}</span></p>
            <Input 
              id="pdf-upload" 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && handlePdfLoad(e.target.files[0])}
            />
            <Button asChild className="w-full">
              <Label htmlFor="pdf-upload" className="cursor-pointer">
                <FileUp className="mr-2 h-4 w-4" />
                Select PDF File
              </Label>
            </Button>
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
          <h1 className="font-headline text-2xl font-bold">{roomName}</h1>
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
