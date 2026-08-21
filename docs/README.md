# Документация MUARÉ

Версия комплекта: 1.1
Дата: 22.07.2026

Документы используют единую нумерацию, терминологию и модель MVP:

1. [spec.md](../spec.md) — утверждённый источник продуктовых требований.
2. [PLAN.md](../PLAN.md) — последовательность разработки и текущий статус.
3. [PRD](./PRD.md) — развёрнутое описание продукта и его границ.
4. [Business Rules](./BUSINESS_RULES.md) — подробные правила студии и записи.
5. [UX Specification](./UX_SPECIFICATION.md) — экраны, действия, состояния и переходы.
6. [Data Model](./DATA_MODEL.md) — сущности, связи и ограничения PostgreSQL.
7. [API Specification](./API_SPECIFICATION.md) — серверные контракты.
8. [Architecture](./ARCHITECTURE.md) — модули, зависимости и безопасность.
9. [Content Specification](./source/muare-content-spec.html) — контент сайта.
10. [Brand & Design Guide](./source/muare-brand-guide.html) — визуальная система.
11. [Test Plan](./TEST_PLAN.md) — обязательные P0/P1 проверки MVP.
12. [Release Runbook](./RELEASE_RUNBOOK.md) — staging, backup, миграции и rollback.
13. [Release Notes](./RELEASE_NOTES.md) — состав и результат проверки release candidate.

`spec.md` определяет продукт, а `PLAN.md` — порядок реализации. При конфликте
между ними работа останавливается: ИИ сообщает о противоречии и не выбирает вариант
без решения пользователя.
