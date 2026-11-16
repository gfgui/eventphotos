import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";

type Props = { onPick?: () => void; dict: Dictionary["gallery"] };

export function EmptyGallery({ onPick, dict }: Props) {
  return (
    <Empty className="min-h-[340px] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UploadIcon />
        </EmptyMedia>
        <EmptyTitle className="text-2xl">{dict.emptyTitle}</EmptyTitle>
        <EmptyDescription>{dict.emptyDescription}</EmptyDescription>
      </EmptyHeader>
      {onPick && (
        <EmptyContent>
          <Button type="button" size="lg" onClick={onPick}>
            {dict.emptyAction}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
