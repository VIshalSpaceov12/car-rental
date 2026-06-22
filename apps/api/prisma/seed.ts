import 'dotenv/config'
import { PrismaClient, type Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'
import { carImages } from './carImages'

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

  // Sports-car demo fleet. Category display names are provider-defined (not the
  // @car-rental/types union). `update` refreshes the name so a re-seed renames
  // existing rows.
  const categories = [
    { id: 'cat-economy', name: 'sports' },
    { id: 'cat-suv', name: 'supercar' },
    { id: 'cat-luxury', name: 'hypercar' },
  ]
  for (const c of categories) {
    await prisma.vehicleCategory.upsert({
      where: { id: c.id },
      update: { name: c.name },
      create: { ...c, providerId: provider.id },
    })
  }

  // Sports/supercar demo fleet. Names match the embedded cutout images in
  // `carImages` (transparent PNGs); vehicles without an entry fall back to the
  // card UI's clean car icon (e.g. the Rimac).
  const vehicles: Array<Prisma.VehicleCreateInput & { id: string }> = [
    mkVehicle('veh-corolla', 'BMW M2 Competition', 'cat-economy', 'AUTOMATIC', 'PETROL', 4, '900.00', carImages['veh-corolla'] ?? []),
    mkVehicle('veh-sunny', 'Ferrari 812 Superfast', 'cat-suv', 'AUTOMATIC', 'PETROL', 2, '1200.00', carImages['veh-sunny'] ?? []),
    mkVehicle('veh-rav4', 'Lamborghini Aventador', 'cat-suv', 'AUTOMATIC', 'PETROL', 2, '2200.00', carImages['veh-rav4'] ?? []),
    mkVehicle('veh-patrol', 'Lamborghini Huracán', 'cat-suv', 'AUTOMATIC', 'PETROL', 2, '3500.00', carImages['veh-patrol'] ?? []),
    mkVehicle('veh-eclass', 'Bugatti Chiron', 'cat-luxury', 'AUTOMATIC', 'PETROL', 2, '4000.00', carImages['veh-eclass'] ?? []),
    mkVehicle('veh-model3', 'Rimac Nevera', 'cat-luxury', 'AUTOMATIC', 'ELECTRIC', 2, '9000.00', carImages['veh-model3'] ?? []),
  ]
  for (const v of vehicles) {
    // Re-seed refreshes the mutable card fields on existing rows (bookings are
    // preserved via their own upsert below).
    await prisma.vehicle.upsert({
      where: { id: v.id },
      update: {
        name: v.name,
        pricePerDay: v.pricePerDay,
        seats: v.seats,
        transmission: v.transmission,
        fuelType: v.fuelType,
        category: v.category,
        images: v.images,
      },
      create: v,
    })
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
    { id: 'bk-reserved', vehicleId: 'veh-model3', perDay: 9000, start: addDays(14), end: addDays(17), status: 'RESERVED', paid: false },
    { id: 'bk-confirmed', vehicleId: 'veh-sunny', perDay: 1200, start: addDays(3), end: addDays(6), status: 'CONFIRMED', paid: true },
    { id: 'bk-prepared', vehicleId: 'veh-rav4', perDay: 2200, start: addDays(1), end: addDays(4), status: 'VEHICLE_PREPARED', paid: true, prepReadyAt: addDays(1) },
    { id: 'bk-pickedup', vehicleId: 'veh-patrol', perDay: 3500, start: addDays(-1), end: addDays(2), status: 'PICKED_UP', paid: true },
    { id: 'bk-completed', vehicleId: 'veh-eclass', perDay: 4000, start: addDays(-10), end: addDays(-7), status: 'COMPLETED', paid: true },
  ]

  for (const b of demoBookings) {
    const p = priceOf(b.perDay, b.start, b.end)
    await prisma.booking.upsert({
      where: { id: b.id },
      update: { status: b.status, subtotal: p.subtotal, tax: p.tax, total: p.total },
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
        update: { amount: p.total },
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
