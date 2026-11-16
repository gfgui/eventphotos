import { Suspense } from "react";
import { EventSkeleton } from "@/components/event-skeleton";
import { getEvent } from "@/lib/events";
import { parseAppearance } from "@/themes/config";
import { ThemeScope } from "@/themes/theme-scope";

type Props = LayoutProps<"/[lang]/[slug]">;

export default function EventLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<EventSkeleton />}>
      <ThemedEvent params={params}>{children}</ThemedEvent>
    </Suspense>
  );
}

/** Every page of an event renders under the theme its hosts chose. */
async function ThemedEvent({ children, params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);
  const { theme, headingFont } = parseAppearance(event.appearance);

  return (
    <ThemeScope theme={theme} headingFont={headingFont}>
      {children}
    </ThemeScope>
  );
}
