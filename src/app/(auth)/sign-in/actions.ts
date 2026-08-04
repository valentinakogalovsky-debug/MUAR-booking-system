"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export interface SignInState {
  error?: string;
}

export async function authenticate(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  try {
    await signIn("credentials", {
      phone: formData.get("phone"),
      password: formData.get("password"),
      redirectTo: "/auth/continue",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Не удалось войти. Проверьте телефон и пароль или попробуйте позже." };
    }
    throw error;
  }
}
