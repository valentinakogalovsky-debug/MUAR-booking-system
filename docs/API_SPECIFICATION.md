# MUARÉ — API Specification

Версия: 1.1
Статус: целевой контракт MVP

## 1. Общие правила

JSON, UTF-8, ISO 8601. Защищённые операции используют серверную сессию. Ошибки: `400` validation, `401` unauthenticated, `403` forbidden, `404` private/not found, `409` slot conflict, `429` rate limit.

## 2. Публичное чтение

- `GET /api/services`
- `GET /api/masters?serviceId=`
- `GET /api/availability?serviceId=&staffId=&date=`

Availability возвращает только допустимые начала и публичные данные, без сведений о других клиентах.

## 3. Публичная заявка

`POST /api/booking-requests`

Вход:

```json
{
  "serviceIds": ["uuid"],
  "staffId": "uuid",
  "startAt": "2026-08-10T09:00:00+03:00",
  "customer": {
    "firstName": "Анна",
    "lastName": "Иванова",
    "phone": "+79000000000"
  }
}
```

Заголовок `Idempotency-Key` обязателен. Сервер определяет организацию, длительность, цену, окончание, `occupiedUntil` и статус `PENDING`.

Ответ `201`: id заявки, статус, услуга, мастер, время и пояснение о звонке. Конфликт слота: `409 SLOT_TAKEN`.

## 4. Авторизация

- `POST /api/auth/sign-in`
- `POST /api/auth/sign-out`

Вход только ADMIN/STAFF по телефону и паролю; generic-ошибка не раскрывает существование пользователя.

## 5. Администратор

- `GET /api/admin/booking-requests?status=PENDING`
- `POST /api/admin/bookings/{id}/confirm`
- `POST /api/admin/bookings/{id}/cancel`
- `POST /api/admin/bookings/{id}/reschedule`
- CRUD `/api/admin/services`, `/staff`, `/schedules`, `/exceptions`
- `GET/PATCH /api/admin/settings`
- `GET /api/admin/audit`

Все операции проверяют роль, организацию и пишут историю/аудит.

## 6. Мастер

- `GET /api/staff/schedule?from=&to=`
- `POST /api/staff/bookings/{id}/complete`
- `POST /api/staff/bookings/{id}/no-show`

Сервер фильтрует по StaffProfile; передача чужого `staffId` не расширяет доступ.

## 7. Идемпотентность и конкурентность

Повтор с тем же ключом и payload возвращает исходный результат. Другой payload с тем же ключом — `409`. Операция бронирования использует транзакцию и обрабатывает нарушение exclusion constraint как `SLOT_TAKEN`.
