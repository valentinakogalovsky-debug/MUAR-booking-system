-- A public booking starts as a request and blocks the chosen slot immediately.
-- PostgreSQL requires a new enum value to be committed before another migration
-- can use it in a default value or constraint predicate.
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'CONFIRMED';
