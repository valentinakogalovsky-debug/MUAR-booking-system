"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { scheduleDateUrl } from "@/lib/schedule/url";

export function ScheduleDateFilter({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();
  const [date, setDate] = useState(selectedDate);
  const [pending, startTransition] = useTransition();

  function showDate(nextDate: string) {
    if (!nextDate) return;
    startTransition(() => router.replace(scheduleDateUrl(nextDate)));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    showDate(date);
  }

  return (
    <form className="mt-8 flex flex-wrap items-end gap-4" method="get" onSubmit={submit}>
      <label className="block text-xs tracking-[0.06em] text-muted">
        Показать дату
        <input
          className="mt-2 min-h-12 w-full rounded-[2px] border border-line bg-surface px-4 py-3 text-base text-foreground outline-none transition focus:border-accent"
          disabled={pending}
          name="date"
          onChange={(event) => {
            const nextDate = event.target.value;
            setDate(nextDate);
            showDate(nextDate);
          }}
          required
          type="date"
          value={date}
        />
      </label>
      <Button disabled={pending} type="submit" variant="ghost">
        {pending ? "Обновляем…" : "Показать"}
      </Button>
      <p aria-live="polite" className="min-h-5 text-sm text-muted">
        {pending ? "Загружаем расписание выбранного дня" : null}
      </p>
    </form>
  );
}
