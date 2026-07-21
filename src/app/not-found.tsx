import { PagePlaceholder } from "@/components/page-placeholder";
export default function NotFound() {
  return (
    <PagePlaceholder
      eyebrow="Ошибка 404"
      title="Страница не найдена"
      description="Проверьте адрес или вернитесь на главную страницу сайта."
    />
  );
}
