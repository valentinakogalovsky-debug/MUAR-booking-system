"use client";

import { useActionState, useState } from "react";
import { authenticate } from "./actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function SignInForm() {
  const [state, action, pending] = useActionState(authenticate, {});
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form action={action} className="mt-10 space-y-5">
      <Field
        autoComplete="tel"
        inputMode="tel"
        label="Телефон"
        name="phone"
        placeholder="+7 900 000-00-00"
        required
      />
      <div>
        <label className="mb-2 block text-xs tracking-[0.06em] text-muted" htmlFor="password">
          Пароль
        </label>
        <div className="relative">
          <input
            autoComplete="current-password"
            className="min-h-12 w-full rounded-[2px] border border-line bg-surface px-4 py-3 pr-12 text-base text-foreground outline-none transition focus:border-accent"
            id="password"
            name="password"
            required
            type={passwordVisible ? "text" : "password"}
          />
          <button
            aria-label={passwordVisible ? "Скрыть пароль" : "Показать пароль"}
            aria-pressed={passwordVisible}
            className="absolute inset-y-0 right-0 flex min-h-12 min-w-12 items-center justify-center text-muted transition hover:text-accent"
            onClick={() => setPasswordVisible((visible) => !visible)}
            type="button"
          >
            {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>
      {state.error ? (
        <p aria-live="polite" className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Входим…" : "Войти"}
      </Button>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="m4 4 16 16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path
        d="M9.5 6.3A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16.5 16.5 0 0 1-2.6 3.3M14.5 17.7A10.7 10.7 0 0 1 12 18c-6 0-9.5-6-9.5-6a16.5 16.5 0 0 1 2.6-3.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
