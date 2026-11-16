import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { type SortMode, sortModes } from "@/lib/ranking";

type Props = {
  value: SortMode;
  onChange: (mode: SortMode) => void;
  dict: Pick<Dictionary["gallery"], "sortLabel" | "sort">;
};

export function SortControl({ value, onChange, dict }: Props) {
  return (
    <fieldset className="flex min-w-0 gap-1.5">
      <legend className="sr-only">{dict.sortLabel}</legend>
      {sortModes.map((mode) => (
        <Button
          key={mode}
          type="button"
          size="sm"
          variant={mode === value ? "secondary" : "ghost"}
          aria-pressed={mode === value}
          onClick={() => onChange(mode)}
        >
          {dict.sort[mode]}
        </Button>
      ))}
    </fieldset>
  );
}
