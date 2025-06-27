"use client";

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, User } from '@/types/hearthlink';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatPanelProps {
  messages: ChatMessage[];
  addMessage: (message: { type: 'text' | 'system', message: string }) => void;
  currentUser: User | null;
}

export function ChatPanel({ messages, addMessage, currentUser }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      addMessage({ type: 'text', message: newMessage });
      setNewMessage('');
    }
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-card/80 border-l flex flex-col h-full">
      <h2 className="font-headline text-xl font-bold p-4 border-b">Fireside Chat</h2>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-3 text-sm",
                msg.type === 'system' && "justify-center text-muted-foreground italic",
                msg.userId === currentUser?.id && "justify-end"
              )}
            >
              {msg.type === 'text' && msg.userId !== currentUser?.id && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback style={{ backgroundColor: `hsl(${msg.id.length * 20}, 70%, 80%)`}}>
                    {msg.userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                "max-w-[75%]",
                 msg.userId === currentUser?.id && "text-right"
              )}>
                {msg.type === 'text' && (
                  <p className="font-bold text-xs" style={{ color: `hsl(${msg.id.length * 20}, 60%, 40%)`}}>{msg.userName}</p>
                )}
                <div className={cn(
                    "p-2 rounded-lg",
                    msg.type === 'text' && (msg.userId === currentUser?.id ? "bg-primary text-primary-foreground" : "bg-muted")
                )}>
                  <p>{msg.message}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Share your thoughts..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" variant="ghost">
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
