import 'dotenv/config'
import { PrismaClient, type Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'

// Deterministic ids keep re-seeding idempotent (upsert by id) without needing
// extra unique constraints. Demo tenant: one provider, two branches, three
// categories, six vehicles, one customer + one provider user.
const prisma = new PrismaClient()

const PROVIDER_ID = 'demo-provider'

async function main() {
  const passwordHash = bcrypt.hashSync('Password123!', 10)

  // Shipped racing-red brand (matches @car-rental/tokens). Kept in `update` too so
  // re-seeding an existing demo tenant refreshes the brand from blue → red.
  const colors = { primary: '#E5322B', primaryDark: '#C9261E', background: '#0A0A0B' }
  const provider = await prisma.provider.upsert({
    where: { id: PROVIDER_ID },
    // Re-seeding resets the full demo brand (name/logo/colors), so a demo run
    // always starts from a clean, known state even after branding edits.
    update: { name: 'DemoRent', logoUrl: null, colors },
    create: {
      id: PROVIDER_ID,
      name: 'DemoRent',
      logoUrl: null,
      colors,
      defaultLocale: 'EN',
    },
  })

  await prisma.businessSettings.upsert({
    where: { providerId: provider.id },
    update: {},
    create: {
      providerId: provider.id,
      taxRatePct: '5.00',
      currency: 'AED',
      minRentalDays: 1,
      cancellationPolicy: 'Free cancellation up to 24h before pickup.',
      planMultipliers: { daily: 1, weekly: 0.9, monthly: 0.8, 'long-term': 0.7 },
    },
  })

  const branches = [
    {
      id: 'branch-downtown',
      name: 'Downtown Branch',
      address: 'Sheikh Zayed Rd, Dubai',
      lat: 25.2048,
      lng: 55.2708,
      hours: '08:00-20:00',
    },
    {
      id: 'branch-airport',
      name: 'Airport Branch',
      address: 'DXB Terminal 3, Dubai',
      lat: 25.2528,
      lng: 55.3644,
      hours: '24/7',
    },
  ]
  for (const b of branches) {
    await prisma.branch.upsert({
      where: { id: b.id },
      update: {},
      create: { ...b, providerId: provider.id },
    })
  }

  // Category names stay within the @car-rental/types VehicleCategory union.
  const categories = [
    { id: 'cat-economy', name: 'economy' },
    { id: 'cat-suv', name: 'suv' },
    { id: 'cat-luxury', name: 'luxury' },
  ]
  for (const c of categories) {
    await prisma.vehicleCategory.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, providerId: provider.id },
    })
  }

  // Real, model-matching photos via Wikimedia Commons' stable Special:FilePath
  // endpoint (`?width=` returns a CDN-resized JPEG) — one representative shot per
  // model, so a card/detail image actually shows that brand + model.
  const carPhoto = (file: string) => [
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=800`,
  ]
  const vehicles: Array<Prisma.VehicleCreateInput & { id: string }> = [
    mkVehicle('veh-corolla', 'Toyota Corolla', 'cat-economy', 'AUTOMATIC', 'PETROL', 5, '120.00', carPhoto('Toyota_Corolla_Hybrid_(E210)_IMG_4338.jpg')),
    mkVehicle('veh-sunny', 'Nissan Sunny', 'cat-economy', 'AUTOMATIC', 'PETROL', 5, '110.00', carPhoto('NISSAN_Sunny_B13.jpg')),
    mkVehicle('veh-rav4', 'Toyota RAV4', 'cat-suv', 'AUTOMATIC', 'PETROL', 5, '220.00', carPhoto('2024_Toyota_RAV4_Prime_XSE_Premium_in_Silver_Sky_with_Midnight_Black_roof,_front_left.jpg')),
    mkVehicle('veh-patrol', 'Nissan Patrol', 'cat-suv', 'AUTOMATIC', 'PETROL', 7, '400.00', carPhoto('2016_Nissan_Patrol_(Y62)_Ti-L_wagon_(2018-09-17)_01.jpg')),
    mkVehicle('veh-eclass', 'Mercedes E-Class', 'cat-luxury', 'AUTOMATIC', 'PETROL', 5, '600.00', carPhoto('Mercedes-Benz_W214_1X7A1841.jpg')),
    mkVehicle('veh-model3', 'Tesla Model 3', 'cat-luxury', 'AUTOMATIC', 'ELECTRIC', 5, '500.00', carPhoto('Tesla_Model_3_(2023)_Autofrühling_Ulm_IMG_9282.jpg')),
  ]
  for (const v of vehicles) {
    // Refresh images on re-seed (existing rows keep their bookings) — the empty
    // `update: {}` previously left stale placeholder photos in place.
    await prisma.vehicle.upsert({ where: { id: v.id }, update: { images: v.images }, create: v })
  }

  await prisma.user.upsert({
    where: { email: 'customer@demo.test' },
    update: {},
    create: {
      id: 'user-customer',
      role: 'CUSTOMER',
      email: 'customer@demo.test',
      passwordHash,
      name: 'Demo Customer',
      phone: '+971500000001',
      locale: 'EN',
      licenseNumber: 'DXB-LIC-0001',
    },
  })

  await prisma.user.upsert({
    where: { email: 'provider@demo.test' },
    update: {},
    create: {
      id: 'user-provider',
      providerId: provider.id,
      role: 'SERVICE_PROVIDER',
      email: 'provider@demo.test',
      passwordHash,
      name: 'Demo Provider Admin',
      phone: '+971500000002',
      locale: 'EN',
    },
  })

  // Demo bookings spanning the lifecycle so every screen opens populated. On
  // non-corolla vehicles with near-now dates, so they never collide with the
  // integration tests (which use veh-corolla and far-future windows).
  const now = new Date()
  const addDays = (n: number) => new Date(now.getTime() + n * 86_400_000)
  const priceOf = (perDay: number, start: Date, end: Date) => {
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000))
    const subtotal = perDay * days
    const tax = Math.round(subtotal * 5) / 100
    return { subtotal: subtotal.toFixed(2), tax: tax.toFixed(2), total: (subtotal + tax).toFixed(2) }
  }

  type BookingStatus = 'RESERVED' | 'CONFIRMED' | 'VEHICLE_PREPARED' | 'PICKED_UP' | 'COMPLETED'
  const demoBookings: Array<{
    id: string
    vehicleId: string
    perDay: number
    start: Date
    end: Date
    status: BookingStatus
    paid: boolean
    prepReadyAt?: Date
  }> = [
    { id: 'bk-reserved', vehicleId: 'veh-model3', perDay: 500, start: addDays(14), end: addDays(17), status: 'RESERVED', paid: false },
    { id: 'bk-confirmed', vehicleId: 'veh-sunny', perDay: 110, start: addDays(3), end: addDays(6), status: 'CONFIRMED', paid: true },
    { id: 'bk-prepared', vehicleId: 'veh-rav4', perDay: 220, start: addDays(1), end: addDays(4), status: 'VEHICLE_PREPARED', paid: true, prepReadyAt: addDays(1) },
    { id: 'bk-pickedup', vehicleId: 'veh-patrol', perDay: 400, start: addDays(-1), end: addDays(2), status: 'PICKED_UP', paid: true },
    { id: 'bk-completed', vehicleId: 'veh-eclass', perDay: 600, start: addDays(-10), end: addDays(-7), status: 'COMPLETED', paid: true },
  ]

  for (const b of demoBookings) {
    const p = priceOf(b.perDay, b.start, b.end)
    await prisma.booking.upsert({
      where: { id: b.id },
      update: { status: b.status },
      create: {
        id: b.id,
        customerId: 'user-customer',
        providerId: provider.id,
        vehicleId: b.vehicleId,
        pickupBranchId: 'branch-downtown',
        dropoffBranchId: 'branch-airport',
        plan: 'DAILY',
        startAt: b.start,
        endAt: b.end,
        status: b.status,
        subtotal: p.subtotal,
        tax: p.tax,
        total: p.total,
        currency: 'AED',
        discountAmount: '0',
        prepReadyAt: b.prepReadyAt ?? null,
      },
    })

    if (b.paid) {
      await prisma.payment.upsert({
        where: { id: `pay-${b.id}` },
        update: {},
        create: {
          id: `pay-${b.id}`,
          bookingId: b.id,
          method: 'CARD_MOCK',
          status: 'PAID',
          amount: p.total,
          gatewayRef: `mock_${b.id}`,
        },
      })
    }
  }

  // Signed contracts for bookings already picked up / completed.
  for (const bookingId of ['bk-pickedup', 'bk-completed']) {
    await prisma.contract.upsert({
      where: { bookingId },
      update: {},
      create: {
        bookingId,
        content:
          'RENTAL AGREEMENT\n\nDemo rental contract. The renter accepts the terms and confirms the booking details above.',
        signedAt: now,
        signerName: 'Demo Customer',
        signedConsent: true,
      },
    })
  }

  // Return inspection + rating for the completed rental (history + ratings demo).
  await prisma.returnInspection.upsert({
    where: { bookingId: 'bk-completed' },
    update: {},
    create: {
      bookingId: 'bk-completed',
      inspectorId: 'user-provider',
      condition: 'CLEAN',
      notes: 'Returned clean, full tank.',
      inspectedAt: addDays(-7),
    },
  })
  await prisma.rating.upsert({
    where: { bookingId: 'bk-completed' },
    update: {},
    create: {
      bookingId: 'bk-completed',
      customerId: 'user-customer',
      vehicleRating: 5,
      serviceRating: 4,
      comment: 'Excellent car, smooth keyless pickup.',
    },
  })
}

function mkVehicle(
  id: string,
  name: string,
  categoryId: string,
  transmission: Prisma.VehicleCreateInput['transmission'],
  fuelType: Prisma.VehicleCreateInput['fuelType'],
  seats: number,
  pricePerDay: string,
  images: string[],
): Prisma.VehicleCreateInput & { id: string } {
  return {
    id,
    name,
    transmission,
    fuelType,
    seats,
    pricePerDay,
    currency: 'AED',
    images,
    provider: { connect: { id: PROVIDER_ID } },
    category: { connect: { id: categoryId } },
  }
}

main()
  .then(() => console.log('✔ seed complete'))
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
