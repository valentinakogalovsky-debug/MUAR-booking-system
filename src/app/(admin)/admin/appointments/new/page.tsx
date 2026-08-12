import { Role } from "@/generated/prisma/client";
import { BookingForm } from "@/components/booking/booking-form";
import { Container } from "@/components/ui/container";
import { requireRole } from "@/lib/auth/permissions";

export default async function NewAdminBookingPage() {
  await requireRole(Role.ADMIN);
  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Работа с клиентом</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Создать запись вручную</h1>
        <p className="mt-4 max-w-3xl text-foreground/70">
          Выберите только доступное время. Цена, длительность и технический перерыв будут рассчитаны
          сервером, а запись сразу станет подтверждённой.
        </p>
        <BookingForm adminMode />
      </Container>
    </main>
  );
}
