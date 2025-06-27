"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FireplaceIcon } from "@/components/icons";
import { FileUp } from "lucide-react";

export function WelcomePage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [expectedPdfName, setExpectedPdfName] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName && pdfFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const pdfDataUrl = event.target?.result as string;
        const roomId = Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem(`pdf_${roomId}`, pdfDataUrl);
        sessionStorage.setItem(`pdf_name_${roomId}`, pdfFile.name);
        sessionStorage.setItem(`room_name_${roomId}`, roomName);
        router.push(`/room/${roomId}`);
      };
      reader.readAsDataURL(pdfFile);
    } else {
      alert("Please provide a room name and select a PDF file.");
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomId) {
      router.push(`/room/${joinRoomId}`);
    } else {
      alert("Please enter a room code.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 font-body">
      <div className="flex flex-col items-center text-center mb-8">
        <FireplaceIcon className="h-20 w-20 text-primary mb-4" />
        <h1 className="text-5xl font-headline font-bold text-foreground">
          Welcome to HearthLink
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
          Gather around the digital fireplace and share the warmth of reading together. Create a private room, invite your friends, and dive into your favorite books collaboratively.
        </p>
      </div>

      <Card className="w-full max-w-lg shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Start a Reading Session</CardTitle>
          <CardDescription>Light a new fire or join an existing one.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Room</TabsTrigger>
              <TabsTrigger value="join">Join Room</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <form onSubmit={handleCreateRoom} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input 
                    id="room-name" 
                    placeholder="e.g., The Midnight Readers" 
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf-file">Book (PDF)</Label>
                  <Input 
                    id="pdf-file" 
                    type="file" 
                    accept=".pdf" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPdfFile(file);
                        setExpectedPdfName(file.name);
                      }
                    }}
                    required
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal"
                    onClick={() => document.getElementById('pdf-file')?.click()}
                  >
                    <FileUp className="mr-2 h-4 w-4"/>
                    {pdfFile ? pdfFile.name : "Select a PDF file"}
                  </Button>
                  <p className="text-xs text-muted-foreground">Everyone in the room must upload the identical PDF file.</p>
                </div>
                <Button type="submit" className="w-full font-bold">Light a New Fire</Button>
              </form>
            </TabsContent>
            <TabsContent value="join">
              <form onSubmit={handleJoinRoom} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="room-id">Room Code</Label>
                  <Input 
                    id="room-id" 
                    placeholder="Enter room code" 
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full font-bold">Join the Fireside</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <footer className="mt-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} HearthLink. All rights reserved.</p>
      </footer>
    </div>
  );
}
