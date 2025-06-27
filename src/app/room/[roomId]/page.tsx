import { ReadingRoom } from '@/components/hearthlink/ReadingRoom';

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return <ReadingRoom roomId={params.roomId} />;
}
