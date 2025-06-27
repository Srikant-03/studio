import RoomPageClient from './page-client';

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return <RoomPageClient roomId={params.roomId} />;
}
