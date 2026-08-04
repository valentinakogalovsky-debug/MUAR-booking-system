import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import {
  BookingSource,
  BookingStatus,
  PrismaClient,
  Role,
  ScheduleType,
  ServiceCategory,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const organizationId = "5eacb202-9b01-4aaf-bc8b-b66a2d6f5c01";
const bookingId = "a040d71a-66bd-4a94-a282-0ef1f9ee1030";

const services = [
  [ServiceCategory.MANICURE, "Аппаратный маникюр без покрытия", 60, 2500],
  [ServiceCategory.MANICURE, "Мужской маникюр", 60, 2500],
  [ServiceCategory.MANICURE, "Комбинированный маникюр без покрытия", 180, 5000],
  [ServiceCategory.MANICURE, "Комбинированный маникюр с покрытием гель-лаком", 180, 7000],
  [ServiceCategory.MANICURE, "Маникюр с покрытием гель-лак", 90, 3500],
  [ServiceCategory.MANICURE, "Маникюр с укреплением базой/гелем", 60, 4200],
  [ServiceCategory.PEDICURE, "Аппаратный педикюр без покрытия", 60, 3800],
  [ServiceCategory.PEDICURE, "Педикюр с покрытием", 90, 4800],
  [ServiceCategory.PEDICURE, "Экспресс-педикюр — пальчики", 60, 3200],
  [ServiceCategory.PEDICURE, "SPA-педикюр премиум", 180, 6000],
] as const;

const legacyServiceNames = new Map([
  ["Аппаратный маникюр без покрытия", "Аппаратный маникюр (без покрытия)"],
  ["Комбинированный маникюр без покрытия", "Комбинированный маникюр (без покрытия)"],
  ["Аппаратный педикюр без покрытия", "Аппаратный педикюр (без покрытия)"],
  ["Экспресс-педикюр — пальчики", "Экспресс-педикюр (пальчики)"],
]);

const addons = [
  { name: "Снятие своего покрытия", isIncluded: true },
  { name: "Снятие чужого покрытия", priceMinor: 80000 },
  { name: "Выравнивание базой", minimumPriceMinor: 70000 },
  { name: "Френч / молочный / камуфляж", priceMinor: 50000 },
  { name: "Дизайн за 1 ноготь", minimumPriceMinor: 25000 },
  { name: "Втирка / фольга (все ногти)", priceMinor: 80000 },
  { name: "Слайдеры / стемпинг", minimumPriceMinor: 40000 },
  { name: "Ручная роспись (за ноготь)", minimumPriceMinor: 50000 },
  { name: "Стразы / инкрустация", minimumPriceMinor: 30000 },
] as const;

const masters = [
  {
    firstName: "Галина",
    lastName: "Иванова",
    phone: "+79000000001",
    slug: "galina-ivanova",
    anchorDate: "2026-08-01",
  },
  {
    firstName: "Надежда",
    lastName: "Петрова",
    phone: "+79000000002",
    slug: "nadezhda-petrova",
    anchorDate: "2026-08-01",
  },
  {
    firstName: "Светлана",
    lastName: "Винокурова",
    phone: "+79000000003",
    slug: "svetlana-vinokurova",
    anchorDate: "2026-08-03",
  },
  {
    firstName: "Ксения",
    lastName: "Скобеева",
    phone: "+79000000004",
    slug: "kseniya-skobeeva",
    anchorDate: "2026-08-03",
  },
] as const;

async function main() {
  const seedStaffPassword = process.env.SEED_STAFF_PASSWORD;
  const passwordHash = seedStaffPassword ? await hash(seedStaffPassword, 12) : undefined;
  const organization = await prisma.organization.upsert({
    where: { slug: "muare" },
    update: {
      name: "MUARÉ",
      timezone: "Europe/Moscow",
      address: "Брянск, ул. Куйбышева, 7",
      phone: "+79038184486",
    },
    create: {
      id: organizationId,
      slug: "muare",
      name: "MUARÉ",
      timezone: "Europe/Moscow",
      address: "Брянск, ул. Куйбышева, 7",
      phone: "+79038184486",
    },
  });

  await prisma.organizationSettings.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: { organizationId: organization.id },
  });

  await ensureAdmin("+79038184486", passwordHash);
  const customerProfile = await prisma.customerProfile.upsert({
    where: {
      organizationId_phone: {
        organizationId: organization.id,
        phone: "+79000000010",
      },
    },
    update: { firstName: "Тестовый", lastName: "Клиент" },
    create: {
      organizationId: organization.id,
      firstName: "Тестовый",
      lastName: "Клиент",
      phone: "+79000000010",
    },
  });

  const createdServices = [];
  for (const [category, name, durationMinutes, priceRubles] of services) {
    const existingService = await prisma.service.findFirst({
      where: {
        organizationId: organization.id,
        name: { in: [name, legacyServiceNames.get(name)].filter((item): item is string => !!item) },
      },
    });
    createdServices.push(
      existingService
        ? await prisma.service.update({
            where: { id: existingService.id },
            data: {
              name,
              category,
              durationMinutes,
              priceMinor: priceRubles * 100,
              isActive: true,
            },
          })
        : await prisma.service.create({
            data: {
              organizationId: organization.id,
              category,
              name,
              durationMinutes,
              priceMinor: priceRubles * 100,
            },
          }),
    );
  }

  for (const addon of addons) {
    await prisma.serviceAddon.upsert({
      where: { organizationId_name: { organizationId: organization.id, name: addon.name } },
      update: { ...addon, affectsDuration: false, isActive: true },
      create: { organizationId: organization.id, ...addon, affectsDuration: false },
    });
  }

  const staff = [];
  for (const master of masters) {
    const user = await upsertUser(
      master.firstName,
      master.lastName,
      master.phone,
      Role.STAFF,
      passwordHash,
    );
    const profile = await prisma.staffProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: `${master.firstName} ${master.lastName}`,
        slug: master.slug,
        isActive: true,
      },
      create: {
        organizationId: organization.id,
        userId: user.id,
        displayName: `${master.firstName} ${master.lastName}`,
        slug: master.slug,
      },
    });
    staff.push(profile);
    await ensureRotatingSchedule(profile.id, master.anchorDate);
  }

  const tatyanaUser = await upsertUser(
    "Татьяна",
    "Кравченко",
    "+79000000005",
    Role.STAFF,
    passwordHash,
  );
  const tatyana = await prisma.staffProfile.upsert({
    where: { userId: tatyanaUser.id },
    update: { displayName: "Татьяна Кравченко", slug: "tatyana-kravchenko", isActive: true },
    create: {
      organizationId: organization.id,
      userId: tatyanaUser.id,
      displayName: "Татьяна Кравченко",
      slug: "tatyana-kravchenko",
    },
  });
  staff.push(tatyana);

  for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek += 1) {
    const exists = await prisma.schedulePattern.findFirst({
      where: { staffId: tatyana.id, type: ScheduleType.WEEKLY, dayOfWeek },
    });
    if (!exists) {
      await prisma.schedulePattern.create({
        data: {
          organizationId: organization.id,
          staffId: tatyana.id,
          type: ScheduleType.WEEKLY,
          dayOfWeek,
          workingCycleDays: [],
          startMinute: 540,
          endMinute: 1080,
          validFrom: new Date("2026-08-01T00:00:00.000Z"),
        },
      });
    }
  }

  for (const profile of staff) {
    for (const service of createdServices) {
      await prisma.staffService.upsert({
        where: { staffId_serviceId: { staffId: profile.id, serviceId: service.id } },
        update: {},
        create: { staffId: profile.id, serviceId: service.id },
      });
    }
  }

  const testService = createdServices.find(
    (service) => service.name === "Маникюр с покрытием гель-лак",
  );
  if (!testService) throw new Error("Test service was not created");

  await prisma.booking.upsert({
    where: { id: bookingId },
    update: {
      createdById: null,
      status: BookingStatus.PENDING,
      source: BookingSource.CUSTOMER,
    },
    create: {
      id: bookingId,
      organizationId: organization.id,
      customerId: customerProfile.id,
      staffId: staff[0].id,
      createdById: null,
      startAt: new Date("2026-08-01T06:00:00.000Z"),
      endAt: new Date("2026-08-01T07:30:00.000Z"),
      occupiedUntil: new Date("2026-08-01T07:45:00.000Z"),
      status: BookingStatus.PENDING,
      source: BookingSource.CUSTOMER,
      totalPriceMinor: testService.priceMinor,
      services: {
        create: {
          serviceId: testService.id,
          position: 1,
          nameSnapshot: testService.name,
          durationMinutesSnapshot: testService.durationMinutes,
          priceMinorSnapshot: testService.priceMinor,
        },
      },
      history: {
        create: { action: "REQUESTED", newData: { source: "SEED" } },
      },
    },
  });

  console.info(
    `Seed complete: ${organization.name}, ${createdServices.length} services, ${staff.length} masters`,
  );
}

async function upsertUser(
  firstName: string,
  lastName: string,
  phone: string,
  role: Role,
  passwordHash?: string,
) {
  const user = await prisma.user.upsert({
    where: { phone },
    update: { firstName, lastName, ...(passwordHash ? { passwordHash } : {}) },
    create: { firstName, lastName, phone, passwordHash },
  });
  await prisma.membership.upsert({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    update: { role },
    create: { organizationId, userId: user.id, role },
  });
  return user;
}

async function ensureAdmin(phone: string, passwordHash?: string) {
  const existingAdmin = await prisma.membership.findFirst({
    where: { organizationId, role: Role.ADMIN },
    select: { userId: true },
  });

  if (existingAdmin) {
    return prisma.user.update({
      where: { id: existingAdmin.userId },
      data: {
        firstName: "Администратор",
        lastName: "MUARÉ",
        phone,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
  }

  return upsertUser("Администратор", "MUARÉ", phone, Role.ADMIN, passwordHash);
}

async function ensureRotatingSchedule(staffId: string, anchorDate: string) {
  const existing = await prisma.schedulePattern.findFirst({
    where: { staffId, type: ScheduleType.ROTATING },
  });
  if (existing) return;
  await prisma.schedulePattern.create({
    data: {
      organizationId,
      staffId,
      type: ScheduleType.ROTATING,
      anchorDate: new Date(`${anchorDate}T00:00:00.000Z`),
      cycleLengthDays: 4,
      workingCycleDays: [0, 1],
      startMinute: 540,
      endMinute: 1200,
      validFrom: new Date("2026-08-01T00:00:00.000Z"),
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
