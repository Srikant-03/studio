import RoomPageClient from './page-client';

// The 'searchParams' property is optional in Next.js page props.
// Adding it to the type definition resolves the build error.
export default function RoomPage({ params }: { params: { roomId: string } }) {
  return <RoomPageClient roomId={params.roomId} />;
}
