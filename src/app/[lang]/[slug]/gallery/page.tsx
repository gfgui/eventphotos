import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GallerySkeleton } from "@/components/gallery/gallery-skeleton";
import { GalleryView } from "@/components/gallery/gallery-view";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { fixedLocale, getEvent } from "@/lib/events";
import { getCurrentGuest } from "@/lib/guest-session";
import { listGalleryPhotos } from "@/lib/media";
import { getPodium } from "@/lib/podium";
import { parseAppearance } from "@/themes/config";

type Props = PageProps<"/[lang]/[slug]/gallery">;

export default function GalleryPage({ params }: Props) {
  return (
    <Suspense fallback={<GallerySkeleton />}>
      <Gallery params={params} />
    </Suspense>
  );
}

async function Gallery({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const [event, lang, dict] = await Promise.all([
    getEvent(slug),
    getLocale(),
    getDictionary(),
  ]);

  const locale = fixedLocale(event);
  if (locale && locale !== lang) redirect(`/${locale}/${slug}/gallery`);

  const guest = await getCurrentGuest(event.id);
  if (!guest) redirect(`/${lang}/${slug}`);

  const hasPodium = event.likesRankingEnabled || event.uploadsRankingEnabled;
  const [photos, podium] = await Promise.all([
    listGalleryPhotos(event.id, guest.id),
    hasPodium ? getPodium(event) : null,
  ]);

  return (
    <GalleryView
      lang={lang}
      slug={event.slug}
      event={{ name: event.name, honorees: event.honorees }}
      guest={{
        name: guest.name,
        avatar: guest.avatar,
        roleName: guest.role.name,
      }}
      photos={photos}
      podium={podium}
      feedStyle={parseAppearance(event.appearance).feedStyle}
      canUpload={event.status === "OPEN"}
      dict={dict.gallery}
      languageLabel={locale ? undefined : dict.languageSwitcher.label}
    />
  );
}
