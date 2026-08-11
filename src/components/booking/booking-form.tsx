"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import styles from "./booking-calendar.module.css";
import {
  addCalendarDays,
  formatStudioSlot,
  isValidBookingPhone,
  studioToday,
  type AvailableSlot,
} from "./booking-form-utils";

interface Service {
  id: string;
  name: string;
  category: "MANICURE" | "PEDICURE";
  durationMinutes: number;
  priceMinor: number;
}

interface Master {
  id: string;
  displayName: string;
  slug: string;
}

interface CalendarData {
  constraints: { bookingHorizonDays: number };
  dates: Array<{ date: string; staffIds: string[] }>;
}

interface DayAvailability {
  masters: Array<{ id: string; displayName: string; starts: string[] }>;
  slots: AvailableSlot[];
}

type ContactErrors = Partial<Record<"firstName" | "lastName" | "phone", string>>;

const choiceClass =
  "min-h-12 w-full rounded-[2px] border p-4 text-left transition focus-visible:outline-2";
const weekdayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function price(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function monthTitle(month: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00.000Z`));
}

function moveMonth(month: string, offset: number) {
  const [year, value] = month.split("-").map(Number);
  return new Date(Date.UTC(year, value - 1 + offset, 1)).toISOString().slice(0, 7);
}

function monthCells(month: string) {
  const [year, value] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year, value, 0)).getUTCDate();
  const weekday = new Date(Date.UTC(year, value - 1, 1)).getUTCDay();
  const leading = weekday === 0 ? 6 : weekday - 1;
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from(
      { length: count },
      (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`,
    ),
  ];
}

export function BookingForm({
  fixedMaster,
  initialServiceId,
}: {
  fixedMaster?: Master;
  initialServiceId?: string;
}) {
  const today = useMemo(() => studioToday(), []);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [date, setDate] = useState("");
  const [day, setDay] = useState<DayAvailability | null>(null);
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [masterId, setMasterId] = useState(fixedMaster?.id ?? "");
  const [loading, setLoading] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(Boolean(initialServiceId));
  const [loadingDay, setLoadingDay] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [success, setSuccess] = useState<{
    id: string;
    startAt: string;
    staff: { displayName: string };
  } | null>(null);
  const requestKey = useRef<{ fingerprint: string; key: string } | null>(null);
  const calendarRequest = useRef(0);
  const dayRequest = useRef(0);

  const service = services.find((item) => item.id === serviceId);
  const availableDates = useMemo(
    () => new Set(calendar?.dates.map((item) => item.date) ?? []),
    [calendar],
  );
  const selectedMaster = fixedMaster ?? day?.masters.find((master) => master.id === masterId);
  const maxDate = addCalendarDays(today, calendar?.constraints.bookingHorizonDays ?? 60);
  const canMoveBack = moveMonth(month, -1) >= today.slice(0, 7);
  const canMoveForward = moveMonth(month, 1) <= maxDate.slice(0, 7);

  useEffect(() => {
    let active = true;
    fetch("/api/services")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const loaded = (data.services ?? []) as Service[];
        setServices(loaded);
        if (initialServiceId && !loaded.some((item) => item.id === initialServiceId)) {
          setServiceId("");
        }
      })
      .catch(() => active && setError("Не удалось загрузить услуги. Обновите страницу."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [initialServiceId]);

  useEffect(() => {
    if (!serviceId) return;
    const requestId = ++calendarRequest.current;
    const controller = new AbortController();
    const staffQuery = fixedMaster ? `&staffId=${encodeURIComponent(fixedMaster.id)}` : "";
    fetch(
      `/api/availability/calendar?serviceId=${encodeURIComponent(serviceId)}&month=${month}${staffQuery}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Не удалось загрузить календарь");
        if (calendarRequest.current === requestId) setCalendar(data);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError")
          setError(reason.message || "Не удалось загрузить календарь.");
      })
      .finally(() => {
        if (calendarRequest.current === requestId) setLoadingCalendar(false);
      });
    return () => controller.abort();
  }, [fixedMaster, month, serviceId]);

  useEffect(() => {
    if (!serviceId || !date) return;
    const requestId = ++dayRequest.current;
    const controller = new AbortController();
    const staffQuery = fixedMaster ? `&staffId=${encodeURIComponent(fixedMaster.id)}` : "";
    fetch(
      `/api/availability?serviceId=${encodeURIComponent(serviceId)}&date=${date}${staffQuery}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Не удалось загрузить время");
        if (dayRequest.current === requestId) setDay(data);
      })
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message || "Не удалось загрузить время.");
      })
      .finally(() => {
        if (dayRequest.current === requestId) setLoadingDay(false);
      });
    return () => controller.abort();
  }, [date, fixedMaster, serviceId]);

  function resetAfterService(id: string) {
    setServiceId(id);
    setMonth(today.slice(0, 7));
    setCalendar(null);
    setDate("");
    setDay(null);
    setSlot(null);
    setMasterId(fixedMaster?.id ?? "");
    setSuccess(null);
    setError("");
    setLoadingCalendar(Boolean(id));
  }

  function selectDate(value: string) {
    setDate(value);
    setDay(null);
    setSlot(null);
    setMasterId(fixedMaster?.id ?? "");
    setError("");
    setLoadingDay(true);
  }

  function changeMonth(value: string) {
    setMonth(value);
    setCalendar(null);
    setLoadingCalendar(true);
    setError("");
  }

  function selectSlot(value: AvailableSlot) {
    setSlot(value);
    setMasterId(fixedMaster?.id ?? "");
    setError("");
  }

  function returnToCalendar() {
    setDate("");
    setDay(null);
    setSlot(null);
    setMasterId(fixedMaster?.id ?? "");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !slot || !masterId) return;
    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") || "").trim();
    const lastName = String(form.get("lastName") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const validationErrors: ContactErrors = {
      ...(!firstName ? { firstName: "Укажите имя" } : {}),
      ...(!lastName ? { lastName: "Укажите фамилию" } : {}),
      ...(!isValidBookingPhone(phone) ? { phone: "Проверьте номер телефона" } : {}),
    };
    if (Object.keys(validationErrors).length > 0) {
      setContactErrors(validationErrors);
      return;
    }
    setContactErrors({});
    const payload = {
      serviceIds: [service.id],
      staffId: masterId,
      startAt: slot.startAt,
      customer: { firstName, lastName, phone },
    };
    const fingerprint = JSON.stringify(payload);
    if (!requestKey.current || requestKey.current.fingerprint !== fingerprint) {
      requestKey.current = { fingerprint, key: crypto.randomUUID() };
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/booking-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey.current.key,
        },
        body: fingerprint,
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === "SLOT_TAKEN") {
          setDay((current) =>
            current
              ? { ...current, slots: current.slots.filter((item) => item.startAt !== slot.startAt) }
              : current,
          );
          setSlot(null);
          setMasterId(fixedMaster?.id ?? "");
          throw new Error("Это время только что заняли. Выберите другой вариант.");
        }
        throw new Error(data.message || "Не удалось отправить заявку. Проверьте данные.");
      }
      setSuccess(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div aria-live="polite">
        <Card className="mt-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Заявка отправлена
          </p>
          <h2 className="mt-4 font-serif text-4xl font-light sm:text-5xl">Время зарезервировано</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-foreground/75">
            Мастер {success.staff.displayName}, {formatStudioSlot(success.startAt)}. Администратор
            позвонит вам, чтобы уточнить детали записи.
          </p>
          <p className="mt-4 text-sm text-muted">Номер заявки: {success.id}</p>
        </Card>
      </div>
    );
  }

  if (!service) {
    return (
      <Card className="mt-8">
        <h2 className="font-serif text-4xl font-light">
          {fixedMaster ? `Выберите услугу у мастера ${fixedMaster.displayName}` : "Выберите услугу"}
        </h2>
        <div className="mt-7 grid gap-3 md:grid-cols-2">
          {services.map((item) => (
            <button
              className={`${choiceClass} border-line bg-background hover:border-accent`}
              key={item.id}
              onClick={() => resetAfterService(item.id)}
              type="button"
            >
              <span className="block font-medium">{item.name}</span>
              <span className="mt-1 block text-sm text-muted">
                {item.durationMinutes} минут · {price(item.priceMinor)}
              </span>
            </button>
          ))}
        </div>
        {loading ? <p className="mt-5 text-muted">Загружаем услуги…</p> : null}
        {error ? <ErrorMessage text={error} /> : null}
      </Card>
    );
  }

  const mastersForSlot = slot
    ? (day?.masters.filter((master) => slot.staffIds.includes(master.id)) ?? [])
    : [];

  return (
    <div className="mt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
        <div>
          <p className="font-medium">{service.name}</p>
          <p className="text-sm text-muted">
            {service.durationMinutes} минут · {price(service.priceMinor)}
            {fixedMaster ? ` · ${fixedMaster.displayName}` : ""}
          </p>
        </div>
        <Button variant="ghost" onClick={() => resetAfterService("")} type="button">
          Другая услуга
        </Button>
      </div>

      {!date ? (
        <Card className={styles.calendarCard}>
          <div className={styles.calendarContent}>
            <div className={styles.calendarHeader}>
              <button
                aria-label="Предыдущий месяц"
                className={styles.monthButton}
                disabled={!canMoveBack}
                onClick={() => changeMonth(moveMonth(month, -1))}
                type="button"
              >
                ←
              </button>
              <h2 className="text-center font-serif text-3xl font-light capitalize sm:text-4xl">
                {monthTitle(month)}
              </h2>
              <button
                aria-label="Следующий месяц"
                className={styles.monthButton}
                disabled={!canMoveForward}
                onClick={() => changeMonth(moveMonth(month, 1))}
                type="button"
              >
                →
              </button>
            </div>
            <div className={styles.calendarGrid}>
              {weekdayNames.map((name) => (
                <span className="py-2 text-xs uppercase tracking-[0.08em] text-muted" key={name}>
                  {name}
                </span>
              ))}
              {monthCells(month).map((value, index) =>
                value ? (
                  <button
                    aria-label={`Выбрать ${value}`}
                    className={`${styles.dateCell} rounded-[2px] border text-sm transition ${availableDates.has(value) ? "border-line bg-background hover:border-accent hover:bg-lavender/20" : "cursor-not-allowed border-transparent text-muted/40"}`}
                    disabled={!availableDates.has(value)}
                    key={value}
                    onClick={() => selectDate(value)}
                    type="button"
                  >
                    {Number(value.slice(-2))}
                  </button>
                ) : (
                  <span aria-hidden="true" className={styles.dateCell} key={`empty-${index}`} />
                ),
              )}
            </div>
            {loadingCalendar ? (
              <p className="mt-5 text-center text-muted">Проверяем свободные даты…</p>
            ) : null}
            {!loadingCalendar && calendar?.dates.length === 0 ? (
              <p className="mt-5 text-center text-foreground/75">
                В этом месяце свободных дат нет. Переключите месяц.
              </p>
            ) : null}
            {error ? <ErrorMessage text={error} /> : null}
          </div>
        </Card>
      ) : null}

      {date && !slot ? (
        <Card>
          <StepHeading
            action="Изменить дату"
            onBack={returnToCalendar}
            title={`Свободное время на ${date.split("-").reverse().join(".")}`}
          />
          {loadingDay ? <p className="mt-6 text-muted">Загружаем время…</p> : null}
          <div className={styles.timeGrid}>
            {day?.slots.map((item) => (
              <button
                className="min-h-12 rounded-[2px] border border-line bg-background text-sm transition hover:border-accent hover:bg-lavender/20"
                key={item.startAt}
                onClick={() => selectSlot(item)}
                type="button"
              >
                {formatStudioSlot(item.startAt)}
              </button>
            ))}
          </div>
          {!loadingDay && day?.slots.length === 0 ? (
            <p className="mt-6 text-foreground/75">
              Свободное время закончилось. Выберите другую дату.
            </p>
          ) : null}
          {error ? <ErrorMessage text={error} /> : null}
        </Card>
      ) : null}

      {slot && !fixedMaster && !masterId ? (
        <Card>
          <StepHeading
            action="Изменить время"
            onBack={() => setSlot(null)}
            title="Выберите свободного мастера"
          />
          <p className="mt-4 text-sm text-muted">
            {date.split("-").reverse().join(".")} · {formatStudioSlot(slot.startAt)}
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {mastersForSlot.map((master) => (
              <button
                className={`${choiceClass} border-line bg-background hover:border-accent`}
                key={master.id}
                onClick={() => setMasterId(master.id)}
                type="button"
              >
                <span className="font-medium">{master.displayName}</span>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {slot && masterId ? (
        <Card>
          <StepHeading
            action={fixedMaster ? "Изменить время" : "Другой мастер"}
            onBack={() => (fixedMaster ? setSlot(null) : setMasterId(""))}
            title="Оставьте контакты"
          />
          <p className="mt-4 text-sm text-muted">
            {date.split("-").reverse().join(".")} · {formatStudioSlot(slot.startAt)} ·{" "}
            {selectedMaster?.displayName}
          </p>
          <form className="mt-7" onSubmit={submit}>
            <div className="grid gap-5 md:grid-cols-2">
              <ContactField
                error={contactErrors.firstName}
                label="Имя"
                name="firstName"
                autoComplete="given-name"
              />
              <ContactField
                error={contactErrors.lastName}
                label="Фамилия"
                name="lastName"
                autoComplete="family-name"
              />
              <ContactField
                error={contactErrors.phone}
                label="Телефон"
                name="phone"
                autoComplete="tel"
                className="md:col-span-2"
                inputMode="tel"
                placeholder="+7 900 000-00-00"
                type="tel"
              />
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">
              После отправки время будет зарезервировано. Администратор позвонит для уточнения
              деталей.
            </p>
            <Button className="mt-6 w-full sm:w-auto" disabled={submitting} type="submit">
              {submitting ? "Отправляем…" : "Отправить заявку"}
            </Button>
          </form>
          {error ? <ErrorMessage text={error} /> : null}
        </Card>
      ) : null}
    </div>
  );
}

function StepHeading({
  title,
  action,
  onBack,
}: {
  title: string;
  action: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="font-serif text-3xl font-light sm:text-4xl">{title}</h2>
      <button
        className="text-xs font-medium uppercase tracking-[0.12em] text-accent underline-offset-4 hover:underline"
        onClick={onBack}
        type="button"
      >
        {action}
      </button>
    </div>
  );
}

function ContactField({
  error,
  className = "",
  ...props
}: React.ComponentProps<typeof Field> & { error?: string }) {
  const errorId = `${props.name}-error`;
  return (
    <div className={className}>
      <Field
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        required
        {...props}
      />
      {error ? (
        <p className="mt-2 text-sm text-[#9B4949]" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <p className="mt-6 border border-[#B56B6B]/35 bg-[#F7E9E6] p-4 text-sm" role="alert">
      {text}
    </p>
  );
}
