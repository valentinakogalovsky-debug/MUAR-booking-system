import { PagePlaceholder } from "@/components/page-placeholder";
export default function MyBookingsPage() {
  return (
    <PagePlaceholder
      actionHref="/booking"
      actionLabel="Новая запись"
      eyebrow="Клиент"
      title="Мои записи"
      description="Здесь клиент сможет просматривать, переносить и отменять только собственные записи."
    />
  );
}
