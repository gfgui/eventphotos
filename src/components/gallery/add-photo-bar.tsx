import { CameraIcon, ImagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  labels: { takePhoto: string; choosePhotos: string };
  error?: string;
  onTakePhoto: () => void;
  onChoosePhotos: () => void;
};

/** Always at hand: the phone's camera, or photos already in its gallery. */
export function AddPhotoBar({
  labels,
  error,
  onTakePhoto,
  onChoosePhotos,
}: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl">
      <div className="mx-auto max-w-[508px]">
        {error && (
          <p role="alert" className="mb-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" onClick={onTakePhoto} className="h-12">
            <CameraIcon data-icon="inline-start" />
            {labels.takePhoto}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onChoosePhotos}
            className="h-12"
          >
            <ImagesIcon data-icon="inline-start" />
            {labels.choosePhotos}
          </Button>
        </div>
      </div>
    </div>
  );
}
