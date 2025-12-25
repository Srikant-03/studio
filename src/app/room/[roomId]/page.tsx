import RoomClient from '@/components/hearthlink/RoomClient';

// This page component now correctly receives params as a simple object.
// It is no longer an async component, which resolves the build error.
export default function RoomPage({ params }: { params: { roomId: string } }) {
  return <RoomClient roomId={params.roomId} />;
}
