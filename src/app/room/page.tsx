'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RoomClient from '@/components/hearthlink/RoomClient';

function RoomPageContent() {
    const searchParams = useSearchParams();
    const roomId = searchParams.get('id');

    if (!roomId) {
        return <div>No room ID provided.</div>;
    }

    return <RoomClient roomId={roomId} />;
}

export default function RoomPage() {
    return (
        <Suspense fallback={<div>Loading room...</div>}>
            <RoomPageContent />
        </Suspense>
    );
}
