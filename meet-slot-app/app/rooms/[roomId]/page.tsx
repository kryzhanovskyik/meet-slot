import { RoomSchedule } from '@/components/room-schedule';

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { roomId } = await params;
  const { week } = await searchParams;
  return <RoomSchedule roomId={roomId} initialWeek={week} />;
}
