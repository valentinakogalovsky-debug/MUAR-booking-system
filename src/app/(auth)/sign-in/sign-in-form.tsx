"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function SignInForm() {
  const [state, action, pending] = useActionState(authenticate, {});

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
      <Field
        autoComplete="current-password"
        label="Пароль"
        name="password"
        required
        type="password"
      />
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
