-- Preserve customer details before removing the customer-account relation.
ALTER TABLE "CustomerProfile"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "phone" TEXT;

UPDATE "CustomerProfile" AS customer
SET
  "firstName" = account."firstName",
  "lastName" = account."lastName",
  "phone" = account."phone"
FROM "User" AS account
WHERE customer."userId" = account."id";

ALTER TABLE "CustomerProfile"
  ALTER COLUMN "firstName" SET NOT NULL,
  ALTER COLUMN "lastName" SET NOT NULL,
  ALTER COLUMN "phone" SET NOT NULL;

ALTER TABLE "CustomerProfile"
  DROP CONSTRAINT "CustomerProfile_userId_fkey";

DROP INDEX "CustomerProfile_userId_key";

ALTER TABLE "CustomerProfile" DROP COLUMN "userId";

CREATE UNIQUE INDEX "CustomerProfile_organizationId_phone_key"
  ON "CustomerProfile"("organizationId", "phone");

-- Anonymous requests have no authenticated creator. History may also start with
-- an anonymous REQUESTED event.
ALTER TABLE "Booking" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "BookingHistory" ALTER COLUMN "changedById" DROP NOT NULL;
ALTER TABLE "IdempotencyKey" ALTER COLUMN "userId" DROP NOT NULL;

-- Remove obsolete customer memberships without deleting customer or booking data,
-- then narrow the authorization enum to staff accounts only.
DELETE FROM "Membership" WHERE "role" = 'CUSTOMER';

CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'STAFF');
ALTER TABLE "Membership"
  ALTER COLUMN "role" TYPE "Role_new"
  USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";

-- Both pending and confirmed requests reserve the master's full occupied range.
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_staff_time_no_overlap";
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_staff_time_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tsrange("startAt", "occupiedUntil", '[)') WITH &&
  ) WHERE ("status" IN ('PENDING', 'CONFIRMED'));
