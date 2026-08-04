# MUARÉ — Data Model

Версия: 1.1
Источник реализации: `prisma/schema.prisma`

## 1. Контекст

Одна организация в MVP, но все рабочие данные имеют `organizationId`. PostgreSQL используется для транзакций, связей и ограничения пересекающихся интервалов.

## 2. Сущности

### Доступ

- `Organization`, `OrganizationSettings`
- `User`, `Membership`
- `Account`, `Session`, `VerificationToken`

`User` используется только администратором и мастерами. `Role`: `ADMIN`, `STAFF`.

### Каталог и люди

- `StaffProfile`
- `CustomerProfile` — имя, фамилия и телефон без связи с User
- `Service`, `ServiceAddon`, `StaffService`

### Расписание

- `SchedulePattern` — WEEKLY или ROTATING
- `AvailabilityException` — AVAILABLE или UNAVAILABLE

### Запись

- `Booking`
- `BookingService`
- `BookingHistory`
- `IdempotencyKey`
- `AuditLog`

## 3. Ключевые поля Booking

`startAt` — начало процедуры.
`endAt` — окончание процедуры.
`occupiedUntil` — окончание технического перерыва.
`status` — по умолчанию `PENDING`.
`createdById` — optional: публичная заявка не имеет пользователя.
`totalPriceMinor` — целое число копеек.

## 4. Ограничения

- уникальный клиент по `[organizationId, phone]`;
- уникальный мастер по `[organizationId, slug]`;
- уникальная услуга и дополнение по организации и названию;
- положительная длительность и цена;
- `endAt > startAt`, `occupiedUntil >= endAt`;
- `PENDING` и `CONFIRMED` одного мастера не могут пересекаться по `tstzrange`.

## 5. Удаление

Рабочие сущности используют `Restrict`. Cascade допустим только для технических зависимостей, которые не имеют смысла без родителя, например связей мастер–услуга и позиций бронирования.

## 6. Миграции

1. `20260721202954_init`
2. `20260722135007_simplify_customer_requests`
3. `20260722135008_decouple_customer_accounts`
4. `20260804133000_use_timestamptz`

Моменты времени хранятся как `timestamptz`; календарные опорные даты графиков — как `date`.

Применённые миграции не редактируются. Новое изменение схемы требует новой миграции.
