'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ReadingRoom = dynamic(
  () => import('@/components/hearthlink/ReadingRoom').then((mod) => mod.ReadingRoom),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-headline">Warming up the reading space...</p>
      </div>
    ),
  }
);

// This component now correctly handles the props passed by Next.js App Router.
export default function RoomPage({ params }: { params: { roomId: string } }) {
  return <ReadingRoom roomId={params.roomId} />;
}
