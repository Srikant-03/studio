import RoomClient from '@/components/hearthlink/RoomClient';

export default function RoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  return <RoomClient roomId={params.roomId} />;
}
