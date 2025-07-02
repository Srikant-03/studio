"use client";

import { useState, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUp, Loader2, Copy, BookOpen, BookMarked } from 'lucide-react';
import { PdfViewer } from './PdfViewer';
import { Toolbar } from './Toolbar';
import { ChatPanel } from './ChatPanel';
import type { Annotation, Highlight, ChatMessage, User, Room, Bookmark } from '@/types/hearthlink';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getRoom } from '@/lib/rooms';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, orderBy, deleteDoc, where, getDocs } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SmartAnnotations } from './SmartAnnotations';

// Setup PDF.js worker. This needs to be done once per application.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function ReadingRoom({ roomId }: { roomId: string }) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<Room | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDualPage, setIsDualPage] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'annotate' | 'highlight' | 'none'>('none');
  const [highlightColor, setHighlightColor] = useState('hsla(50, 100%, 50%, 0.4)'); // Default: yellow highlight

  // Collaboration data is now fetched from Firestore in real-time
  const [users, setUsers] = useState<User[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);


  // Page persistence logic
  useEffect(() => {
    if (!roomId || currentPage === 1) return; // Don't save initial state
    localStorage.setItem(`hearthlink-lastpage-${roomId}`, String(currentPage));
  }, [currentPage, roomId]);
  
  useEffect(() => {
    if (authLoading || !currentUser) {
        return;
    }

    // This effect handles fetching the room data and setting up all real-time listeners.
    // It runs once the user is authenticated.
    
    // Restore last viewed page once authenticated
    const lastPage = localStorage.getItem(`hearthlink-lastpage-${roomId}`);
    if (lastPage) {
      const pageNumber = parseInt(lastPage, 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        setCurrentPage(pageNumber);
      }
    }

    setUsers([currentUser]);

    getRoom(roomId)
      .then(roomData => {
        if (roomData) {
          setRoom(roomData);
        } else {
          throw new Error("Room not found. It might have been deleted or the code is incorrect.");
        }
      })
      .catch(err => {
        console.error("Error loading room or PDF:", err);
        let errorMessage = "Failed to load reading room.";
        if (err.message.includes('offline')) {
            errorMessage = "Could not connect to the database. Please ensure Firestore is enabled and configured correctly in your Firebase project."
        } else if (err.message.includes('Room not found')) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        toast({ variant: "destructive", title: "Error", description: errorMessage });
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [roomId, currentUser, authLoading]);

  // Firestore listeners for real-time collaboration
  useEffect(() => {
    if (!roomId || !currentUser) return;

    // Listener for Annotations
    const annotationsRef = collection(db, 'rooms', roomId, 'annotations');
    const qAnnotations = query(annotationsRef, orderBy('timestamp', 'asc'));
    const unsubscribeAnnotations = onSnapshot(qAnnotations, (snapshot) => {
        const fetchedAnnotations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Annotation));
        setAnnotations(fetchedAnnotations);
    }, (err) => {
        console.error("Error fetching annotations:", err);
        toast({ variant: "destructive", title: "Connection Error", description: "Could not sync annotations." });
    });

    // Listener for Highlights
    const highlightsRef = collection(db, 'rooms', roomId, 'highlights');
    const qHighlights = query(highlightsRef, orderBy('timestamp', 'asc'));
    const unsubscribeHighlights = onSnapshot(qHighlights, (snapshot) => {
        const fetchedHighlights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Highlight));
        setHighlights(fetchedHighlights);
    }, (err) => {
        console.error("Error fetching highlights:", err);
        toast({ variant: "destructive", title: "Connection Error", description: "Could not sync highlights." });
    });

     // Listener for Chat Messages
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const qMessages = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(fetchedMessages);
    });

    // Listener for Bookmarks
    const bookmarksRef = collection(db, 'rooms', roomId, 'bookmarks');
    const qBookmarks = query(bookmarksRef, orderBy('pageNumber', 'asc'));
    const unsubscribeBookmarks = onSnapshot(qBookmarks, (snapshot) => {
        const fetchedBookmarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
        setBookmarks(fetchedBookmarks);
    }, (err) => {
        console.error("Error fetching bookmarks:", err);
        toast({ variant: "destructive", title: "Connection Error", description: "Could not sync bookmarks." });
    });


    return () => {
        unsubscribeAnnotations();
        unsubscribeHighlights();
        unsubscribeMessages();
        unsubscribeBookmarks();
    };
  }, [roomId, currentUser]);

  const addAnnotation = async (annotation: Omit<Annotation, 'id' | 'userId' | 'userName' | 'timestamp' | 'color'>) => {
    if (!currentUser || !roomId) return;
    try {
      const annotationsRef = collection(db, 'rooms', roomId, 'annotations');
      await addDoc(annotationsRef, {
        ...annotation,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: Date.now(),
        color: currentUser.color,
      });
      addMessage({type: 'system', message: `${currentUser.name} added an annotation on page ${annotation.pageNumber}.`})
    } catch (error) {
        console.error("Error adding annotation:", error);
        toast({ variant: "destructive", title: "Sync Error", description: "Could not save annotation." });
    }
  };

  const addHighlight = async (highlight: Omit<Highlight, 'id' | 'userId' | 'userName' | 'timestamp' | 'color'>) => {
    if (!currentUser || !roomId) return;
    try {
        const highlightsRef = collection(db, 'rooms', roomId, 'highlights');
        await addDoc(highlightsRef, {
          ...highlight,
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: Date.now(),
          color: highlightColor,
        });
    } catch (error) {
        console.error("Error adding highlight:", error);
        toast({ variant: "destructive", title: "Sync Error", description: "Could not save highlight." });
    }
  }

  const addMessage = async (message: { type: 'text' | 'system', message: string }) => {
    if (!currentUser || !roomId) return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    
    await addDoc(messagesRef, {
      type: message.type,
      userId: message.type === 'system' ? 'system' : currentUser.id,
      userName: message.type === 'system' ? 'System' : currentUser.name,
      message: message.message,
      timestamp: Date.now(),
    });
  };

  const toggleBookmark = async () => {
    if (!currentUser || !roomId) return;

    const existingBookmark = bookmarks.find(b => b.pageNumber === currentPage);

    try {
        if (existingBookmark) {
            // Remove bookmark
            const bookmarkRef = collection(db, 'rooms', roomId, 'bookmarks');
            const q = query(bookmarkRef, where("pageNumber", "==", currentPage), where("userId", "==", currentUser.id));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });
            toast({ title: "Bookmark Removed", description: `Page ${currentPage} removed from bookmarks.` });
        } else {
            // Add bookmark
            const bookmarksRef = collection(db, 'rooms', roomId, 'bookmarks');
            await addDoc(bookmarksRef, {
                userId: currentUser.id,
                userName: currentUser.name,
                pageNumber: currentPage,
                timestamp: Date.now(),
            });
            toast({ title: "Bookmarked!", description: `Page ${currentPage} has been added to bookmarks.` });
        }
    } catch (error) {
        console.error("Error toggling bookmark:", error);
        toast({ variant: "destructive", title: "Sync Error", description: "Could not update bookmark." });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !room) return;

    if (file.name !== room.pdfName) {
      const errorMsg = `Incorrect file. Please select "${room.pdfName}".`;
      setUploadError(errorMsg);
      toast({ variant: "destructive", title: "Wrong File", description: errorMsg });
      return;
    }

    setUploadError(null);
    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDataCopy = arrayBuffer.slice(0); // Create a copy for the viewer
      setPdfData(pdfDataCopy);
      
      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
    } catch (err) {
      console.error("Error loading local PDF:", err);
      const errorMsg = "Could not read the selected PDF file.";
      setUploadError(errorMsg);
      toast({ variant: "destructive", title: "PDF Error", description: errorMsg });
    } finally {
      setIsLoading(false);
    }
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Card className="w-full max-w-lg shadow-xl text-center">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-destructive">Error Loading Room</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => window.location.href = '/'} className="mt-4">Back to Welcome Page</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pdfData) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Load Your Book</CardTitle>
            <CardDescription>This room is for reading <span className="font-bold text-primary">{room?.pdfName}</span>. Please select it from your device to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground"/>
              <p className="mt-2 font-semibold">Select "{room?.pdfName}"</p>
            </div>
            <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileSelect} className="hidden"/>
            <Button onClick={() => document.getElementById('pdf-upload')?.click()} className="w-full">
              <FileUp className="mr-2 h-4 w-4"/>
              Choose File from Computer
            </Button>
            {uploadError && (
              <p className="text-sm font-medium text-destructive">{uploadError}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPageBookmarked = bookmarks.some(b => b.pageNumber === currentPage);

  return (
    <div className="flex h-screen w-full bg-background font-body text-foreground overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-card/80 p-4 border-r overflow-y-auto hidden md:flex flex-col">
        <div className="mt-8">
            <h3 className="font-headline text-lg font-bold border-b pb-2 mb-2 flex items-center gap-2">
                <BookMarked className="w-5 h-5"/>
                Bookmarks
            </h3>
            <ScrollArea className="h-32">
              <ul className="space-y-1 pr-2">
                {bookmarks.length > 0 ? (
                  bookmarks
                    .sort((a, b) => a.pageNumber - b.pageNumber)
                    .map(bookmark => (
                      <li key={bookmark.id}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-left h-auto py-1"
                          onClick={() => setCurrentPage(bookmark.pageNumber)}
                        >
                          Page {bookmark.pageNumber}
                          <span className="text-muted-foreground ml-auto text-xs">
                            {bookmark.userName.split(' ')[0]}
                          </span>
                        </Button>
                      </li>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center p-4">No bookmarks yet.</p>
                )}
              </ul>
            </ScrollArea>
        </div>

        {pdfDoc && <SmartAnnotations pdfDoc={pdfDoc} currentPage={currentPage} />}

        <div className="mt-auto space-y-4 pt-4">
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
          {numPages > 0 && (
            <p className="text-sm text-muted-foreground">
              {isDualPage
                ? `Pages ${currentPage}-${Math.min(currentPage + 1, numPages)} of ${numPages}`
                : `Page ${currentPage} of ${numPages}`}
            </p>
          )}
        </header>
        <div className="flex-1 relative overflow-hidden">
            <PdfViewer
                pdfData={pdfData}
                currentPage={currentPage}
                zoom={zoom}
                annotations={annotations}
                highlights={highlights}
                addAnnotation={addAnnotation}
                addHighlight={addHighlight}
                currentUser={currentUser}
                onDocumentLoadSuccess={(doc) => setNumPages(doc.numPages)}
                isDualPage={isDualPage}
                numPages={numPages}
                interactionMode={interactionMode}
                highlightColor={highlightColor}
            />
        </div>
        <Toolbar
          currentPage={currentPage}
          numPages={numPages}
          setCurrentPage={setCurrentPage}
          zoom={zoom}
          setZoom={setZoom}
          isDualPage={isDualPage}
          setIsDualPage={setIsDualPage}
          interactionMode={interactionMode}
          setInteractionMode={setInteractionMode}
          toggleBookmark={toggleBookmark}
          isPageBookmarked={isPageBookmarked}
          highlightColor={highlightColor}
          setHighlightColor={setHighlightColor}
        />
      </main>
      <ChatPanel messages={messages} addMessage={addMessage} currentUser={currentUser} />
    </div>
  );
}
