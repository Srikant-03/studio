"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FireplaceIcon } from "@/components/icons";
import { FileUp, Loader2, Book, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createRoom, joinRoom, getUserRooms } from "@/lib/rooms";
import type { Room } from "@/types/hearthlink";
import { ScrollArea } from "../ui/scroll-area";

export function WelcomePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [userRooms, setUserRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setIsLoadingRooms(true);
      getUserRooms(user.id).then(rooms => {
        setUserRooms(rooms);
        setIsLoadingRooms(false);
      }).catch(err => {
        console.error("Failed to get user rooms", err);
        setIsLoadingRooms(false);
      });
    }
  }, [user]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName && pdfFile && user) {
      setIsCreating(true);
      try {
        const newRoomId = await createRoom(roomName, pdfFile.name, user.id);
        router.push(`/room/${newRoomId}`);
      } catch (error) {
        console.error("Failed to create room:", error);
        alert("Error: Could not create the room. Please try again.");
      } finally {
        setIsCreating(false);
      }
    } else {
      alert("Please provide a room name and select a PDF file.");
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomId && user) {
      setIsJoining(true);
      try {
        const success = await joinRoom(joinRoomId, user.id);
        if (success) {
          router.push(`/room/${joinRoomId}`);
        } else {
          alert("Could not find the room. Please check the code.");
        }
      } catch (error) {
        console.error("Failed to join room:", error);
        alert("Error: Could not join the room. Please try again.");
      } finally {
        setIsJoining(false);
      }
    } else {
      alert("Please enter a room code.");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-4 font-body pt-20">
        <div className="absolute top-4 right-4 flex items-center gap-4">
            <span className="text-sm font-medium">Welcome, {user.name}</span>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
                <LogOut className="h-5 w-5" />
            </Button>
        </div>
      <div className="flex flex-col items-center text-center mb-8">
        <FireplaceIcon className="h-20 w-20 text-primary mb-4" />
        <h1 className="text-5xl font-headline font-bold text-foreground">
          Welcome to HearthLink
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
          Gather around the digital fireplace and share the warmth of reading together. Create a private room, invite your friends, and dive into your favorite books collaboratively.
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Your Bookshelves</CardTitle>
                <CardDescription>Rejoin a reading session.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingRooms ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : userRooms.length > 0 ? (
                    <ScrollArea className="h-64 pr-4">
                        <ul className="space-y-3">
                            {userRooms.map(room => (
                                <li key={room.id}>
                                    <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => router.push(`/room/${room.id}`)}>
                                        <Book className="mr-4 flex-shrink-0" />
                                        <div className="text-left overflow-hidden">
                                            <p className="font-semibold truncate">{room.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{room.pdfName}</p>
                                        </div>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                ) : (
                    <div className="text-muted-foreground text-center h-40 flex items-center justify-center">
                      <p>You haven't joined any rooms yet. <br/> Create one or join one to get started!</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Start a New Session</CardTitle>
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
                    <Input id="room-name" placeholder="e.g., The Midnight Readers" value={roomName} onChange={(e) => setRoomName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf-file">Book (PDF)</Label>
                    <Input id="pdf-file" type="file" accept=".pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setPdfFile(file); } }} required className="hidden" />
                    <Button type="button" variant="outline" className="w-full justify-start text-left font-normal" onClick={() => document.getElementById('pdf-file')?.click()}>
                      <FileUp className="mr-2 h-4 w-4"/>
                      <span className="truncate">{pdfFile ? pdfFile.name : "Select a PDF file"}</span>
                    </Button>
                    <p className="text-xs text-muted-foreground">The book will be available to all members of the room.</p>
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 animate-spin" />}
                    Light a New Fire
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="join">
                <form onSubmit={handleJoinRoom} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-id">Room Code</Label>
                    <Input id="room-id" placeholder="Enter room code" value={joinRoomId} onChange={(e) => setJoinRoomId(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={isJoining}>
                    {isJoining && <Loader2 className="mr-2 animate-spin" />}
                    Join the Fireside
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <footer className="mt-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} HearthLink. All rights reserved.</p>
      </footer>
    </div>
  );
}
