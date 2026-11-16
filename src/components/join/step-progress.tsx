import { Progress, ProgressLabel } from "@/components/ui/progress";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";

type Props = { step: number; total: number; dict: Dictionary["join"] };

export function StepProgress({ step, total, dict }: Props) {
  return (
    <Progress value={(step / total) * 100} className="mb-8 gap-2.5">
      <ProgressLabel className="text-[11px] text-muted-foreground">
        {format(dict.stepProgress, { step, total })}
      </ProgressLabel>
      <span
        aria-hidden="true"
        className="ml-auto text-[11px] font-medium text-muted-foreground tabular-nums"
      >
        {step}/{total}
      </span>
    </Progress>
  );
}
