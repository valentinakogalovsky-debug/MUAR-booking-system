const RUSSIAN_PHONE_LENGTH = 11;

export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10 && digits.startsWith("9")) {
    return `+7${digits}`;
  }

  if (digits.length !== RUSSIAN_PHONE_LENGTH || !["7", "8"].includes(digits[0])) {
    return null;
  }

  return `+7${digits.slice(1)}`;
}
