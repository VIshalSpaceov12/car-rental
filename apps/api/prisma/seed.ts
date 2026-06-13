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
    update: { colors },
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

  const img = (seed: string) => [`https://picsum.photos/seed/${seed}/800/600`]
  const vehicles: Array<Prisma.VehicleCreateInput & { id: string }> = [
    mkVehicle('veh-corolla', 'Toyota Corolla', 'cat-economy', 'AUTOMATIC', 'PETROL', 5, '120.00', img('corolla')),
    mkVehicle('veh-sunny', 'Nissan Sunny', 'cat-economy', 'AUTOMATIC', 'PETROL', 5, '110.00', img('sunny')),
    mkVehicle('veh-rav4', 'Toyota RAV4', 'cat-suv', 'AUTOMATIC', 'PETROL', 5, '220.00', img('rav4')),
    mkVehicle('veh-patrol', 'Nissan Patrol', 'cat-suv', 'AUTOMATIC', 'PETROL', 7, '400.00', img('patrol')),
    mkVehicle('veh-eclass', 'Mercedes E-Class', 'cat-luxury', 'AUTOMATIC', 'PETROL', 5, '600.00', img('eclass')),
    mkVehicle('veh-model3', 'Tesla Model 3', 'cat-luxury', 'AUTOMATIC', 'ELECTRIC', 5, '500.00', img('model3')),
  ]
  for (const v of vehicles) {
    await prisma.vehicle.upsert({ where: { id: v.id }, update: {}, create: v })
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
