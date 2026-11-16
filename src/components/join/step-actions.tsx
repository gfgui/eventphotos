import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  backLabel: string;
  nextLabel: string;
  pendingLabel?: string;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled: boolean;
  isPending?: boolean;
};

export function StepActions({
  backLabel,
  nextLabel,
  pendingLabel,
  onBack,
  onNext,
  isNextDisabled,
  isPending = false,
}: Props) {
  return (
    <div className="mt-auto flex gap-3 pt-8">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={isPending}
        className="h-12 px-4"
      >
        {backLabel}
      </Button>
      <Button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled || isPending}
        className="h-12 flex-1"
      >
        {nextLabel}
        {isPending ? (
          <Spinner aria-label={pendingLabel} data-icon="inline-end" />
        ) : (
          <ArrowRightIcon data-icon="inline-end" />
        )}
      </Button>
    </div>
  );
}
