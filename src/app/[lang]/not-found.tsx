import { getDictionary } from "@/i18n/dictionaries";

export default async function NotFound() {
  const dict = await getDictionary();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">{dict.notFound.title}</h1>
      <p className="text-muted-foreground">{dict.notFound.description}</p>
    </main>
  );
}
