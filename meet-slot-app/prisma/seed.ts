// Standalone script (run via `npm run db:seed`), so it talks to Prisma/bcrypt directly
// instead of importing app code that depends on the Next.js server runtime.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { OFFICE_TIMEZONE } from '../lib/time';

const db = new PrismaClient();

const ROOMS = [
  { name: 'Акваріум', floor: 1, capacity: 4 },
  { name: 'Атлантика', floor: 1, capacity: 10 },
  { name: 'Марс', floor: 2, capacity: 8 },
  { name: 'Гагарін', floor: 2, capacity: 12 },
  { name: 'Юпітер', floor: 3, capacity: 6 },
  { name: 'Меркурій', floor: 3, capacity: 4 },
];

const TEST_USERS = [
  { name: 'Іван Петренко', email: 'ivan@example.com', password: 'password123' },
  { name: 'Олена Коваль', email: 'olena@example.com', password: 'password123' },
];

/** Kyiv's UTC offset (in minutes) for a given instant — varies with DST. */
function getKyivOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: OFFICE_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return (asUtc - date.getTime()) / 60_000;
}

/** Converts a Kyiv wall-clock time (`daysFromToday` days from now) to the matching UTC instant. */
function kyivTimeInDays(daysFromToday: number, hour: number, minute: number): Date {
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + daysFromToday);
  const guess = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hour, minute));
  const offsetMinutes = getKyivOffsetMinutes(guess);
  return new Date(guess.getTime() - offsetMinutes * 60_000);
}

async function main() {
  const rooms = new Map<string, string>();
  for (const room of ROOMS) {
    const created = await db.room.upsert({
      where: { name: room.name },
      update: { floor: room.floor, capacity: room.capacity },
      create: room,
    });
    rooms.set(room.name, created.id);
  }
  console.log(`Seeded ${rooms.size} rooms`);

  const users = new Map<string, string>();
  for (const testUser of TEST_USERS) {
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    const created = await db.user.upsert({
      where: { email: testUser.email },
      update: { name: testUser.name, passwordHash, isEmailVerified: true },
      create: { name: testUser.name, email: testUser.email, passwordHash, isEmailVerified: true },
    });
    users.set(testUser.email, created.id);
  }
  console.log(`Seeded ${users.size} test users`);

  const userIds = [...users.values()];
  await db.booking.deleteMany({ where: { userId: { in: userIds } } });

  const demoBookings = [
    // Past — populates the "Минулі" tab on the My Bookings page.
    { room: 'Акваріум', user: 0, daysFromToday: -5, hour: 10, minute: 0, durationMinutes: 60, title: "Рев'ю спринту" },
    { room: 'Марс', user: 1, daysFromToday: -3, hour: 14, minute: 0, durationMinutes: 60, title: 'Дзвінок з клієнтом' },
    // Upcoming — populates the room schedule grid and "Майбутні" tab.
    { room: 'Гагарін', user: 0, daysFromToday: 1, hour: 10, minute: 0, durationMinutes: 90, title: 'Планування спринту' },
    { room: 'Акваріум', user: 1, daysFromToday: 1, hour: 15, minute: 0, durationMinutes: 60, title: '1:1 з менеджером' },
    { room: 'Юпітер', user: 0, daysFromToday: 3, hour: 9, minute: 30, durationMinutes: 60, title: 'Демо нової фічі' },
    { room: 'Марс', user: 1, daysFromToday: 4, hour: 13, minute: 0, durationMinutes: 60, title: 'Співбесіда' },
  ];

  for (const booking of demoBookings) {
    const startTime = kyivTimeInDays(booking.daysFromToday, booking.hour, booking.minute);
    const endTime = new Date(startTime.getTime() + booking.durationMinutes * 60_000);
    await db.booking.create({
      data: {
        title: booking.title,
        startTime,
        endTime,
        roomId: rooms.get(booking.room)!,
        userId: userIds[booking.user],
      },
    });
  }
  console.log(`Seeded ${demoBookings.length} demo bookings`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
